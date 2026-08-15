"use client";

import React, { useState } from 'react';
import { usePresence } from '@/lib/presenceContext';
import { Users, Lock } from 'lucide-react';

export function AvatarGroup() {
  const { peers } = usePresence();
  const [isOpen, setIsOpen] = useState(false);

  if (peers.length === 0) return null;

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View online collaborators"
        className="flex items-center -space-x-2.5 p-1 rounded-full hover:ring-2 hover:ring-indigo-500/40 transition-all focus-ring"
      >
        {peers.slice(0, 3).map((peer) => (
          <div
            key={peer.id}
            style={{ borderColor: peer.color }}
            className="relative w-7 h-7 rounded-full border-2 bg-slate-800 overflow-hidden shadow-md group"
            title={`${peer.name}${peer.activeBlockId ? ` (Editing Block ${peer.activeBlockId})` : ''}`}
          >
            {peer.avatarUrl ? (
              <img src={peer.avatarUrl} alt={peer.name} className="w-full h-full object-cover" />
            ) : (
              <div
                style={{ backgroundColor: peer.color }}
                className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white uppercase"
              >
                {peer.name.charAt(0)}
              </div>
            )}

            {peer.activeBlockId && (
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-amber-400 rounded-full ring-1 ring-slate-900" />
            )}
          </div>
        ))}

        {peers.length > 3 && (
          <div className="w-7 h-7 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center text-[10px] font-semibold text-slate-300 shadow-md">
            +{peers.length - 3}
          </div>
        )}
      </button>

      {/* Collaborators Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Active collaborators list"
          className="absolute top-full right-0 mt-2 w-64 p-3 bg-slate-900 border border-slate-800 rounded-xl shadow-xl shadow-slate-950/60 backdrop-blur-xl z-50 text-slate-200 animate-in fade-in"
        >
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-800 text-xs font-semibold text-white">
            <Users size={14} className="text-indigo-400" />
            <span>Active Collaborators ({peers.length})</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {peers.map((peer) => (
              <div key={peer.id} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-800/60">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    style={{ backgroundColor: peer.color }}
                    className="w-2 h-2 rounded-full shrink-0"
                  />
                  <span className="truncate font-medium text-slate-300">{peer.name}</span>
                </div>

                {peer.activeBlockId && (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 shrink-0">
                    <Lock size={10} />
                    <span>Block {peer.activeBlockId}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
