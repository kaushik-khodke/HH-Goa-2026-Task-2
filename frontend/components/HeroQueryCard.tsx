'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Send, 
  Globe, 
  ChevronDown, 
  Check, 
  ChevronRight, 
  Search, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  Volume2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../lib/utils/formatters';
import { PipelineStageStatus } from '../lib/types/rag';
import { PcmWavRecorder } from '../lib/utils/audioRecorder';

interface HeroQueryCardProps {
  query: string;
  onQueryChange: (val: string) => void;
  onSubmit: (overrideText?: string) => void;
  onVoiceBlobSubmit?: (blob: Blob) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  currentStage: PipelineStageStatus;
  isLoading: boolean;
}

export default function HeroQueryCard({
  query,
  onQueryChange,
  onSubmit,
  onVoiceBlobSubmit,
  selectedLanguage,
  onLanguageChange,
  currentStage,
  isLoading,
}: HeroQueryCardProps) {
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [micStatusText, setMicStatusText] = useState('Click microphone to speak');
  const [isMounted, setIsMounted] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const pcmRecorderRef = useRef<PcmWavRecorder | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const capturedTextRef = useRef<string>('');

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const quickSamples = [
    { label: 'Manhattan Project', text: 'What was the Manhattan project and what was its impact?' },
    { label: 'हिंदी (Hindi)', text: 'मैनहट्टन परियोजना की सफलता का प्रभाव क्या था?' },
    { label: 'MS MARCO Passage', text: 'Explain the summary of the indexed scientific passage.' },
    { label: 'मराठी (Marathi)', text: 'मॅनहॅटन प्रकल्पाचा परिणाम काय होता?' },
    { label: 'বাংলা (Bengali)', text: 'ম্যানহাটন প্রকল্পের উদ্দেশ্য কী ছিল?' },
  ];

  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = false;
          rec.interimResults = true;

          rec.onstart = () => {
            setMicStatusText(`Listening in ${currentLang.name}... Speak clearly`);
          };

          rec.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }

            const currentText = (finalTranscript || interimTranscript).trim();
            if (currentText) {
              capturedTextRef.current = currentText;
              onQueryChange(currentText);
              setMicStatusText(`Live: "${currentText}"`);
            }
          };

          rec.onerror = (e: any) => {
            console.warn('Browser SpeechRecognition notice:', e.error);
          };

          recognitionRef.current = rec;
        } catch (e) {
          console.warn('SpeechRecognition init error:', e);
        }
      }
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentLang, onQueryChange]);

  const startVolumeVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (e) {
      console.warn('Volume visualizer init notice:', e);
    }
  };

  const handleToggleMic = async () => {
    if (isLoading) return;
    setMicError(null);

    if (isListening) {
      // 1. STOP RECORDING
      setIsListening(false);
      setAudioLevel(0);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (e) {}
      }

      setMicStatusText('Processing audio with Python SpeechRecognition...');

      // Stop browser recognition
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      // Priority A: Stop PCM WAV recorder
      if (pcmRecorderRef.current) {
        try {
          const wavBlob = await pcmRecorderRef.current.stop();
          pcmRecorderRef.current = null;
          if (onVoiceBlobSubmit) {
            onVoiceBlobSubmit(wavBlob);
            return;
          }
        } catch (e) {
          console.warn('PCM stop fallback:', e);
        }
      }

      // Priority B: Stop MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      } else if (capturedTextRef.current.trim()) {
        onSubmit(capturedTextRef.current.trim());
      }
    } else {
      // 2. START RECORDING
      capturedTextRef.current = '';
      audioChunksRef.current = [];

      try {
        // Attempt PCM WAV Recorder first
        const pcmRecorder = new PcmWavRecorder();
        await pcmRecorder.start();
        pcmRecorderRef.current = pcmRecorder;

        // Start volume visualizer
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        startVolumeVisualizer(stream);

        // Also setup standard MediaRecorder as container fallback
        try {
          const mr = new MediaRecorder(stream);
          mr.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
          };
          mr.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || 'audio/webm' });
            if (onVoiceBlobSubmit) {
              onVoiceBlobSubmit(blob);
            } else if (capturedTextRef.current.trim()) {
              onSubmit(capturedTextRef.current.trim());
            }
          };
          mr.start(250);
          mediaRecorderRef.current = mr;
        } catch (mrErr) {
          console.warn('MediaRecorder fallback init:', mrErr);
        }

        setIsListening(true);
        setMicStatusText(`Listening in ${currentLang.name}... Speak now, then click mic to finish`);

        // Start speech recognition for live word streaming
        if (recognitionRef.current) {
          recognitionRef.current.lang = currentLang.sttLang;
          try { recognitionRef.current.start(); } catch (e) {}
        }
      } catch (err: any) {
        console.error('Microphone capture error:', err);
        setMicError('Microphone permission blocked. Please allow mic in browser settings.');
        setMicStatusText('Mic permission denied. Use sample questions or type below.');
        setIsListening(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim() && !isLoading) {
      onSubmit();
    }
  };

  const pipelineStages = [
    { key: 'stt', label: 'Python STT', sub: 'SpeechRecognition Engine', icon: Mic },
    { key: 'retrieval', label: 'BM25 + BGE-M3', sub: 'Hybrid Retrieval', icon: Search },
    { key: 'rerank', label: 'Cross-Reranker', sub: 'Re-rank results', icon: Layers },
    { key: 'generation', label: 'Gemini LLM', sub: 'Generate answer', icon: Cpu },
    { key: 'grounding', label: 'Grounding Check', sub: 'Verify & validate', icon: ShieldCheck },
  ];

  const getStageStatus = (stageKey: string) => {
    if (currentStage === 'complete') return 'completed';
    if (currentStage === 'idle' || currentStage === 'error') return 'idle';
    const order = ['stt', 'retrieval', 'rerank', 'generation', 'grounding'];
    const curIdx = order.indexOf(currentStage);
    const thisIdx = order.indexOf(stageKey);
    if (thisIdx < curIdx) return 'completed';
    if (thisIdx === curIdx) return 'active';
    return 'idle';
  };

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Ask anything. <span className="text-blue-600">Get grounded answers.</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Speak via microphone or type your question in English or any Indic language.
          </p>
        </div>

        {/* Language Dropdown Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:border-blue-500 shadow-2xs transition-all"
          >
            <Globe className="h-3.5 w-3.5 text-blue-600" />
            <span>
              {currentLang.name} <span className="text-slate-400">({currentLang.nativeName})</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {isLangDropdownOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsLangDropdownOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      onLanguageChange(lang.code);
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left ${
                      selectedLanguage === lang.code
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>
                      {lang.name} <span className="text-slate-400">({lang.nativeName})</span>
                    </span>
                    {selectedLanguage === lang.code && <Check className="h-3.5 w-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Input Row: Mic + Search Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Circular Microphone + Live Volume Waveform */}
        <div className="flex flex-col items-center gap-2.5 shrink-0">
          <div className="relative">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleToggleMic}
              aria-label={isListening ? 'Stop recording' : 'Start microphone recording'}
              className={`h-24 w-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                isListening
                  ? 'bg-rose-500 text-white shadow-xl shadow-rose-200 scale-105 animate-pulse'
                  : 'bg-white border-2 border-blue-500/80 text-blue-600 shadow-md shadow-blue-100 hover:scale-105 hover:bg-blue-50/40'
              } disabled:opacity-50`}
            >
              {isListening ? (
                <Volume2 className="h-10 w-10 text-white animate-pulse" />
              ) : (
                <Mic className="h-10 w-10 text-blue-600 font-bold" />
              )}
            </button>
            {isListening && (
              <span className="absolute -inset-1 rounded-full border-2 border-rose-400 animate-ping" />
            )}
          </div>

          {/* Real-Time Audio Level Meter */}
          {isListening && (
            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div
                className="bg-emerald-500 h-full transition-all duration-75"
                style={{ width: `${Math.max(8, audioLevel)}%` }}
              />
            </div>
          )}

          <div className="text-center max-w-[210px]">
            <p className="text-xs font-bold text-slate-800 break-words">{micStatusText}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {isMounted ? 'Python SpeechRecognition & 11+ Indic Languages' : 'Speech-to-Text Ready'}
            </p>
          </div>
        </div>

        {/* Search Input Bar + Stepper */}
        <div className="flex-1 w-full space-y-4">
          {/* Query Bar */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              disabled={isLoading}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question in English, Hindi, Bengali, Tamil, Marathi, etc..."
              className="flex-1 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none shadow-2xs"
            />
            <button
              type="button"
              disabled={isLoading || !query.trim()}
              onClick={() => onSubmit()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-40 shrink-0"
            >
              <Send className="h-4 w-4" />
              <span>Ask</span>
            </button>
          </div>

          {/* Quick Demo Question Pills */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
              <Sparkles className="h-3 w-3 text-amber-500" /> Try Sample:
            </span>
            {quickSamples.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onQueryChange(sample.text);
                  onSubmit(sample.text);
                }}
                className="bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-300 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
              >
                {sample.label}
              </button>
            ))}
          </div>

          {/* Horizontal Pipeline Stepper */}
          <div className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between overflow-x-auto text-[11px]">
            {pipelineStages.map((stage, idx) => {
              const Icon = stage.icon;
              const status = getStageStatus(stage.key);

              return (
                <React.Fragment key={stage.key}>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
                        status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : status === 'active'
                          ? 'bg-blue-100 text-blue-700 animate-pulse'
                          : 'bg-white border border-slate-200 text-slate-400'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p
                        className={`font-bold ${
                          status === 'completed'
                            ? 'text-emerald-700'
                            : status === 'active'
                            ? 'text-blue-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {stage.label}
                      </p>
                      <p className="text-[10px] text-slate-400">{stage.sub}</p>
                    </div>
                    {status === 'completed' && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 ml-1" />
                    )}
                  </div>

                  {idx < pipelineStages.length - 1 && (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {micError && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>{micError}</span>
        </div>
      )}
    </div>
  );
}
