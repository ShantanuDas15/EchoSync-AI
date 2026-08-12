"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings2, Loader2, X, Play, Zap, Volume1, FileText } from 'lucide-react';

interface SynthesizerPayload {
  text: string;
  preset: string;
  speed: number;
  pitch: number;
  energy?: number;
}

interface SynthesizerFormProps {
  onSubmit: (data: SynthesizerPayload) => void;
  isSynthesizing: boolean;
}

const SAMPLE_PROMPTS = [
  { label: "Commercial", text: "Experience the ultimate in luxury. Because you deserve nothing less." },
  { label: "Podcast", text: "Welcome back to the show. Today, we have a fascinating topic to dive into." },
  { label: "News", text: "Breaking news: Market trends hit an all-time high as the tech sector rallies." },
  { label: "Gaming", text: "Watch out! The enemy is approaching from the north flank!" },
];

export function SynthesizerForm({ onSubmit, isSynthesizing }: SynthesizerFormProps) {
  const [text, setText] = useState("");
  const [preset, setPreset] = useState("default");
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0); // -12 to 12 semitones
  const [energy, setEnergy] = useState(0.5); // 0.0 to 1.0
  const [showAdvanced, setShowAdvanced] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = text.length;
  const maxChars = 1000;
  const isOverLimit = charCount > maxChars;

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 300)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isOverLimit) return;
    onSubmit({ text, preset, speed, pitch, energy });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isSynthesizing) {
        handleSubmit();
      }
    }
  };

  const insertTag = (tagStart: string, tagEnd: string = '') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + tagStart + selectedText + tagEnd + text.substring(end);
    
    setText(newText);
    
    // Focus and restore selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagStart.length, start + tagStart.length + selectedText.length);
    }, 0);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6 glass-panel rounded-2xl relative">
      <div className="flex justify-between items-end">
        <label className="text-sm font-medium text-slate-300 ml-1">Studio Script Editor</label>
        
        {/* Sample Prompts */}
        <div className="flex gap-2">
          {SAMPLE_PROMPTS.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => setText(sample.text)}
              className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-slate-800/80 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/20 transition-colors"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type what you want me to say... (Cmd+Enter to generate)"
          className={`w-full min-h-[120px] p-4 pb-12 bg-slate-900/50 border rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none overflow-hidden ${isOverLimit ? 'border-red-500/50' : 'border-slate-700/50 focus:border-indigo-500/50'}`}
          disabled={isSynthesizing}
        />
        
        {/* Toolbar inside textarea */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center bg-transparent">
          <div className="flex gap-1">
            <button type="button" onClick={() => insertTag('<break time="500ms"/>')} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 transition-colors" title="Pause 500ms">
              <Play size={12} /> Pause
            </button>
            <button type="button" onClick={() => insertTag('<emphasis level="strong">', '</emphasis>')} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 transition-colors" title="Add Emphasis">
              <Zap size={12} /> Emphasis
            </button>
            <button type="button" onClick={() => insertTag('<prosody volume="soft">', '</prosody>')} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 transition-colors" title="Soft Whisper">
              <Volume1 size={12} /> Whisper
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {text && (
              <button type="button" onClick={() => setText('')} className="text-slate-500 hover:text-red-400 transition-colors" title="Clear prompt">
                <X size={16} />
              </button>
            )}
            <span className={`text-xs font-mono tabular-nums ${isOverLimit ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
              {charCount} / {maxChars}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 ml-1">Speaker Preset</label>
          <div className="relative">
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              disabled={isSynthesizing}
              className="w-full p-3 pl-10 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 appearance-none transition-all"
            >
              <option value="default">Default Neural Voice</option>
              <option value="expressive">Expressive Avatar</option>
              <option value="professional">Professional Broadcast</option>
            </select>
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          </div>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 p-3 text-sm text-indigo-400 hover:text-indigo-300 transition-colors w-full justify-center bg-slate-800/30 border border-transparent rounded-xl hover:bg-slate-800/60"
          >
            <Settings2 size={16} />
            {showAdvanced ? "Hide Advanced Prosody" : "Advanced Prosody"}
          </button>
        </div>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-slate-900/40 rounded-xl border border-slate-700/50 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <label className="text-slate-300">Speaking Rate</label>
              <span className="text-indigo-400 font-mono text-xs bg-indigo-500/10 px-2 py-0.5 rounded">{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              disabled={isSynthesizing}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <label className="text-slate-300">Pitch Shift</label>
              <span className="text-emerald-400 font-mono text-xs bg-emerald-500/10 px-2 py-0.5 rounded">
                {pitch > 0 ? '+' : ''}{pitch.toFixed(1)} st
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              disabled={isSynthesizing}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <label className="text-slate-300">Energy Level</label>
              <span className="text-rose-400 font-mono text-xs bg-rose-500/10 px-2 py-0.5 rounded">{(energy * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={energy}
              onChange={(e) => setEnergy(parseFloat(e.target.value))}
              disabled={isSynthesizing}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSynthesizing || !text.trim() || isOverLimit}
        className="mt-2 flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] focus-ring"
      >
        {isSynthesizing ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Synthesizing & Streaming...
          </>
        ) : (
          <>
            <Send size={20} />
            Generate Audio Output
          </>
        )}
      </button>
    </form>
  );
}
