"use client";

import React, { useState } from 'react';
import { Send, Settings2, Loader2 } from 'lucide-react';

interface SynthesizerFormProps {
  onSubmit: (data: { text: string; preset: string; speed: number; pitch: number }) => void;
  isSynthesizing: boolean;
}

export function SynthesizerForm({ onSubmit, isSynthesizing }: SynthesizerFormProps) {
  const [text, setText] = useState("");
  const [preset, setPreset] = useState("default");
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit({ text, preset, speed, pitch });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 ml-1">Synthesis Prompt</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type what you want me to say..."
          className="w-full h-32 p-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none transition-all"
          disabled={isSynthesizing}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 ml-1">Speaker Preset</label>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            disabled={isSynthesizing}
            className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none"
          >
            <option value="default">Default Neural Voice</option>
            <option value="expressive">Expressive Avatar</option>
            <option value="professional">Professional Broadcast</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 p-3 text-sm text-indigo-400 hover:text-indigo-300 transition-colors w-full justify-center bg-slate-800/30 border border-transparent rounded-xl"
          >
            <Settings2 size={16} />
            {showAdvanced ? "Hide Controls" : "Advanced Controls"}
          </button>
        </div>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <label className="text-slate-300">Speaking Rate</label>
              <span className="text-indigo-400 font-mono">{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              disabled={isSynthesizing}
              className="w-full accent-indigo-500"
            />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <label className="text-slate-300">Pitch Shift</label>
              <span className="text-indigo-400 font-mono">{pitch.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              disabled={isSynthesizing}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSynthesizing || !text.trim()}
        className="mt-2 flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
      >
        {isSynthesizing ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Synthesizing & Streaming...
          </>
        ) : (
          <>
            <Send size={20} />
            Generate Audio
          </>
        )}
      </button>
    </form>
  );
}
