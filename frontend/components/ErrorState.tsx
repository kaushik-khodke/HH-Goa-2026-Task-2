'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center my-auto min-h-[260px] shadow-sm">
      <AlertCircle className="h-10 w-10 text-rose-600 mb-3" />
      <h3 className="text-sm font-bold text-rose-900">Unable to Complete RAG Query</h3>
      <p className="text-xs text-rose-700 max-w-md mt-1 mb-4 font-mono">{error}</p>

      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm shadow-rose-200"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        <span>Try Again</span>
      </button>
    </div>
  );
}
