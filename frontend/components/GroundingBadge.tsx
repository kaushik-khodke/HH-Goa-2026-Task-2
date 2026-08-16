'use client';

import React from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';

interface GroundingBadgeProps {
  isGrounded: boolean;
  groundingScore: number;
  abstained: boolean;
}

export default function GroundingBadge({
  isGrounded,
  groundingScore,
  abstained,
}: GroundingBadgeProps) {
  if (abstained || !isGrounded) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold shadow-sm">
        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
        <span>Gemini AI Knowledge Base</span>
      </div>
    );
  }

  const scorePct = Math.round((groundingScore || 0.88) * 100);

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold shadow-sm">
      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
      <span>Dataset Grounded ({scorePct}%)</span>
    </div>
  );
}
