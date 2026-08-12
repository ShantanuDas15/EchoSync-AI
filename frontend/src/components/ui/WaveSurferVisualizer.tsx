"use client";

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, ZoomIn, ZoomOut, Volume2, VolumeX, Download, Link as LinkIcon, MoreVertical } from 'lucide-react';

interface WaveSurferVisualizerProps {
  audioUrl?: string;
  audioBlob?: Blob;
  onDownloadMp3?: () => void; // Optional hook for external mp3 conversion
}

export function WaveSurferVisualizer({ audioUrl, audioBlob, onDownloadMp3 }: WaveSurferVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [zoom, setZoom] = useState(50);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const activeAudioUrl = audioBlob ? URL.createObjectURL(audioBlob) : audioUrl;

  useEffect(() => {
    if (!containerRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#6366f1', // Indigo 500
      progressColor: '#c7d2fe', // Indigo 200
      cursorColor: '#818cf8',
      barWidth: 2,
      barGap: 3,
      barRadius: 2,
      height: 96,
      normalize: true,
      minPxPerSec: 50,
    });

    wavesurferRef.current = wavesurfer;

    wavesurfer.on('ready', () => {
      setIsReady(true);
      wavesurfer.setVolume(volume);
      wavesurfer.setPlaybackRate(playbackRate);
    });
    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));
    wavesurfer.on('finish', () => setIsPlaying(false));

    return () => {
      wavesurfer.destroy();
    };
  }, []);

  useEffect(() => {
    if (wavesurferRef.current && activeAudioUrl) {
      wavesurferRef.current.load(activeAudioUrl);
    }
  }, [activeAudioUrl]);

  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(zoom);
    }
  }, [zoom]);

  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(playbackRate);
    }
  }, [playbackRate]);

  const togglePlay = () => {
    wavesurferRef.current?.playPause();
  };

  const handleDownloadWav = () => {
    if (activeAudioUrl) {
      const a = document.createElement('a');
      a.href = activeAudioUrl;
      a.download = `recording-${new Date().getTime()}.wav`;
      a.click();
    }
  };

  const handleCopyUrl = async () => {
    if (audioUrl) {
      await navigator.clipboard.writeText(audioUrl);
      alert('URL copied to clipboard!');
    } else {
      alert('No public URL available for this audio.');
    }
  };

  return (
    <div className="flex flex-col gap-5 p-5 glass-panel rounded-2xl relative">
      <div className="w-full relative rounded-lg overflow-hidden bg-slate-900/50 p-2" ref={containerRef} />
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            disabled={!isReady}
            className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-white shadow-lg transition-all active:scale-95 focus-ring"
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>
          
          <select 
            value={playbackRate} 
            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
            className="bg-slate-800 text-xs font-mono font-medium text-slate-300 rounded px-2 py-1 outline-none border border-slate-700 focus:border-indigo-500 transition-colors"
          >
            {[0.75, 1.0, 1.25, 1.5, 2.0].map(rate => (
              <option key={rate} value={rate}>{rate}x</option>
            ))}
          </select>
        </div>

        {/* Volume & Zoom */}
        <div className="flex items-center gap-6 text-slate-400">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMuted(!isMuted)} className="hover:text-indigo-400 transition-colors">
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input 
              type="range" 
              min="0" max="1" step="0.01" 
              value={isMuted ? 0 : volume} 
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-20 accent-indigo-500 cursor-pointer"
            />
          </div>
          
          <div className="flex items-center gap-2 hidden sm:flex">
            <ZoomOut size={16} />
            <input 
              type="range" 
              min="10" max="200" step="10" 
              value={zoom} 
              onChange={(e) => setZoom(parseInt(e.target.value))}
              className="w-24 accent-indigo-500 cursor-pointer"
            />
            <ZoomIn size={16} />
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={!isReady}
            className="flex items-center justify-center w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors disabled:opacity-50"
          >
            <MoreVertical size={20} />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
              <button 
                onClick={() => { handleDownloadWav(); setShowExportMenu(false); }}
                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-indigo-500 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Download size={16} /> Download .WAV
              </button>
              <button 
                onClick={() => { 
                  if (onDownloadMp3) onDownloadMp3();
                  else alert("MP3 download functionality requires external FFmpeg encoding or server-side conversion.");
                  setShowExportMenu(false); 
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-indigo-500 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Download size={16} /> Download .MP3
              </button>
              <button 
                onClick={() => { handleCopyUrl(); setShowExportMenu(false); }}
                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-indigo-500 hover:text-white flex items-center gap-2 transition-colors"
              >
                <LinkIcon size={16} /> Copy URL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
