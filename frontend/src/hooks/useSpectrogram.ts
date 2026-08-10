import { useRef, useEffect, useCallback } from 'react';

export function useSpectrogram(audioContext: AudioContext | null, sourceNode: AudioNode | null) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!audioContext || !sourceNode) return;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    sourceNode.connect(analyser);
    analyserRef.current = analyser;

    return () => {
      sourceNode.disconnect(analyser);
      analyserRef.current = null;
    };
  }, [audioContext, sourceNode]);

  const draw = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const width = canvas.width;
    const height = canvas.height;

    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = 'rgb(15, 23, 42)'; // Slate 900
    ctx.fillRect(0, 0, width, height);

    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * height;

      // Gradient for sleek aesthetic
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      gradient.addColorStop(0, '#3b82f6'); // blue-500
      gradient.addColorStop(1, '#8b5cf6'); // violet-500

      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }

    animationRef.current = requestAnimationFrame(draw);
  }, []);

  const startVisualizing = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    draw();
  }, [draw]);

  const stopVisualizing = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return { canvasRef, startVisualizing, stopVisualizing };
}
