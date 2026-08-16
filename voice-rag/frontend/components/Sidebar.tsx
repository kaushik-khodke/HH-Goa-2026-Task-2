'use client';

import React from 'react';
import { 
  Send, 
  History, 
  BarChart3, 
  Database, 
  Info, 
  Radio
} from 'lucide-react';

export type NavTab = 'ask' | 'history' | 'analytics' | 'sources' | 'about';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
}: SidebarProps) {
  const navItems = [
    { key: 'ask' as NavTab, label: 'Ask', icon: Send },
    { key: 'history' as NavTab, label: 'History', icon: History },
    { key: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
    { key: 'sources' as NavTab, label: 'Sources', icon: Database },
    { key: 'about' as NavTab, label: 'About', icon: Info },
  ];

  const systemServices = [
    { name: 'Speech STT', status: 'Online' },
    { name: 'Retrieval', status: 'Online' },
    { name: 'Reranker', status: 'Online' },
    { name: 'LLM', status: 'Online' },
    { name: 'Grounding', status: 'Online' },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200/90 flex flex-col justify-between p-4 shrink-0 h-screen sticky top-0 overflow-y-auto">
      <div className="space-y-6">
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              VoiceRAG
            </h1>
            <p className="text-[11px] text-slate-400 font-medium leading-tight">Multilingual RAG System</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                suppressHydrationWarning
                onClick={() => onTabChange(item.key)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Health Card */}
      <div className="pt-4 border-t border-slate-100">
        {/* System Health Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">System Health</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>All systems operational</span>
          </div>

          <div className="space-y-1 pt-1 border-t border-slate-200/60 text-[11px]">
            {systemServices.map((srv, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-500">
                <span>• {srv.name}</span>
                <span className="text-emerald-600 font-medium">{srv.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
