"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0); // 0 to 100 scale
  const [isClipping, setIsClipping] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const updateVolume = useCallback(() => {
    if (analyserRef.current) {
      const dataArray = new Float32Array(analyserRef.current.fftSize);
      analyserRef.current.getFloatTimeDomainData(dataArray);

      let max = 0;
      let sumSquares = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const val = dataArray[i];
        sumSquares += val * val;
        const absVal = Math.abs(val);
        if (absVal > max) {
          max = absVal;
        }
      }

      // Check for clipping (> 0 dBFS practically >= 0.99 amplitude)
      if (max >= 0.99) {
        setIsClipping(true);
      } else {
        setIsClipping(false);
      }

      const rms = Math.sqrt(sumSquares / dataArray.length);
      // dBFS calculation (reference is 1.0)
      let dbfs = 20 * Math.log10(rms);
      
      // Silence gives -Infinity
      if (dbfs === -Infinity || Number.isNaN(dbfs)) dbfs = -100;

      // Map -60 dBFS (silence) to 0 dBFS (max) -> 0 to 100 scale
      const mappedVolume = Math.max(0, Math.min(100, (dbfs + 60) * (100 / 60)));
      
      setVolume(mappedVolume);
    }
    animationFrameRef.current = requestAnimationFrame(updateVolume);
  }, []);

  const startRecording = useCallback(async (deviceId?: string) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          channelCount: 1,
          sampleRate: 22050,
          echoCancellation: true,
          noiseSuppression: true,
          ...(deviceId ? { deviceId: { exact: deviceId } } : {})
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 22050 });
      audioContextRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048; // better resolution for time domain
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsClipping(false);
      updateVolume();
    } catch (err) {
      console.error("Failed to start recording:", err);
      setIsRecording(false);
    }
  }, [updateVolume]);

  const stopRecording = useCallback(() => {
    return new Promise<Blob | null>((resolve) => {
      setIsRecording(false);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          resolve(blob);
        };
        mediaRecorderRef.current.stop();
      } else {
        resolve(null);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      setVolume(0);
      setIsClipping(false);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  return { isRecording, volume, isClipping, startRecording, stopRecording };
}
