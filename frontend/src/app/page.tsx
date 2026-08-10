"use client";

import React, { useState } from 'react';
import { SynthesizerForm } from '@/components/ui/SynthesizerForm';
import { AudioRecorder } from '@/components/ui/AudioRecorder';
import { WaveSurferVisualizer } from '@/components/ui/WaveSurferVisualizer';
import { useWebSocketStream } from '@/hooks/useWebSocketStream';
import { Waves, Mic, Radio, Activity } from 'lucide-react';

export default function Dashboard() {
  const [referenceAudio, setReferenceAudio] = useState<Blob | null>(null);
  const { isStreaming, connectAndStream } = useWebSocketStream();
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const handleSynthesize = async (data: { text: string; preset: string; speed: number; pitch: number }) => {
    // In a real scenario, this would POST to /api/v1/inference/tts or /clone
    // For this milestone, we trigger the websocket directly with a dummy task ID
    const dummyTaskId = `task-${Math.random().toString(36).substring(7)}`;
    setCurrentTaskId(dummyTaskId);
    connectAndStream(dummyTaskId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <Waves className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              EchoSync AI
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Systems Online
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Controls */}
          <div className="lg:col-span-5 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400 px-1">
                <Mic size={18} />
                <h2 className="font-medium text-sm uppercase tracking-wider">Voice Cloning</h2>
              </div>
              <AudioRecorder onRecordingComplete={setReferenceAudio} />
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400 px-1">
                <Radio size={18} />
                <h2 className="font-medium text-sm uppercase tracking-wider">Synthesis Engine</h2>
              </div>
              <SynthesizerForm onSubmit={handleSynthesize} isSynthesizing={isStreaming} />
            </section>
          </div>

          {/* Right Column - Visualizer & Output */}
          <div className="lg:col-span-7 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <Activity size={18} />
                  <h2 className="font-medium text-sm uppercase tracking-wider">Analysis & Output</h2>
                </div>
                {isStreaming && (
                  <span className="text-xs font-mono text-indigo-400 animate-pulse">
                    Streaming PCM Data...
                  </span>
                )}
              </div>
              
              <div className="h-full flex flex-col gap-4">
                {referenceAudio ? (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500 ml-1">Reference Audio</p>
                    <WaveSurferVisualizer audioBlob={referenceAudio} />
                  </div>
                ) : (
                  <div className="flex-1 min-h-[160px] flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
                    <p className="text-slate-500 text-sm">No reference audio captured.</p>
                  </div>
                )}

                <div className="space-y-2 mt-4">
                  <p className="text-sm text-slate-500 ml-1">Stream Output</p>
                  <div className="w-full h-[300px] bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden flex items-center justify-center">
                    {/* Simplified placeholder for the real-time spectrogram canvas */}
                    {isStreaming ? (
                      <div className="flex flex-col items-center gap-4 text-indigo-400">
                        <Waves size={48} className="animate-pulse" />
                        <span className="font-mono text-sm tracking-widest uppercase">Receiving Audio Stream</span>
                      </div>
                    ) : (
                      <p className="text-slate-600 text-sm">Awaiting synthesis task...</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
