"use client";

import React, { useMemo } from 'react';
import { generatePseudoWaveform, estimateDurationSeconds, estimateSyllables } from '@/lib/audioPreviewUtils';
import { Clock, Volume2 } from 'lucide-react';

interface InlineWaveformPreviewProps {
  text: string;
  barCount?: number;
  isSynthesizing?: boolean;
}

export function InlineWaveformPreview({
  text,
  barCount = 28,
  isSynthesizing = false
}: InlineWaveformPreviewProps) {
  const bars = useMemo(() => generatePseudoWaveform(text, barCount), [text, barCount]);
  const durationSeconds = useMemo(() => estimateDurationSeconds(text), [text]);
  const syllables = useMemo(() => estimateSyllables(text), [text]);

  if (!text.trim()) return null;

  return (
    <div className="flex flex-col gap-1.5 p-2 bg-slate-950/60 border border-slate-800/80 rounded-lg animate-in fade-in">
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span className="flex items-center gap-1 text-slate-500">
          <Volume2 size={12} className={isSynthesizing ? "text-indigo-400 animate-pulse" : "text-slate-500"} />
          <span>Cadence Preview</span>
        </span>
        <span className="flex items-center gap-2">
          <span>{syllables} syllables</span>
          <span>•</span>
          <span className="flex items-center gap-0.5 text-indigo-300 font-semibold">
            <Clock size={11} />
            <span>~{durationSeconds}s</span>
          </span>
        </span>
      </div>

      {/* Waveform Bars */}
      <div className="h-6 flex items-center justify-between gap-[2px] w-full px-1">
        {bars.map((height, idx) => (
          <div
            key={idx}
            style={{
              height: `${Math.max(15, Math.round(height * 100))}%`
            }}
            className={`w-full rounded-full transition-all duration-300 ${
              isSynthesizing
                ? 'bg-gradient-to-t from-indigo-500 to-violet-400 animate-pulse'
                : 'bg-indigo-500/40 hover:bg-indigo-400/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
