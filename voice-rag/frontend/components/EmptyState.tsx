'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onSampleClick: (sample: string) => void;
}

export default function EmptyState({ onSampleClick }: EmptyStateProps) {
  const samples = [
    'who is the president of India?',
    'what is the formula of sulfuric acid and its molecular weight?',
    'who directed the movie avatar?',
    'What was the immediate impact of the Manhattan project?',
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center my-auto min-h-[300px] shadow-sm">
      <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-3.5 shadow-sm">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900">Ask Anything. Get Grounded Answers.</h3>
      <p className="text-xs text-slate-500 max-w-md mt-1 mb-5 leading-relaxed">
        Speak via microphone or type your query in English, Hindi, Bengali, Tamil, etc., to search the MSMARCO-XI knowledge base.
      </p>

      <div className="flex flex-wrap gap-2 justify-center max-w-lg">
        {samples.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSampleClick(sample)}
            className="text-xs px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50/50 transition-all font-medium shadow-2xs"
          >
            "{sample}"
          </button>
        ))}
      </div>
    </div>
  );
}
