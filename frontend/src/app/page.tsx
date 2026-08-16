"use client";

import React, { useState, useEffect } from 'react';
import { StoryboardEditor } from '@/components/studio/StoryboardEditor';
import { AudioRecorder } from '@/components/ui/AudioRecorder';
import { WaveSurferVisualizer } from '@/components/ui/WaveSurferVisualizer';
import { SpectrogramCanvas } from '@/components/ui/SpectrogramCanvas';
import { ToastNotification, ToastType } from '@/components/ui/ToastNotification';
import { NavigationHeader } from '@/components/layout/NavigationHeader';
import { KeyboardShortcutFooter } from '@/components/layout/KeyboardShortcutFooter';
import { MetricBadge } from '@/components/ui/MetricBadge';
import { useWebSocketStream } from '@/hooks/useWebSocketStream';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Mic, Radio, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { ContextualHint } from '@/components/ui/ContextualHint';

export default function Dashboard() {
  const [referenceAudio, setReferenceAudio] = useState<Blob | null>(null);
  const { isStreaming, connectAndStream } = useWebSocketStream();
  
  // UI Layout State
  const [showRecorder, setShowRecorder] = useState(true);
  
  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Fake Telemetry
  const [rtfHistory, setRtfHistory] = useState<number[]>([0.8, 0.85, 0.9, 0.75, 0.8]);
  const [ttfbHistory, setTtfbHistory] = useState<number[]>([150, 140, 160, 120, 130]);
  const currentRTF = isStreaming ? 0.95 : 0.8;
  const currentTTFB = isStreaming ? 180 : 130;

  useEffect(() => {
    if (isStreaming) {
      setToast({ message: 'Establishing neural WebSocket stream...', type: 'Processing' });
    } else if (toast?.type === 'Processing') {
      setToast({ message: 'Synthesis completed successfully.', type: 'Success' });
    }
  }, [isStreaming]);

  const handleMasterRender = async (blocks: any[], totalTokens: number) => {
    if (blocks.length === 0 || totalTokens === 0) {
      setToast({ message: 'Synthesis prompt cannot be empty.', type: 'Error' });
      return;
    }
    
    // Simulate telemetry changes
    setRtfHistory(prev => [...prev.slice(-4), currentRTF]);
    setTtfbHistory(prev => [...prev.slice(-4), currentTTFB]);

    const dummyTaskId = `task-${Math.random().toString(36).substring(7)}`;
    connectAndStream(dummyTaskId);
  };

  useKeyboardShortcuts({
    onSynthesize: () => {
      if (!isStreaming) {
        setToast({ message: 'Cmd+Enter pressed. Generating audio...', type: 'Processing' });
        handleMasterRender([{ text: "Simulated text from hotkey", preset: "default" }], 26);
      }
    },
    onEscape: () => {
      if (isStreaming) {
        setToast({ message: 'Synthesis aborted by user.', type: 'Warning' });
      }
    },
  });

  return (
    <div className="min-h-screen bg-surface-root text-text-primary selection:bg-sky-500/20 selection:text-sky-200 font-sans flex flex-col justify-between">
      <NavigationHeader activeTab="studio" isStreaming={isStreaming} />

      {/* Telemetry Bar */}
      <div data-tour="telemetry-bar" className="w-full bg-surface-panel border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-end gap-4">
          <MetricBadge label="RTF" value={currentRTF.toFixed(2)} type="rtf" history={rtfHistory} />
          <MetricBadge label="TTFB" value={currentTTFB} unit="ms" type="ttfb" history={ttfbHistory} />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Controls */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Collapsible Recorder Section */}
            <section data-tour="voice-recorder" className="bg-surface-panel rounded-2xl border border-border-subtle overflow-hidden transition-all duration-300">
              <button 
                onClick={() => setShowRecorder(!showRecorder)}
                className="w-full flex items-center justify-between p-4 bg-surface-elevated/40 hover:bg-surface-elevated/80 transition-colors"
              >
                <div className="flex items-center gap-2 text-text-secondary">
                  <Mic size={18} className="text-sky-400" />
                  <h2 className="font-medium text-xs uppercase tracking-wider font-mono">Voice Cloning Reference</h2>
                  <ContextualHint
                    title="Zero-Shot Reference Sample"
                    description="Provide 3-5 seconds of clean, noise-free voice audio to extract a 256-d speaker identity embedding vector."
                    proTip="Use a condenser microphone with minimal reverb for best speaker fidelity."
                    placement="right"
                  />
                </div>
                {showRecorder ? <ChevronUp size={18} className="text-text-muted" /> : <ChevronDown size={18} className="text-text-muted" />}
              </button>
              
              <div className={`transition-all duration-300 ease-in-out ${showRecorder ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-4 pt-0">
                  <AudioRecorder onRecordingComplete={(blob) => {
                    setReferenceAudio(blob);
                    if (blob) setToast({ message: 'Reference audio captured.', type: 'Success' });
                  }} />
                </div>
              </div>
            </section>

            {/* Synthesizer Form */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-text-secondary px-1">
                <Radio size={18} className="text-sky-400" />
                <h2 className="font-medium text-xs uppercase tracking-wider font-mono">Neural Synthesis Engine</h2>
              </div>
              <StoryboardEditor onMasterRender={handleMasterRender} isSynthesizing={isStreaming} />
            </section>
          </div>

          {/* Right Column - Visualizers */}
          <div data-tour="spectrogram-canvas" className="lg:col-span-7 flex flex-col gap-6">
            <section className="space-y-3 h-full flex flex-col">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Activity size={18} className="text-sky-400" />
                  <h2 className="font-medium text-xs uppercase tracking-wider font-mono">Analysis & Audio Output</h2>
                  <ContextualHint
                    title="Real-Time Acoustic Analytics"
                    description="Real-time 60 FPS HTML5 Canvas Fourier Transform (FFT) spectrogram visualizer and WaveSurfer interactive timeline."
                    placement="bottom"
                  />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-4">
                {/* WaveSurfer Player */}
                <div className="space-y-2">
                  <p className="text-xs font-mono text-text-secondary ml-1 uppercase">Post-Recording Review</p>
                  {referenceAudio ? (
                    <WaveSurferVisualizer audioBlob={referenceAudio} />
                  ) : (
                    <div className="h-32 flex items-center justify-center border-2 border-dashed border-border-subtle rounded-2xl bg-surface-panel text-text-muted text-sm">
                      No audio rendered yet.
                    </div>
                  )}
                </div>

                {/* Real-time Spectrogram */}
                <div className="space-y-2 mt-4">
                  <SpectrogramCanvas isActive={isStreaming} />
                </div>
              </div>
            </section>
          </div>

        </div>
      </main>

      <KeyboardShortcutFooter />

      {/* Toast Notifications */}
      {toast && (
        <ToastNotification 
          message={toast.message} 
          type={toast.type} 
          onDismiss={() => setToast(null)} 
        />
      )}
    </div>
  );
}
