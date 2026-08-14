'use client';

import React from 'react';
import GroundingBadge from './GroundingBadge';
import { Sparkles, MessageSquare } from 'lucide-react';
import { cleanMarkdownText } from '../lib/utils/formatters';

interface AnswerPanelProps {
  query: string;
  answer: string;
  isGrounded: boolean;
  groundingScore: number;
  abstained: boolean;
}

export default function AnswerPanel({
  query,
  answer,
  isGrounded,
  groundingScore,
  abstained,
}: AnswerPanelProps) {
  const formattedHTML = React.useMemo(() => {
    if (!answer) return '';
    const cleaned = cleanMarkdownText(answer);
    return cleaned
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-700 font-bold">$1</strong>')
      .replace(/^\s*[\*\•\-]\s+(.*)$/gm, '<li class="ml-4 mt-1.5 list-disc text-slate-800 leading-relaxed">$1</li>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }, [answer]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-full shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">System Answer</h3>
        </div>
        <GroundingBadge isGrounded={isGrounded} groundingScore={groundingScore} abstained={abstained} />
      </div>

      <div className="space-y-1">
        <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">User Query</span>
        <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <span>{query}</span>
        </p>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[320px] pr-1 scrollbar-thin scrollbar-thumb-slate-200">
        <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
          Grounded Briefing Response
        </span>
        <div
          className="text-sm text-slate-800 leading-relaxed font-normal space-y-2"
          dangerouslySetInnerHTML={{ __html: formattedHTML }}
        />
      </div>
    </div>
  );
}
