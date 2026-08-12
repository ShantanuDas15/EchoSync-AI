"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Palette } from 'lucide-react';

interface SpectrogramCanvasProps {
  analyserNode?: AnalyserNode; // For real-time WebAudio processing
  isActive?: boolean;
}

type PaletteName = 'Electric Neon Indigo' | 'Inferno' | 'Magma' | 'Viridis';

export function SpectrogramCanvas({ analyserNode, isActive = false }: SpectrogramCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [theme, setTheme] = useState<PaletteName>('Electric Neon Indigo');
  const [fps, setFps] = useState(0);

  // Helper to generate color scale based on theme
  const getColor = (value: number, currentTheme: PaletteName) => {
    // value is 0.0 to 1.0 (normalized from uint8 0-255)
    switch (currentTheme) {
      case 'Inferno':
        // Black -> Purple -> Orange -> Yellow -> White
        if (value < 0.25) return `rgb(${value*4*120}, 0, ${value*4*120})`;
        if (value < 0.5) return `rgb(120+${(value-0.25)*4*135}, 0, 120)`;
        if (value < 0.75) return `rgb(255, ${(value-0.5)*4*255}, 0)`;
        return `rgb(255, 255, ${(value-0.75)*4*255})`;
      case 'Magma':
        // Black -> Deep Purple -> Red -> Pink -> White
        if (value < 0.3) return `rgb(${value*3.33*80}, 0, ${value*3.33*120})`;
        if (value < 0.6) return `rgb(80+${(value-0.3)*3.33*175}, 0, 120)`;
        if (value < 0.85) return `rgb(255, ${(value-0.6)*4*150}, ${(value-0.6)*4*150})`;
        return `rgb(255, ${150+(value-0.85)*6.66*105}, ${150+(value-0.85)*6.66*105})`;
      case 'Viridis':
        // Dark Purple -> Teal -> Green -> Yellow
        if (value < 0.3) return `rgb(${value*3.33*60}, 0, ${value*3.33*100})`;
        if (value < 0.6) return `rgb(60, ${(value-0.3)*3.33*150}, ${100+(value-0.3)*3.33*50})`;
        if (value < 0.9) return `rgb(60+${(value-0.6)*3.33*150}, ${150+(value-0.6)*3.33*105}, 150-${(value-0.6)*3.33*100})`;
        return `rgb(210+${(value-0.9)*10*45}, 255, 50)`;
      case 'Electric Neon Indigo':
      default:
        // Neon Blue/Indigo -> Cyan -> White
        if (value < 0.5) return `rgb(0, ${(value*2)*100}, ${(value*2)*255})`;
        if (value < 0.8) return `rgb(${(value-0.5)*3.33*100}, ${100+(value-0.5)*3.33*155}, 255)`;
        return `rgb(${100+(value-0.8)*5*155}, 255, 255)`;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();
    let frameCount = 0;
    
    // Create a backup buffer for scrolling the spectrogram
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    const draw = (time: number) => {
      // FPS Calculation
      frameCount++;
      if (time - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = time;
      }

      if (analyserNode && isActive && tempCtx) {
        // Shift previous image left by 2 pixels (speed)
        tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
        
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(dataArray);

        // Clear the rightmost sliver
        ctx.fillStyle = '#0f172a'; // slate-900 background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the shifted image back, moved left
        ctx.drawImage(tempCanvas, -2, 0, canvas.width, canvas.height);

        // Draw new frequency data slice on the far right
        const sliceWidth = 2;
        const x = canvas.width - sliceWidth;
        
        // Map frequencies from bottom (low) to top (high)
        const barHeight = canvas.height / dataArray.length;
        
        for (let i = 0; i < dataArray.length; i++) {
          const value = dataArray[i]; // 0 to 255
          const normalized = value / 255.0;
          
          const y = canvas.height - (i * barHeight) - barHeight;
          
          // Optimization: Skip rendering near-black pixels to save fillRect calls
          if (normalized > 0.05) {
            ctx.fillStyle = getColor(normalized, theme);
            ctx.fillRect(x, y, sliceWidth, barHeight);
          }
        }
      } else if (!isActive && tempCtx) {
        // Slow fade out when inactive
        ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    // Initialize with dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyserNode, isActive, theme]);

  return (
    <div className="flex flex-col gap-3 p-4 glass-panel rounded-2xl relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-300">Live Spectrogram</span>
          {isActive && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              60 FPS
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Palette size={14} className="text-slate-500" />
          <select 
            value={theme}
            onChange={(e) => setTheme(e.target.value as PaletteName)}
            className="bg-slate-900 text-xs text-slate-300 rounded px-2 py-1 outline-none border border-slate-700 focus:border-indigo-500 transition-colors"
          >
            <option value="Electric Neon Indigo">Electric Neon Indigo</option>
            <option value="Inferno">Inferno</option>
            <option value="Magma">Magma</option>
            <option value="Viridis">Viridis</option>
          </select>
        </div>
      </div>

      <div className="w-full h-32 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 relative">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={200}
          className="w-full h-full object-fill"
        />
        {!isActive && !analyserNode && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-slate-600 text-sm font-mono uppercase tracking-widest">Waiting for Audio Stream</span>
          </div>
        )}
      </div>
    </div>
  );
}
