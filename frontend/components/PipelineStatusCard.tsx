'use client';

import React from 'react';
import { 
  Layers, 
  Mic, 
  Search, 
  Database, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';
import { StageLatency, PipelineStageStatus } from '../lib/types/rag';
import { formatLatencyMs } from '../lib/utils/formatters';

interface PipelineStatusCardProps {
  latency?: StageLatency;
  stage: PipelineStageStatus;
}

export default function PipelineStatusCard({
  latency,
  stage,
}: PipelineStatusCardProps) {
  const steps = [
    {
      num: 1,
      name: 'Speech Recognition',
      desc: 'Audio converted to text',
      time: latency?.stt_ms || 0,
      icon: Mic,
      stageKey: 'stt',
    },
    {
      num: 2,
      name: 'Query Understanding',
      desc: 'Language detection & preprocessing',
      time: latency?.query_proc_ms || 0,
      icon: Search,
      stageKey: 'retrieval',
    },
    {
      num: 3,
      name: 'Retrieval',
      desc: 'Hybrid search (BM25 + Vector)',
      time: (latency?.sparse_retrieval_ms || 0) + (latency?.dense_retrieval_ms || 0) + (latency?.fusion_ms || 0),
      icon: Database,
      stageKey: 'retrieval',
    },
    {
      num: 4,
      name: 'Reranking',
      desc: 'Cross-encoder reranking',
      time: latency?.rerank_ms || 0,
      icon: Layers,
      stageKey: 'rerank',
    },
    {
      num: 5,
      name: 'Generation',
      desc: 'LLM answer generation',
      time: latency?.generation_ms || 0,
      icon: Cpu,
      stageKey: 'generation',
    },
    {
      num: 6,
      name: 'Grounding Check',
      desc: 'Verifying factual grounding',
      time: latency?.guardrail_ms || 0,
      icon: ShieldCheck,
      stageKey: 'grounding',
    },
  ];

  const totalTimeStr = latency ? formatLatencyMs(latency.total_ms) : '-- ms';
  const isCompleted = stage === 'complete' && Boolean(latency);
  const isRunning = stage !== 'idle' && stage !== 'complete' && stage !== 'error';

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <Layers className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-bold text-slate-900">Pipeline Status</h3>
      </div>

      {/* 6 Step List */}
      <div className="space-y-3 flex-1">
        {steps.map((step) => {
          const Icon = step.icon;
          const hasCompleted = (isCompleted || step.time > 0) && latency;
          const isActive = isRunning && stage === step.stageKey;

          return (
            <div
              key={step.num}
              className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                isActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    hasCompleted
                      ? 'bg-emerald-50 text-emerald-700'
                      : isActive
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {step.num}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">{step.name}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">{step.desc}</p>
                </div>
              </div>

              {/* Dynamic Status / Time Badge */}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                {hasCompleted ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">{formatLatencyMs(step.time)}</span>
                  </>
                ) : isActive ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin" />
                    <span className="text-blue-600 font-sans font-semibold text-[11px]">In progress</span>
                  </>
                ) : (
                  <span className="text-[11px] text-slate-400 font-sans">Pending</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Total Latency */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Time</span>
          <span className="text-sm font-extrabold text-blue-600 font-mono">{totalTimeStr}</span>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            isCompleted
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : isRunning
              ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
        >
          {isCompleted ? 'Completed' : isRunning ? 'Running...' : 'Ready'}
        </span>
      </div>
    </div>
  );
}
