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
          <Settings size={14} className="text-slate-500" />
          <select 
            className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-2 py-1 outline-none focus-ring"
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
          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-red-400 font-medium">
            <AlertTriangle size={14} />
            <span>{isClipping ? 'Audio Clipping!' : 'Length > 30s'}</span>
          </div>
        )}
      </div>

      {!recordedBlob ? (
        <>
          <div className="flex flex-col items-center gap-1 z-10 mt-2">
            <h3 className="text-lg font-medium text-slate-300 tracking-wide">
              {isRecording ? "Recording..." : "Capture Reference Voice"}
            </h3>
            <p className={`text-4xl font-mono tabular-nums tracking-wider ${isRecording ? 'text-white' : 'text-slate-500'}`}>
              {formatTime(timer)}
            </p>
          </div>

          <div className="relative w-full h-24 flex items-end justify-center gap-[3px] z-10 px-4">
            {/* Dual-channel animated VU gain bar canvas (simulated via DOM for simplicity/reactivity) */}
            {Array.from({ length: 30 }).map((_, i) => {
              // Create a parabolic curve for the meter to make it look like a real wave
              const position = (i / 29) * 2 - 1; // -1 to 1
              const curve = 1 - Math.pow(position, 2); // 0 to 1 to 0
              // Add a bit of randomness to each bar
              const randomFactor = isRecording ? 0.8 + Math.random() * 0.4 : 1;
              const mappedHeight = isRecording ? Math.max(4, volume * curve * randomFactor) : 4;
              
              const isHigh = mappedHeight > 85;
              const isMed = mappedHeight > 60;
              const colorClass = isHigh ? 'bg-red-500' : isMed ? 'bg-yellow-400' : 'bg-emerald-400';

              return (
                <div
                  key={i}
                  className={`w-full rounded-t-sm transition-all duration-75 ${colorClass}`}
                  style={{
                    height: `${mappedHeight}%`,
                    opacity: isRecording ? (isHigh ? 1 : 0.8) : 0.2
                  }}
                />
              );
            })}
          </div>

          <button
            onClick={handleToggleRecord}
            className={`z-10 flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all duration-300 focus-ring ${
              isRecording
                ? 'bg-red-500 hover:bg-red-400 shadow-red-500/50 scale-95'
                : devices.length === 0 
                  ? 'bg-slate-600 cursor-not-allowed text-slate-400'
                  : 'bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/50 hover:scale-105'
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
          <div className="text-emerald-400 flex items-center gap-2 text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            Audio Captured Successfully
          </div>
          
          <div className="flex items-center justify-center gap-4 w-full bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <button
              onClick={togglePlayback}
              className="w-10 h-10 flex items-center justify-center bg-indigo-500 hover:bg-indigo-400 text-white rounded-full transition-colors focus-ring"
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
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
              <p className="text-slate-300 text-sm font-mono tracking-wider">{timer}s Reference</p>
              <p className="text-slate-500 text-xs">22.05 kHz Mono PCM</p>
            </div>
            
            <button
              onClick={handleClear}
              className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-full transition-colors focus-ring"
              title="Delete and re-record"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Decorative background pulse */}
      {isRecording && (
        <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
      )}
    </div>
  );
}
