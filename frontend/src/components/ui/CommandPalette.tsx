'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, Home, Library, Activity, Settings, Mic, Download, User } from 'lucide-react';
import { fuzzyMatch } from '@/lib/fuzzy';
import { useRouter } from 'next/navigation';

type Action = {
  id: string;
  title: string;
  icon: React.ReactNode;
  route?: string;
  onExecute?: () => void;
};

const ACTIONS: Action[] = [
  { id: 'route-studio', title: 'Go to Studio', icon: <Home className="w-4 h-4" />, route: '/' },
  { id: 'route-library', title: 'Go to Library', icon: <Library className="w-4 h-4" />, route: '/library' },
  { id: 'route-api', title: 'Go to API Dashboard', icon: <Activity className="w-4 h-4" />, route: '/developer' },
  { id: 'route-settings', title: 'Go to Settings', icon: <Settings className="w-4 h-4" />, route: '/settings' },
  { id: 'action-synth', title: '> Synthesize Clipboard', icon: <Mic className="w-4 h-4" />, onExecute: () => console.log('Synthesize Clipboard') },
  { id: 'action-voice', title: '> Switch to Voice: Sarah', icon: <User className="w-4 h-4" />, onExecute: () => console.log('Switch Voice') },
  { id: 'action-export', title: '> Export Last Audio', icon: <Download className="w-4 h-4" />, onExecute: () => console.log('Export Audio') },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  const results = ACTIONS
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 px-4 py-4 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              No results found.
            </div>
          ) : (
            results.map((result, idx) => {
              const { action } = result;
              return (
                <button
                  key={action.id}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    idx === selectedIndex ? 'bg-indigo-500/20 text-indigo-200' : 'text-slate-300 hover:bg-slate-800/50'
                  }`}
                  onClick={() => handleExecute(action)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <span className={idx === selectedIndex ? 'text-indigo-400' : 'text-slate-400'}>
                    {action.icon}
                  </span>
                  {action.title}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
