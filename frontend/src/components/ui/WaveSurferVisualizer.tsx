"use client";

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, ZoomIn, ZoomOut } from 'lucide-react';

interface WaveSurferVisualizerProps {
  audioUrl?: string;
  audioBlob?: Blob;
}

export function WaveSurferVisualizer({ audioUrl, audioBlob }: WaveSurferVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4f46e5', // Indigo 600
      progressColor: '#c7d2fe', // Indigo 200
      cursorColor: '#818cf8',
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 80,
      normalize: true,
    });

    wavesurferRef.current = wavesurfer;

    wavesurfer.on('ready', () => setIsReady(true));
    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));
    wavesurfer.on('finish', () => setIsPlaying(false));

    return () => {
      wavesurfer.destroy();
    };
  }, []);

  useEffect(() => {
    if (wavesurferRef.current) {
      if (audioUrl) {
        wavesurferRef.current.load(audioUrl);
      } else if (audioBlob) {
        const objectUrl = URL.createObjectURL(audioBlob);
        wavesurferRef.current.load(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
      }
    }
  }, [audioUrl, audioBlob]);

  const togglePlay = () => {
    wavesurferRef.current?.playPause();
  };

  const handleZoom = (zoomIn: boolean) => {
    if (!wavesurferRef.current) return;
    const currentMinPxPerSec = wavesurferRef.current.options.minPxPerSec || 50;
    const newZoom = zoomIn ? currentMinPxPerSec * 1.5 : currentMinPxPerSec / 1.5;
    wavesurferRef.current.zoom(Math.max(10, Math.min(newZoom, 1000)));
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
      <div className="w-full" ref={containerRef} />
      
      <div className="flex items-center justify-between">
        <button
          onClick={togglePlay}
          disabled={!isReady}
          className="flex items-center justify-center w-10 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-white transition-colors"
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleZoom(false)}
            disabled={!isReady}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={() => handleZoom(true)}
            disabled={!isReady}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <ZoomIn size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
