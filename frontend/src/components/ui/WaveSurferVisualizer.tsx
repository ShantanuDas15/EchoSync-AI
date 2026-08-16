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
      waveColor: '#0ea5e9', // Sky 500
      progressColor: '#bae6fd', // Sky 200
      cursorColor: '#38bdf8',
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
      <div className="w-full relative rounded-lg overflow-hidden bg-surface-panel p-2 border border-border-subtle" ref={containerRef} />
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            disabled={!isReady}
            className="flex items-center justify-center w-12 h-12 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-white shadow-md shadow-sky-600/20 transition-all active:scale-95 focus-ring"
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>
          
          <select 
            value={playbackRate} 
            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
            className="bg-surface-elevated text-xs font-mono font-medium text-text-primary rounded px-2 py-1 outline-none border border-border-subtle focus:border-sky-400 transition-colors"
          >
            {[0.75, 1.0, 1.25, 1.5, 2.0].map(rate => (
              <option key={rate} value={rate}>{rate}x</option>
            ))}
          </select>
        </div>

        {/* Volume & Zoom */}
        <div className="flex items-center gap-6 text-text-secondary">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMuted(!isMuted)} className="hover:text-sky-400 transition-colors">
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
              className="w-20 accent-sky-500 cursor-pointer"
            />
          </div>
          
          <div className="flex items-center gap-2 hidden sm:flex">
            <ZoomOut size={16} />
            <input 
              type="range" 
              min="10" max="200" step="10" 
              value={zoom} 
              onChange={(e) => setZoom(parseInt(e.target.value))}
              className="w-24 accent-sky-500 cursor-pointer"
            />
            <ZoomIn size={16} />
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={!isReady}
            className="flex items-center justify-center w-10 h-10 bg-surface-elevated hover:bg-surface-panel text-text-secondary rounded-full transition-colors disabled:opacity-50 border border-border-subtle"
          >
            <MoreVertical size={20} />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 bottom-full mb-2 w-48 bg-surface-elevated border border-border-elevated rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
              <button 
                onClick={() => { handleDownloadWav(); setShowExportMenu(false); }}
                className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-sky-600 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Download size={16} /> Download .WAV
              </button>
              <button 
                onClick={() => { 
                  if (onDownloadMp3) onDownloadMp3();
                  else alert("MP3 download functionality requires external FFmpeg encoding or server-side conversion.");
                  setShowExportMenu(false); 
                }}
                className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-sky-600 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Download size={16} /> Download .MP3
              </button>
              <button 
                onClick={() => { handleCopyUrl(); setShowExportMenu(false); }}
                className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-sky-600 hover:text-white flex items-center gap-2 transition-colors"
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
