"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

// Global singleton reference for currently active preview
let globalPlayingId: string | null = null;
const globalListeners = new Set<(id: string | null) => void>();

function notifyListeners(id: string | null) {
  globalPlayingId = id;
  globalListeners.forEach((listener) => listener(id));
}

export function useAudioPlayer() {
  const [activeId, setActiveId] = useState<string | null>(globalPlayingId);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handler = (id: string | null) => {
      setActiveId(id);
    };
    globalListeners.add(handler);

    return () => {
      globalListeners.delete(handler);
    };
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    notifyListeners(null);
  }, []);

  const play = useCallback((id: string, audioUrl?: string) => {
    if (globalPlayingId && globalPlayingId !== id) {
      stop();
    }

    if (audioUrl && typeof Audio !== 'undefined') {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio(audioUrl);
          audioRef.current.onended = () => notifyListeners(null);
        } else {
          audioRef.current.src = audioUrl;
          audioRef.current.currentTime = 0;
        }
        audioRef.current.play().catch(() => {
          // Fallback if browser blocks unprompted autoplay
        });
      } catch {
        // Safe mock handling for non-browser / test environments
      }
    }

    notifyListeners(id);
  }, [stop]);

  const toggle = useCallback((id: string, audioUrl?: string) => {
    if (globalPlayingId === id) {
      stop();
    } else {
      play(id, audioUrl);
    }
  }, [play, stop]);

  const isPlaying = useCallback((id: string) => {
    return activeId === id;
  }, [activeId]);

  return {
    activeId,
    isPlaying,
    play,
    stop,
    toggle
  };
}
