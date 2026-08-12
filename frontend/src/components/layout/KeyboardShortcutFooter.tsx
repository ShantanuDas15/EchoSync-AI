"use client";

import React from 'react';
import { Command, Volume2, Mic, XCircle, Radio } from 'lucide-react';
import { HotkeyDefinition } from '@/types/studio';

interface KeyboardShortcutFooterProps {
  pingMs?: number;
  bufferStatus?: string;
  sampleRateHz?: number;
}

export function KeyboardShortcutFooter({
  pingMs = 42,
  bufferStatus = 'Healthy',
  sampleRateHz = 22050,
}: KeyboardShortcutFooterProps) {
  const hotkeys: HotkeyDefinition[] = [
    { key: 'Cmd+Enter', label: 'Cmd + Enter', description: 'Synthesize Audio' },
    { key: 'Space', label: 'Space', description: 'Play / Pause' },
    { key: 'R', label: 'R', description: 'Toggle Mic Record' },
    { key: 'Esc', label: 'Esc', description: 'Cancel / Clear' },
  ];

  return (
    <footer className="border-t border-slate-800/60 bg-slate-950/90 backdrop-blur-md py-2.5 px-4 text-xs text-slate-400 select-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Hotkey Shortcuts */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
          <span className="text-slate-500 font-mono text-[11px] uppercase tracking-wider hidden md:inline">
            Hotkeys:
          </span>
          {hotkeys.map((item) => (
            <div key={item.key} className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] font-mono text-slate-300 shadow-sm">
                {item.label}
              </kbd>
              <span className="text-slate-400 text-[11px]">{item.description}</span>
            </div>
          ))}
        </div>

        {/* Real-Time WebSocket Buffer & Signal Telemetry */}
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Radio size={12} className="text-indigo-400 animate-pulse" />
            <span>PCM {sampleRateHz / 1000}kHz Mono</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Latency:</span>
            <span className="text-emerald-400">{pingMs}ms</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Buffer:</span>
            <span className="text-indigo-300">{bufferStatus}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
