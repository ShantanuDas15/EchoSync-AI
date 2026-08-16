import { useState, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';

const MAX_RETRIES = 3;

export function useWebSocketStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);
  const isIntentionalCloseRef = useRef<boolean>(false);

  const getWebSocketUrl = useCallback((taskId: string): string => {
    const baseUrl = apiClient.getBaseUrl();
    let wsUrl: string;

    if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
      const wsProtocol = baseUrl.startsWith('https://') ? 'wss://' : 'ws://';
      const host = baseUrl.replace(/^https?:\/\//, '');
      wsUrl = `${wsProtocol}${host}/ws/v1/stream/${taskId}`;
    } else if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/ws/v1/stream/${taskId}`;
    } else {
      wsUrl = `ws://localhost:8000/ws/v1/stream/${taskId}`;
    }

    return wsUrl;
  }, []);

  const connectAndStream = useCallback((taskId: string) => {
    setIsStreaming(true);
    setError(null);
    isIntentionalCloseRef.current = false;

    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 22050 });
      audioContextRef.current = audioCtx;
      nextStartTimeRef.current = audioCtx.currentTime;
    }

    const audioCtx = audioContextRef.current;

    const establishConnection = () => {
      const wsUrl = getWebSocketUrl(taskId);
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`WebSocket connected for streaming task: ${taskId}`);
        retryCountRef.current = 0; // Reset on successful connect
      };

      ws.onmessage = async (event) => {
        const arrayBuffer = event.data;
        
        // Check for EOF packet (0x00FF)
        if (arrayBuffer.byteLength === 2) {
          const view = new Uint8Array(arrayBuffer);
          if (view[0] === 0x00 && view[1] === 0xFF) {
            console.log('Received EOF packet');
            isIntentionalCloseRef.current = true;
            ws.close();
            setIsStreaming(false);
            return;
          }
        }

        const int16Array = new Int16Array(arrayBuffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0;
        }

        const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 22050);
        audioBuffer.getChannelData(0).set(float32Array);

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);

        const startTime = Math.max(audioCtx.currentTime, nextStartTimeRef.current);
        source.start(startTime);
        nextStartTimeRef.current = startTime + audioBuffer.duration;
      };

      ws.onerror = (e) => {
        console.error('WebSocket error:', e);
      };

      ws.onclose = (event) => {
        if (isIntentionalCloseRef.current) {
          console.log('WebSocket closed cleanly');
          setIsStreaming(false);
          return;
        }

        if (retryCountRef.current < MAX_RETRIES) {
          const backoff = Math.pow(2, retryCountRef.current) * 1000;
          retryCountRef.current += 1;
          console.warn(`WebSocket disconnected. Retrying in ${backoff}ms... (${retryCountRef.current}/${MAX_RETRIES})`);
          setTimeout(establishConnection, backoff);
        } else {
          setError('Connection timed out after multiple attempts. Please try again.');
          setIsStreaming(false);
        }
      };
    };

    establishConnection();

  }, [getWebSocketUrl]);

  const stopStreaming = useCallback(() => {
    isIntentionalCloseRef.current = true;
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setIsStreaming(false);
  }, []);

  return { isStreaming, error, connectAndStream, stopStreaming, getWebSocketUrl };
}
