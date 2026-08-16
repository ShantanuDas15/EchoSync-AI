"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Mic, Square, Settings, AlertTriangle, Play, Pause, Trash2, MicOff } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob | null) => void;
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const { isRecording, volume, isClipping, startRecording, stopRecording } = useAudioRecorder();
  const [timer, setTimer] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Only attempt to enumerate devices if the API is available
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
        const audioInputs = deviceInfos.filter(device => device.kind === 'audioinput');
        setDevices(audioInputs);
        if (audioInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(audioInputs[0].deviceId);
        }
      }).catch(console.error);
    }
  }, [selectedDeviceId]);

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

  const handleToggleRecord = async () => {
    if (isRecording) {
      const blob = await stopRecording();
      if (blob) {
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingComplete(blob);
      }
    } else {
      setRecordedBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      onRecordingComplete(null);
      await startRecording(selectedDeviceId);
    }
  };

  const handleClear = () => {
    setRecordedBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    onRecordingComplete(null);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col items-center p-6 glass-panel rounded-2xl relative overflow-hidden space-y-6">
      
      {/* Device Selector */}
      <div className="w-full flex items-center justify-between z-10 text-xs">
        <div className="flex items-center gap-2">
          <Settings size={14} className="text-text-muted" />
          <select 
            className="bg-surface-elevated border border-border-subtle text-text-primary rounded-lg px-2 py-1 outline-none focus:border-sky-400 focus-ring"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            disabled={isRecording || !!recordedBlob}
          >
            {devices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.substring(0, 5)}`}
              </option>
            ))}
            {devices.length === 0 && <option value="">No microphones found</option>}
          </select>
        </div>

        {/* Alerts */}
        {(isClipping || (timer > 30)) && isRecording && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-status-error/15 border border-status-error/40 rounded-lg text-status-error font-medium">
            <AlertTriangle size={14} />
            <span>{isClipping ? 'Audio Clipping!' : 'Length > 30s'}</span>
          </div>
        )}
      </div>

      {!recordedBlob ? (
        <>
          <div className="flex flex-col items-center gap-1 z-10 mt-1">
            <h3 className="text-base font-semibold text-text-primary tracking-tight">
              {isRecording ? "Recording Audio Stream..." : "Capture Reference Voice"}
            </h3>
            <p className={`text-4xl font-mono tabular-nums tracking-wider ${isRecording ? 'text-text-primary font-bold' : 'text-text-muted'}`}>
              {formatTime(timer)}
            </p>
          </div>

          <div className="relative w-full h-20 flex items-end justify-center gap-[3px] z-10 px-4">
            {/* Animated VU gain bar visualization */}
            {Array.from({ length: 30 }).map((_, i) => {
              const position = (i / 29) * 2 - 1;
              const curve = 1 - Math.pow(position, 2);
              const randomFactor = isRecording ? 0.8 + Math.random() * 0.4 : 1;
              const mappedHeight = isRecording ? Math.max(6, volume * curve * randomFactor) : 6;
              
              const isHigh = mappedHeight > 85;
              const isMed = mappedHeight > 60;
              const colorClass = isHigh ? 'bg-status-error' : isMed ? 'bg-status-warning' : 'bg-sky-400';

              return (
                <div
                  key={i}
                  className={`w-full rounded-t-sm transition-all duration-75 ${colorClass}`}
                  style={{
                    height: `${mappedHeight}%`,
                    opacity: isRecording ? (isHigh ? 1 : 0.85) : 0.25
                  }}
                />
              );
            })}
          </div>

          <button
            onClick={handleToggleRecord}
            className={`z-10 flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all duration-200 focus-ring ${
              isRecording
                ? 'bg-status-error hover:bg-status-error/90 shadow-status-error/30 scale-95'
                : devices.length === 0 
                  ? 'bg-surface-elevated cursor-not-allowed text-text-muted border border-border-subtle'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/25 hover:scale-105 active:scale-95'
            }`}
            disabled={!isRecording && devices.length === 0}
            aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            {isRecording ? (
              <Square className="w-6 h-6 text-white" fill="currentColor" />
            ) : devices.length === 0 ? (
               <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>
        </>
      ) : (
        /* Preview Player */
        <div className="flex flex-col items-center w-full z-10 space-y-4">
          <div className="text-emerald-400 flex items-center gap-2 text-xs font-semibold font-mono uppercase tracking-wider">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Audio Captured Successfully
          </div>
          
          <div className="flex items-center justify-between gap-4 w-full bg-surface-elevated/70 p-4 rounded-xl border border-border-subtle">
            <button
              onClick={togglePlayback}
              className="w-10 h-10 flex items-center justify-center bg-sky-600 hover:bg-sky-500 text-white rounded-full transition-all active:scale-95 focus-ring shadow-sm"
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>
            
            {audioUrl && (
              <audio 
                ref={audioRef} 
                src={audioUrl} 
                onEnded={() => setIsPlaying(false)}
                className="hidden" 
              />
            )}
            
            <div className="flex-1 text-center">
              <p className="text-text-primary text-sm font-mono tracking-wider">{timer}s Reference</p>
              <p className="text-text-muted text-xs font-mono">22.05 kHz Mono PCM</p>
            </div>
            
            <button
              onClick={handleClear}
              className="w-10 h-10 flex items-center justify-center bg-surface-panel hover:bg-status-error/15 hover:text-status-error text-text-muted rounded-full transition-colors border border-border-subtle focus-ring"
              title="Delete and re-record"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Subtle background recording pulse */}
      {isRecording && (
        <div className="absolute inset-0 bg-status-error/5 pointer-events-none" />
      )}
    </div>
  );
}
