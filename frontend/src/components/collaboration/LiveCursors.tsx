"use client";

import React from 'react';
import { usePresence } from '@/lib/presenceContext';
import { MousePointer2 } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';

export function LiveCursors() {
  const { peers, currentUserId } = usePresence();
  const { reducedMotion } = useTheme();

  if (reducedMotion) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-40 overflow-hidden"
    >
      {peers
        .filter((p) => p.id !== currentUserId && p.cursor)
        .map((peer) => {
          const { x, y } = peer.cursor!;

          return (
            <div
              key={peer.id}
              style={{
                transform: `translate3d(${x}px, ${y}px, 0)`,
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              className="absolute top-0 left-0 flex items-start gap-1 will-change-transform"
            >
              {/* Pointer Icon */}
              <MousePointer2
                size={18}
                style={{ fill: peer.color, color: peer.color }}
                className="drop-shadow-md -rotate-12"
              />

              {/* Name Tag Pill */}
              <div
                style={{ backgroundColor: peer.color }}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white shadow-md whitespace-nowrap -mt-1 ml-1"
              >
                {peer.name}
              </div>
            </div>
          );
        })}
    </div>
  );
}
