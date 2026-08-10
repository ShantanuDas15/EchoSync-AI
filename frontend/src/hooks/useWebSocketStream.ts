import { useState, useRef, useCallback } from 'react';

export function useWebSocketStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const connectAndStream = useCallback((taskId: string) => {
    setIsStreaming(true);
    setError(null);

    // Initialize AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass({ sampleRate: 22050 });
    audioContextRef.current = audioCtx;
    nextStartTimeRef.current = audioCtx.currentTime;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Using a relative URL assuming API is mounted on the same host or proxy is set up
    const wsUrl = `${protocol}//${window.location.host}/ws/v1/stream/${taskId}`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected for streaming');
    };

    ws.onmessage = async (event) => {
      const arrayBuffer = event.data;
      
      // Check for EOF packet (0x00FF)
      if (arrayBuffer.byteLength === 2) {
        const view = new Uint8Array(arrayBuffer);
        if (view[0] === 0x00 && view[1] === 0xFF) {
          console.log('Received EOF packet');
          ws.close();
          setIsStreaming(false);
          return;
        }
      }

      // Decode PCM 16-bit array buffer to AudioBuffer
      // Since it's raw PCM, we need to convert it manually to Float32Array for AudioContext
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
      setError('WebSocket connection failed');
      setIsStreaming(false);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      setIsStreaming(false);
    };
  }, []);

  const stopStreaming = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setIsStreaming(false);
  }, []);

  return { isStreaming, error, connectAndStream, stopStreaming };
}
