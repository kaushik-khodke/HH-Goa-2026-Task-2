'use client';

import React from 'react';
import EvidenceCard from './EvidenceCard';
import { Database, AlertTriangle } from 'lucide-react';

interface EvidencePanelProps {
  contexts: string[];
}

export default function EvidencePanel({ contexts }: EvidencePanelProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-full shadow-sm">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-3.5">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Retrieved Evidence ({contexts.length})
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">ai4bharat/MSMARCO-XI</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[380px] scrollbar-thin scrollbar-thumb-slate-200">
        {contexts && contexts.length > 0 ? (
          contexts.map((ctx, idx) => <EvidenceCard key={idx} index={idx} text={ctx} />)
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col items-center justify-center text-center py-8">
            <AlertTriangle className="h-6 w-6 text-amber-600 mb-2" />
            <p className="text-xs font-bold text-amber-900">No Direct Evidence in Local Split</p>
            <p className="text-[11px] text-amber-700 mt-1 max-w-xs leading-relaxed">
              The query was answered directly via high-grade AI knowledge base generation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
