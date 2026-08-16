"use client";

import React, { useState, useEffect } from 'react';
import { StoryboardEditor } from '@/components/studio/StoryboardEditor';
import { AudioRecorder } from '@/components/ui/AudioRecorder';
import { WaveSurferVisualizer } from '@/components/ui/WaveSurferVisualizer';
import { SpectrogramCanvas } from '@/components/ui/SpectrogramCanvas';
import { ToastNotification, ToastType } from '@/components/ui/ToastNotification';
import { ErrorState } from '@/components/ui/ErrorState';
import { NavigationHeader } from '@/components/layout/NavigationHeader';
import { KeyboardShortcutFooter } from '@/components/layout/KeyboardShortcutFooter';
import { TelemetryBar } from '@/components/layout/TelemetryBar';
import { useWebSocketStream } from '@/hooks/useWebSocketStream';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { apiClient, ApiError } from '@/lib/apiClient';
import { Mic, Radio, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { ContextualHint } from '@/components/ui/ContextualHint';

export default function Dashboard() {
  const [referenceAudio, setReferenceAudio] = useState<Blob | null>(null);
  const { isStreaming, connectAndStream, stopStreaming, error: wsError } = useWebSocketStream();
  
  // UI Layout State
  const [showRecorder, setShowRecorder] = useState(true);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  
  // Toast & Error State
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [apiError, setApiError] = useState<{ message: string; code?: number | string } | null>(null);

  // Telemetry state
  const [rtfHistory, setRtfHistory] = useState<number[]>([0.8, 0.85, 0.9, 0.75, 0.8]);
  const [ttfbHistory, setTtfbHistory] = useState<number[]>([150, 140, 160, 120, 130]);
  const currentRTF = isStreaming ? 0.95 : 0.8;
  const currentTTFB = isStreaming ? 180 : 130;

  useEffect(() => {
    if (isStreaming) {
      setToast({ message: 'Establishing neural WebSocket stream...', type: 'Processing' });
    } else if (isSynthesizing && !isStreaming && !apiError) {
      setIsSynthesizing(false);
      setToast({ message: 'Synthesis completed successfully.', type: 'Success' });
    }
  }, [isStreaming, isSynthesizing, apiError]);

  useEffect(() => {
    if (wsError) {
      setApiError({ message: wsError, code: 'STREAM_DISCONNECT' });
      setIsSynthesizing(false);
    }
  }, [wsError]);

  const handleMasterRender = async (blocks: any[], totalTokens: number) => {
    if (blocks.length === 0 || totalTokens === 0) {
      setToast({ message: 'Synthesis prompt cannot be empty.', type: 'Error' });
      return;
    }

    setApiError(null);
    setIsSynthesizing(true);
    setToast({ message: 'Dispatching neural synthesis task...', type: 'Processing' });

    // Simulate telemetry changes
    setRtfHistory(prev => [...prev.slice(-4), currentRTF]);
    setTtfbHistory(prev => [...prev.slice(-4), currentTTFB]);

    const combinedText = blocks.map(b => b.text.trim()).filter(Boolean).join(' ');

    try {
      let taskId: string;

      if (referenceAudio) {
        // Zero-Shot Voice Cloning Path (POST /api/v1/voice/clone)
        const formData = new FormData();
        const fileExt = referenceAudio.type.includes('ogg') ? 'ogg' : referenceAudio.type.includes('mp3') ? 'mp3' : 'wav';
        formData.append('file', referenceAudio, `reference.${fileExt}`);
        formData.append('text', combinedText);
        formData.append('voice_name', blocks[0]?.preset || 'cloned-voice');

        const cloneResponse = await apiClient.cloneVoice(formData);
        taskId = cloneResponse.task_id;
      } else {
        // Direct TTS Generation Path (POST /api/v1/tts/generate)
        const ttsResponse = await apiClient.generateTTS({
          voice_id: blocks[0]?.preset || 'default',
          text: combinedText,
          speed: 1.0,
          pitch: 1.0,
        });
        taskId = ttsResponse.task_id;
      }

      setActiveTaskId(taskId);
      connectAndStream(taskId);
    } catch (err: any) {
      setIsSynthesizing(false);
      const errorMessage = err instanceof ApiError ? err.message : err?.message || 'Failed to dispatch synthesis';
      const statusCode = err instanceof ApiError ? err.status : 'DISPATCH_ERROR';
      
      setApiError({ message: errorMessage, code: statusCode });
      setToast({ message: errorMessage, type: 'Error' });
    }
  };

  useKeyboardShortcuts({
    onSynthesize: () => {
      if (!isStreaming && !isSynthesizing) {
        setToast({ message: 'Cmd+Enter shortcut triggered. Generating sequence...', type: 'Processing' });
        handleMasterRender([{ text: "Neural synthesis sequence executed via shortcut.", preset: "default" }], 48);
      }
    },
    onEscape: () => {
      if (isStreaming || isSynthesizing) {
        stopStreaming();
        setIsSynthesizing(false);
        setToast({ message: 'Synthesis stream aborted by user.', type: 'Warning' });
      }
    },
  });

  return (
    <div className="min-h-screen bg-surface-root text-text-primary selection:bg-sky-500/20 selection:text-sky-200 font-sans flex flex-col justify-between">
      <NavigationHeader activeTab="studio" isStreaming={isStreaming || isSynthesizing} />

      {/* Progressive Disclosure Telemetry Bar */}
      <TelemetryBar
        currentRTF={currentRTF}
        currentTTFB={currentTTFB}
        rtfHistory={rtfHistory}
        ttfbHistory={ttfbHistory}
        isStreaming={isStreaming || isSynthesizing}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        
        {/* Error Alert Display */}
        {apiError && (
          <ErrorState
            title="Synthesis Task Failed"
            message={apiError.message}
            code={apiError.code}
            onDismiss={() => setApiError(null)}
            onRetry={() => handleMasterRender([{ text: "Retry attempt payload", preset: "default" }], 20)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          
          {/* Left Column - Voice Cloning & Storyboard */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Collapsible Recorder Section */}
            <section data-tour="voice-recorder" className="bg-surface-panel rounded-2xl border border-border-subtle overflow-hidden transition-all duration-300">
              <div 
                onClick={() => setShowRecorder(!showRecorder)}
                className="w-full flex items-center justify-between p-4 bg-surface-elevated/40 hover:bg-surface-elevated/80 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-2 text-text-secondary">
                  <Mic size={18} className="text-sky-400" />
                  <h2 className="font-semibold text-xs uppercase tracking-wider font-mono">Voice Reference</h2>
                  <ContextualHint
                    title="Zero-Shot Reference Sample"
                    description="Provide 3-5 seconds of clean, noise-free voice audio to extract a 256-d speaker identity embedding vector."
                    proTip="Use a condenser microphone with minimal reverb for best speaker fidelity."
                    placement="right"
                  />
                </div>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRecorder(!showRecorder);
                  }}
                  className="text-text-muted hover:text-text-primary p-1 rounded-lg transition-colors focus-ring cursor-pointer"
                  aria-label={showRecorder ? "Collapse Voice Reference" : "Expand Voice Reference"}
                >
                  {showRecorder ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
              
              <div className={`transition-all duration-300 ease-in-out ${showRecorder ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-4 pt-0">
                  <AudioRecorder onRecordingComplete={(blob) => {
                    setReferenceAudio(blob);
                    if (blob) {
                      setApiError(null);
                      setToast({ message: 'Reference audio captured ready for zero-shot cloning.', type: 'Success' });
                    }
                  }} />
                </div>
              </div>
            </section>

            {/* Synthesizer Storyboard */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-text-secondary px-1">
                <Radio size={18} className="text-sky-400" />
                <h2 className="font-semibold text-xs uppercase tracking-wider font-mono">Neural Synthesis Engine</h2>
              </div>
              <StoryboardEditor
                onMasterRender={handleMasterRender}
                isSynthesizing={isStreaming || isSynthesizing}
              />
            </section>
          </div>

          {/* Right Column - Spectrogram & WaveSurfer Visualizers */}
          <div data-tour="spectrogram-canvas" className="lg:col-span-7 flex flex-col gap-6">
            <section className="space-y-3 h-full flex flex-col">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Activity size={18} className="text-sky-400" />
                  <h2 className="font-semibold text-xs uppercase tracking-wider font-mono">Acoustic Analysis & Output</h2>
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
                  <p className="text-xs font-mono text-text-muted ml-1 uppercase tracking-wider">Audio Playhead Review</p>
                  {referenceAudio ? (
                    <WaveSurferVisualizer audioBlob={referenceAudio} />
                  ) : (
                    <div className="h-32 flex items-center justify-center border-2 border-dashed border-border-subtle rounded-2xl bg-surface-panel text-text-muted text-sm font-medium">
                      No audio rendered yet.
                    </div>
                  )}
                </div>

                {/* Real-time Spectrogram */}
                <div className="space-y-2 mt-2">
                  <SpectrogramCanvas isActive={isStreaming || isSynthesizing} />
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
