'use client';

import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES } from '../lib/utils/formatters';
import { Globe, ChevronDown, Check } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onSelectLanguage: (code: string) => void;
  disabled?: boolean;
}

export default function LanguageSelector({
  selectedLanguage,
  onSelectLanguage,
  disabled = false,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2.5 w-full md:w-56 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm font-medium hover:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Globe className="h-4 w-4 text-blue-600 shrink-0" />
          <span className="truncate">
            {currentLang.name} <span className="text-slate-400 text-xs">({currentLang.nativeName})</span>
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1.5 z-20 max-h-60 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 divide-y divide-slate-100">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  onSelectLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-left transition-colors ${
                  selectedLanguage === lang.code
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>
                  {lang.name} <span className="text-slate-400">({lang.nativeName})</span>
                </span>
                {selectedLanguage === lang.code && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
