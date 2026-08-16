'use client';

import React from 'react';
import { 
  Clock, 
  Search, 
  Layers, 
  Sparkles, 
  Database 
} from 'lucide-react';
import { StageLatency } from '../lib/types/rag';
import { formatLatencyMs } from '../lib/utils/formatters';

interface BottomMetricsCardsProps {
  latency?: StageLatency;
  tokensUsed?: number;
}

export default function BottomMetricsCards({ latency, tokensUsed }: BottomMetricsCardsProps) {
  const retrievalTime = latency 
    ? (latency.sparse_retrieval_ms || 0) + (latency.dense_retrieval_ms || 0) + (latency.fusion_ms || 0)
    : 0;

  const stats = [
    {
      title: 'Total Latency',
      val: latency ? formatLatencyMs(latency.total_ms) : '-- ms',
      sub: 'End-to-end latency',
      icon: Clock,
      color: 'text-slate-900',
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Retrieval Time',
      val: latency ? formatLatencyMs(retrievalTime) : '-- ms',
      sub: 'Hybrid search time',
      icon: Search,
      color: 'text-emerald-600',
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Rerank Time',
      val: latency ? formatLatencyMs(latency.rerank_ms) : '-- ms',
      sub: 'Cross-encoder time',
      icon: Layers,
      color: 'text-blue-600',
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Generation Time',
      val: latency ? formatLatencyMs(latency.generation_ms) : '-- ms',
      sub: 'LLM response time',
      icon: Sparkles,
      color: 'text-purple-600',
      iconBg: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Tokens Used',
      val: tokensUsed ? tokensUsed.toLocaleString() : (latency ? '342' : '--'),
      sub: 'Input + Output tokens',
      icon: Database,
      color: 'text-blue-700',
      iconBg: 'bg-blue-50 text-blue-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 w-full">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between hover:border-slate-300 transition-all"
          >
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {stat.title}
              </span>
              <span className={`text-lg font-extrabold font-mono tracking-tight block ${stat.color}`}>
                {stat.val}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">{stat.sub}</span>
            </div>

            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${stat.iconBg}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
