"use client";

import React, { useEffect, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const { isRecording, volume, startRecording, stopRecording } = useAudioRecorder();
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleToggle = async () => {
    if (isRecording) {
      const blob = await stopRecording();
      if (blob) onRecordingComplete(blob);
    } else {
      await startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // VU Meter height mapping
  const vuHeight = Math.min(100, Math.max(5, (volume / 255) * 200));

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
      <div className="flex flex-col items-center gap-2 z-10">
        <h3 className="text-xl font-medium text-slate-200 tracking-wide">
          {isRecording ? "Recording..." : "Capture Reference Voice"}
        </h3>
        <p className="text-4xl font-light text-white font-mono tabular-nums tracking-wider">
          {formatTime(timer)}
        </p>
      </div>

      <div className="relative w-full h-32 flex items-center justify-center gap-1 z-10">
        {/* Simple VU Meter visualization */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="w-2 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-full transition-all duration-75"
            style={{
              height: isRecording ? `${Math.max(10, vuHeight * (0.5 + Math.random() * 0.5))}%` : '10%',
              opacity: isRecording ? 1 : 0.3
            }}
          />
        ))}
      </div>

      <button
        onClick={handleToggle}
        className={`z-10 flex items-center justify-center w-20 h-20 rounded-full shadow-lg transition-all duration-300 ${
          isRecording
            ? 'bg-red-500 hover:bg-red-400 shadow-red-500/50 scale-95'
            : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/50 hover:scale-105'
        }`}
      >
        {isRecording ? (
          <Square className="w-8 h-8 text-white" fill="currentColor" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}
      </button>

      {/* Decorative background pulse */}
      {isRecording && (
        <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />
      )}
    </div>
  );
}
