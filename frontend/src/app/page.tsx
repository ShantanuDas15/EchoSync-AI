"use client";

import React, { useState } from 'react';
import { SynthesizerForm } from '@/components/ui/SynthesizerForm';
import { AudioRecorder } from '@/components/ui/AudioRecorder';
import { WaveSurferVisualizer } from '@/components/ui/WaveSurferVisualizer';
import { NavigationHeader } from '@/components/layout/NavigationHeader';
import { KeyboardShortcutFooter } from '@/components/layout/KeyboardShortcutFooter';
import { useWebSocketStream } from '@/hooks/useWebSocketStream';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Waves, Mic, Radio, Activity } from 'lucide-react';

export default function Dashboard() {
  const [referenceAudio, setReferenceAudio] = useState<Blob | null>(null);
  const { isStreaming, connectAndStream } = useWebSocketStream();
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const handleSynthesize = async (data?: { text: string; preset: string; speed: number; pitch: number }) => {
    const dummyTaskId = `task-${Math.random().toString(36).substring(7)}`;
    setCurrentTaskId(dummyTaskId);
    connectAndStream(dummyTaskId);
  };

  // Register global hotkey listeners
  useKeyboardShortcuts({
    onSynthesize: () => {
      if (!isStreaming) {
        handleSynthesize();
      }
    },
    onEscape: () => {
      console.log('Escape hotkey pressed');
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 font-sans flex flex-col justify-between">
      {/* Navigation Header */}
      <NavigationHeader activeTab="studio" isStreaming={isStreaming} />

      {/* Main Studio Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Controls */}
          <div className="lg:col-span-5 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400 px-1">
                <Mic size={18} className="text-indigo-400" />
                <h2 className="font-medium text-xs uppercase tracking-wider font-mono">Voice Cloning Reference</h2>
              </div>
              <AudioRecorder onRecordingComplete={setReferenceAudio} />
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400 px-1">
                <Radio size={18} className="text-indigo-400" />
                <h2 className="font-medium text-xs uppercase tracking-wider font-mono">Neural Synthesis Engine</h2>
              </div>
              <SynthesizerForm onSubmit={handleSynthesize} isSynthesizing={isStreaming} />
            </section>
          </div>

          {/* Right Column - Visualizer & Output */}
          <div className="lg:col-span-7 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <Activity size={18} className="text-indigo-400" />
                  <h2 className="font-medium text-xs uppercase tracking-wider font-mono">Analysis & Audio Output</h2>
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
                    <p className="text-xs font-mono text-slate-400 ml-1 uppercase">Captured Reference Sample</p>
                    <WaveSurferVisualizer audioBlob={referenceAudio} />
                  </div>
                ) : (
                  <div className="flex-1 min-h-[160px] flex items-center justify-center border-2 border-dashed border-slate-800/80 rounded-2xl bg-slate-900/40">
                    <p className="text-slate-500 text-sm">No reference audio captured yet.</p>
                  </div>
                )}

                <div className="space-y-2 mt-4">
                  <p className="text-xs font-mono text-slate-400 ml-1 uppercase">Stream PCM Visualizer</p>
                  <div className="w-full h-[300px] bg-slate-900/80 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden flex items-center justify-center">
                    {isStreaming ? (
                      <div className="flex flex-col items-center gap-4 text-indigo-400">
                        <Waves size={48} className="animate-pulse" />
                        <span className="font-mono text-sm tracking-widest uppercase">Receiving Audio Stream</span>
                      </div>
                    ) : (
                      <p className="text-slate-600 text-sm font-mono">Awaiting synthesis task dispatch...</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

        </div>
      </main>

      {/* Keyboard Shortcut & System Status Footer */}
      <KeyboardShortcutFooter />
    </div>
  );
}
