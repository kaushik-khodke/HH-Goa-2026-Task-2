/**
 * Robust 16kHz PCM WAV Audio Recorder for Python SpeechRecognition backend.
 * Handles Chrome AudioContext auto-resume and 16kHz linear resampling.
 */

export class PcmWavRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private input: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private audioData: Float32Array[] = [];
  private isRecording: boolean = false;
  private captureSampleRate: number = 44100;
  private readonly targetSampleRate: number = 16000;

  async start(): Promise<void> {
    this.audioData = [];

    // 1. Request microphone access
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // 2. Initialize AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();
    
    // Critical: Resume AudioContext if suspended by Chrome autoplay policy
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.captureSampleRate = this.audioContext.sampleRate;
    this.input = this.audioContext.createMediaStreamSource(this.mediaStream);

    // 3. ScriptProcessor to record raw PCM samples
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.isRecording = true;

    this.processor.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const channelData = e.inputBuffer.getChannelData(0);
      // Copy float32 samples
      this.audioData.push(new Float32Array(channelData));
    };

    // Mute gain node to prevent speaker feedback while keeping pipeline active
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);

    this.input.connect(this.processor);
    this.processor.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
  }

  async stop(): Promise<Blob> {
    this.isRecording = false;

    if (this.input) {
      try {
        this.input.disconnect();
      } catch (e) {}
    }
    if (this.processor) {
      try {
        this.processor.disconnect();
      } catch (e) {}
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (e) {}
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch (e) {}
    }

    // Merge audio chunks
    let totalLength = 0;
    for (const chunk of this.audioData) {
      totalLength += chunk.length;
    }

    if (totalLength === 0) {
      // Return a minimal valid empty WAV header if no audio captured
      return this.encodeWAV(new Float32Array(16000), this.targetSampleRate);
    }

    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.audioData) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const resampled = this.resample(merged, this.captureSampleRate, this.targetSampleRate);
    return this.encodeWAV(resampled, this.targetSampleRate);
  }

  private resample(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate || samples.length === 0) {
      return samples;
    }

    const ratio = fromRate / toRate;
    const newLength = Math.max(1, Math.round(samples.length / ratio));
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const idx = Math.floor(srcIndex);
      const frac = srcIndex - idx;
      const s0 = samples[idx] ?? 0;
      const s1 = samples[Math.min(idx + 1, samples.length - 1)] ?? 0;
      result[i] = s0 + frac * (s1 - s0);
    }

    return result;
  }

  private encodeWAV(samples: Float32Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (target: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        target.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, 1, true); // NumChannels (1 = Mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // Convert float samples to 16-bit PCM
    let dataOffset = 44;
    for (let i = 0; i < samples.length; i++, dataOffset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(dataOffset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return new Blob([view], { type: 'audio/wav' });
  }
}
