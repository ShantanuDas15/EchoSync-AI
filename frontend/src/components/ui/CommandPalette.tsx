'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, Home, Library, Activity, Settings, Mic, Download, User, FolderKanban, X, ArrowRight } from 'lucide-react';
import { fuzzyMatch } from '@/lib/fuzzy';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/themeContext';

type Action = {
  id: string;
  title: string;
  icon: React.ReactNode;
  category?: string;
  route?: string;
  onExecute?: () => void;
};

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { openSettings } = useTheme();

  const actions: Action[] = [
    { id: 'route-studio', title: 'Studio Workspace', category: 'Navigation', icon: <Home className="w-4 h-4" />, route: '/' },
    { id: 'route-dashboard', title: 'Projects & Workspace', category: 'Navigation', icon: <FolderKanban className="w-4 h-4" />, route: '/dashboard' },
    { id: 'route-library', title: 'Voice Library', category: 'Navigation', icon: <Library className="w-4 h-4" />, route: '/library' },
    { id: 'route-api', title: 'Developer API Portal', category: 'Navigation', icon: <Activity className="w-4 h-4" />, route: '/developer' },
    { id: 'action-settings', title: 'Open Accessibility & Theme Settings', category: 'Actions', icon: <Settings className="w-4 h-4" />, onExecute: openSettings },
    { id: 'action-synth', title: 'Synthesize Clipboard', category: 'Actions', icon: <Mic className="w-4 h-4" />, onExecute: () => console.log('Synthesize Clipboard') },
    { id: 'action-voice', title: 'Switch to Voice: Sarah', category: 'Actions', icon: <User className="w-4 h-4" />, onExecute: () => console.log('Switch Voice') },
    { id: 'action-export', title: 'Export Last Audio', category: 'Actions', icon: <Download className="w-4 h-4" />, onExecute: () => console.log('Export Audio') },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const results = actions
    .map(action => ({ action, match: fuzzyMatch(query, action.title) }))
    .filter(item => item.match.match)
    .sort((a, b) => b.match.score - a.match.score);

  const handleExecute = (action: Action) => {
    if (action.route) {
      router.push(action.route);
    } else if (action.onExecute) {
      action.onExecute();
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleExecute(results[selectedIndex].action);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="omnibar-title"
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="w-full h-full sm:h-auto sm:max-w-xl bg-slate-900 border-b sm:border border-slate-800 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 sm:py-2 border-b border-slate-800 gap-2">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            id="omnibar-title"
            aria-label="Command search input"
            className="flex-1 min-h-[44px] px-2 py-3 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-base sm:text-sm"
            placeholder="Type a command, page, or action..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-md font-mono">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close command palette"
            className="min-w-[44px] min-h-[44px] flex sm:hidden items-center justify-center text-slate-400 hover:text-white rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action List */}
        <div className="flex-1 sm:max-h-[360px] overflow-y-auto p-2 sm:p-3 space-y-1">
          {results.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center justify-center">
              <Search className="w-8 h-8 opacity-30 mb-2" />
              <span>No matching actions found.</span>
            </div>
          ) : (
            results.map((result, idx) => {
              const { action } = result;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={action.id}
                  className={`w-full min-h-[48px] flex items-center justify-between px-4 py-3 rounded-xl text-sm text-left transition-all focus-ring ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                  }`}
                  onClick={() => handleExecute(action)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                      {action.icon}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{action.title}</span>
                      {action.category && (
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                          {action.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight size={14} className={`shrink-0 ${isSelected ? 'opacity-100 text-indigo-400' : 'opacity-0'}`} />
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="hidden sm:flex items-center justify-between px-4 py-2 bg-slate-950/60 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span>Navigate <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded">↑</kbd> <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded">↓</kbd></span>
            <span>•</span>
            <span>Select <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded">↵</kbd></span>
          </div>
          <span>Esc to exit</span>
        </div>
      </div>
    </div>
  );
}
