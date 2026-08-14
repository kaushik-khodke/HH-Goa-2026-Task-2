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
  Volume2
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../lib/utils/formatters';
import { PipelineStageStatus } from '../lib/types/rag';

interface HeroQueryCardProps {
  query: string;
  onQueryChange: (val: string) => void;
  onSubmit: () => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  currentStage: PipelineStageStatus;
  isLoading: boolean;
}

export default function HeroQueryCard({
  query,
  onQueryChange,
  onSubmit,
  selectedLanguage,
  onLanguageChange,
  currentStage,
  isLoading,
}: HeroQueryCardProps) {
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micStatusText, setMicStatusText] = useState('Click microphone to speak');
  const recognitionRef = useRef<any>(null);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;

        rec.onstart = () => {
          setIsListening(true);
          setMicStatusText('Listening... Speak clearly');
        };

        rec.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          onQueryChange(text);
          setMicStatusText(`Transcribed: "${text}"`);
          setIsListening(false);
        };

        rec.onerror = () => {
          setIsListening(false);
          setMicStatusText('Click microphone to speak');
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, [onQueryChange]);

  const handleToggleMic = () => {
    if (isLoading) return;
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.lang = currentLang.sttLang;
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Ignore if active
        }
      } else {
        // Sample fallback query if Web Speech is unavailable
        onQueryChange('who is the president of India?');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim() && !isLoading) {
      onSubmit();
    }
  };

  const pipelineStages = [
    { key: 'stt', label: 'Speech STT', sub: 'Transcribe speech', icon: Mic },
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
            Speak or type your question in any supported language.
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
        {/* Circular Microphone */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="relative">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleToggleMic}
              className={`h-24 w-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                isListening
                  ? 'bg-rose-500 text-white shadow-xl shadow-rose-200 scale-105 animate-pulse'
                  : 'bg-white border-2 border-blue-500/80 text-blue-600 shadow-md shadow-blue-100 hover:scale-105 hover:bg-blue-50/40'
              } disabled:opacity-50`}
            >
              {isListening ? (
                <Volume2 className="h-10 w-10 text-white" />
              ) : (
                <Mic className="h-10 w-10 text-blue-600" />
              )}
            </button>
            {isListening && (
              <span className="absolute -inset-1 rounded-full border-2 border-rose-400 animate-ping" />
            )}
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-slate-800">{micStatusText}</p>
            <p className="text-[10px] text-slate-400">We support 11+ Indic languages</p>
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
              placeholder="Ask a question in English, Hindi, Bengali, Tamil, etc..."
              className="flex-1 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none shadow-2xs"
            />
            <button
              type="button"
              disabled={isLoading || !query.trim()}
              onClick={onSubmit}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-40 shrink-0"
            >
              <Send className="h-4 w-4" />
              <span>Ask</span>
            </button>
          </div>

          {/* Horizontal Pipeline Stepper (Matching Reference Image) */}
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
    </div>
  );
}
