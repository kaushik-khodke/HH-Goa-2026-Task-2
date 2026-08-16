'use client';

import React from 'react';
import { X, Send } from 'lucide-react';

interface QueryInputProps {
  query: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function QueryInput({
  query,
  onChange,
  onSubmit,
  isLoading = false,
  disabled = false,
}: QueryInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && query.trim()) {
      onSubmit();
    }
  };

  return (
    <div className="w-full flex items-center gap-2.5">
      <div className="relative flex-1">
        <input
          type="text"
          value={query}
          disabled={disabled || isLoading}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question in English, Hindi, Bengali, Tamil, etc..."
          className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-slate-900 text-sm placeholder-slate-400 outline-none transition-all pr-9 disabled:opacity-50 shadow-sm"
        />
        {query && !isLoading && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <button
        type="button"
        disabled={disabled || isLoading || !query.trim()}
        onClick={onSubmit}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-all shadow-sm shadow-blue-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
      >
        <Send className="h-4 w-4" />
        <span>Ask</span>
      </button>
    </div>
  );
}
