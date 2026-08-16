'use client';

import React from 'react';
import { FileText } from 'lucide-react';

interface EvidenceCardProps {
  index: number;
  text: string;
}

export default function EvidenceCard({ index, text }: EvidenceCardProps) {
  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-1.5 transition-all hover:border-slate-300 hover:bg-slate-100/50">
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
          <FileText className="h-3.5 w-3.5 text-blue-600" />
          <span>Passage [{index + 1}]</span>
        </div>
        <span className="text-[11px] bg-slate-200/80 px-2 py-0.5 rounded text-slate-600 font-mono">msmarco-xi</span>
      </div>
      <p className="text-xs text-slate-800 leading-relaxed font-mono">{text}</p>
    </div>
  );
}
