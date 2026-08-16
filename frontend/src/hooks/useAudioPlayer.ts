"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchPresignedAudioUrl } from '@/lib/secureAudioUtils';

// Global singleton reference for currently active preview
let globalPlayingId: string | null = null;
const globalListeners = new Set<(id: string | null) => void>();

function notifyListeners(id: string | null) {
  globalPlayingId = id;
  globalListeners.forEach((listener) => listener(id));
}

export function useAudioPlayer() {
  const [activeId, setActiveId] = useState<string | null>(globalPlayingId);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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
    setIsLoading(false);
  }, []);

  const play = useCallback(async (id: string, audioSource?: string, isAssetId: boolean = false) => {
    if (globalPlayingId && globalPlayingId !== id) {
      stop();
    }

    setError(null);
    setIsLoading(true);

    let resolvedUrl = audioSource;

    try {
      if (isAssetId && audioSource) {
        resolvedUrl = await fetchPresignedAudioUrl(audioSource);
      }

      if (resolvedUrl && typeof Audio !== 'undefined') {
        if (!audioRef.current) {
          audioRef.current = new Audio(resolvedUrl);
          audioRef.current.onended = () => {
            notifyListeners(null);
            setIsLoading(false);
          };
          audioRef.current.onerror = async () => {
            // If asset URL expired (403), attempt a force refresh once
            if (isAssetId && audioSource) {
              try {
                const refreshedUrl = await fetchPresignedAudioUrl(audioSource, { forceRefresh: true });
                if (audioRef.current) {
                  audioRef.current.src = refreshedUrl;
                  await audioRef.current.play();
                  return;
                }
              } catch {
                // Ignore fallback error
              }
            }
            notifyListeners(null);
            setIsLoading(false);
            setError('Failed to play audio stream');
          };
        } else {
          audioRef.current.src = resolvedUrl;
          audioRef.current.currentTime = 0;
        }

        await audioRef.current.play().catch(() => {
          // Fallback if browser blocks unprompted autoplay
        });
      }

      notifyListeners(id);
    } catch (err: any) {
      setError(err?.message || 'Audio playback error');
      notifyListeners(null);
    } finally {
      setIsLoading(false);
    }
  }, [stop]);

  const toggle = useCallback((id: string, audioSource?: string, isAssetId: boolean = false) => {
    if (globalPlayingId === id) {
      stop();
    } else {
      play(id, audioSource, isAssetId);
    }
  }, [play, stop]);

  const isPlaying = useCallback((id: string) => {
    return activeId === id;
  }, [activeId]);

  return {
    activeId,
    isPlaying,
    isLoading,
    error,
    play,
    stop,
    toggle
  };
}
