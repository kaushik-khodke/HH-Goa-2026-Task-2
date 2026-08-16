'use client';

import React from 'react';
import { StageLatency } from '../lib/types/rag';
import { formatLatencyMs } from '../lib/utils/formatters';
import { Clock, Zap } from 'lucide-react';

interface PerformanceMetricsProps {
  latency: StageLatency;
}

export default function PerformanceMetrics({ latency }: PerformanceMetricsProps) {
  if (!latency) return null;

  const items = [
    { label: 'Total Latency', val: latency.total_ms, primary: true },
    { label: 'STT Audio', val: latency.stt_ms },
    { label: 'BM25 Sparse', val: latency.sparse_retrieval_ms },
    { label: 'BGE-M3 Dense', val: latency.dense_retrieval_ms },
    { label: 'RRF Fusion', val: latency.fusion_ms },
    { label: 'Reranker', val: latency.rerank_ms },
    { label: 'Generation', val: latency.generation_ms },
  ];

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-3 text-xs shadow-sm">
      <div className="flex items-center gap-1.5 font-bold text-slate-800 mr-2 shrink-0">
        <Clock className="h-3.5 w-3.5 text-blue-600" />
        <span>Performance Breakdown:</span>
      </div>

      {items.map((item, idx) => (
        <div
          key={idx}
          className={`px-2.5 py-1 rounded-lg border font-mono transition-all ${
            item.primary
              ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <span className="text-slate-500 font-sans mr-1.5">{item.label}:</span>
          <span className={item.primary ? 'text-blue-700' : 'text-slate-800'}>{formatLatencyMs(item.val)}</span>
        </div>
      ))}

      <div className="ml-auto flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
        <Zap className="h-3 w-3 text-amber-500" />
        <span>Budget: &lt; 200 ms</span>
      </div>
    </div>
  );
}
