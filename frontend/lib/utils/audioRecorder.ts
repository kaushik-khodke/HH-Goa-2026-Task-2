/**
 * High-fidelity 16kHz PCM WAV Audio Recorder for Python SpeechRecognition backend
 */

export class PcmWavRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private input: MediaStreamAudioSourceNode | null = null;
  private audioData: Float32Array[] = [];
  private isRecording: boolean = false;
  private targetSampleRate: number = 16000;

  async start(): Promise<void> {
    this.audioData = [];
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: this.targetSampleRate,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass({ sampleRate: this.targetSampleRate });
    this.input = this.audioContext.createMediaStreamSource(this.mediaStream);

    // Buffer size 4096 gives smooth audio sampling
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const channelData = e.inputBuffer.getChannelData(0);
      this.audioData.push(new Float32Array(channelData));
    };

    this.input.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    this.isRecording = true;
  }

  async stop(): Promise<Blob> {
    this.isRecording = false;

    if (this.processor && this.input) {
      this.input.disconnect();
      this.processor.disconnect();
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
    }

    // Merge buffers
    let totalLength = 0;
    for (const chunk of this.audioData) {
      totalLength += chunk.length;
    }

    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.audioData) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    return this.encodeWAV(merged, this.targetSampleRate);
  }

  private encodeWAV(samples: Float32Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');

    // fmt subchunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, 1, true); // NumChannels (1 mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
    view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
    view.setUint16(34, 16, true); // BitsPerSample (16 bits)

    // data subchunk
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // Write PCM audio samples
    let dataOffset = 44;
    for (let i = 0; i < samples.length; i++, dataOffset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(dataOffset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return new Blob([view], { type: 'audio/wav' });
  }
}
