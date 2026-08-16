'use client';

import React from 'react';
import { Mic, Search, Layers, Cpu, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PipelineStageStatus } from '../lib/types/rag';

interface PipelineStatusProps {
  currentStage: PipelineStageStatus;
}

export default function PipelineStatus({ currentStage }: PipelineStatusProps) {
  const stages = [
    { key: 'stt', label: 'Speech STT', icon: Mic },
    { key: 'retrieval', label: 'BM25 + BGE-M3', icon: Search },
    { key: 'rerank', label: 'Cross-Reranker', icon: Layers },
    { key: 'generation', label: 'Gemini LLM', icon: Cpu },
    { key: 'grounding', label: 'Grounding Check', icon: ShieldCheck },
  ];

  const getStageState = (stageKey: string) => {
    if (currentStage === 'complete') return 'complete';
    if (currentStage === 'idle') return 'idle';
    if (currentStage === 'error') return 'idle';

    const order = ['stt', 'retrieval', 'rerank', 'generation', 'grounding'];
    const currentIndex = order.indexOf(currentStage);
    const stageIndex = order.indexOf(stageKey);

    if (stageIndex < currentIndex) return 'complete';
    if (stageIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 flex items-center justify-between overflow-x-auto text-xs">
      {stages.map((stage, idx) => {
        const Icon = stage.icon;
        const state = getStageState(stage.key);

        return (
          <React.Fragment key={stage.key}>
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                  state === 'complete'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : state === 'active'
                    ? 'bg-blue-100 text-blue-700 border border-blue-500 animate-pulse'
                    : 'bg-white text-slate-400 border border-slate-200'
                }`}
              >
                {state === 'complete' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Icon className="h-3 w-3" />
                )}
              </div>
              <span
                className={`font-medium ${
                  state === 'complete'
                    ? 'text-emerald-700'
                    : state === 'active'
                    ? 'text-blue-700 font-semibold'
                    : 'text-slate-500'
                }`}
              >
                {stage.label}
              </span>
            </div>

            {idx < stages.length - 1 && (
              <div className={`h-px w-6 shrink-0 ${state === 'complete' ? 'bg-emerald-200' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
