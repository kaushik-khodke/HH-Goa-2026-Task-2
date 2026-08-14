'use client';

import React from 'react';
import { Database, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  chunkCount?: number;
  isBackendReady?: boolean;
}

export default function Header({
  chunkCount = 15,
  isBackendReady = true,
}: HeaderProps) {
  return (
    <header className="w-full bg-white border-b border-slate-200/90 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      {/* Left Title Info */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200/80 tracking-wider">
              HH GOA 2026 TASK 2
            </span>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Voice-Enabled Multilingual RAG
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Multilingual Grounded Intelligence • MSMARCO-XI
          </p>
        </div>
      </div>

      {/* Right Badges */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-blue-50/70 border border-blue-200/80 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-blue-700">
          <Database className="h-3.5 w-3.5 text-blue-600" />
          <span>ai4bharat/MSMARCO-XI</span>
          <span className="text-blue-600">({chunkCount} chunks)</span>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{isBackendReady ? 'System Ready' : 'Backend Connecting...'}</span>
        </div>
      </div>
    </header>
  );
}
