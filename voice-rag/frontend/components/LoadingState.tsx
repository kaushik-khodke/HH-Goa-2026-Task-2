'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  query: string;
}

export default function LoadingState({ query }: LoadingStateProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center my-auto min-h-[300px] shadow-sm">
      <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
      <h3 className="text-sm font-bold text-slate-900">Executing Grounded Multilingual RAG</h3>
      <p className="text-xs text-blue-600 font-mono mt-1 font-semibold max-w-sm truncate">"{query}"</p>

      <div className="flex items-center gap-2.5 mt-6 text-xs text-slate-500 font-medium">
        <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
        <span>BM25 + BGE-M3 Dense Retrieval &amp; Cross-Reranker Active</span>
      </div>
    </div>
  );
}
