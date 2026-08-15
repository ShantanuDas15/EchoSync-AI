"use client";

import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Loader2, X, Info } from 'lucide-react';
import { ToastItem, calculateRemainingDuration } from '@/lib/microInteractions';

export type ToastType = 'Success' | 'Processing' | 'Error' | 'Warning' | 'Info';

interface ToastNotificationProps {
  message: string;
  type: ToastType;
  duration?: number; // ms
  onDismiss: () => void;
}

export function ToastItemCard({
  item,
  onDismiss
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const startTime = useRef(Date.now());
  const pausedTime = useRef(0);
  const pauseStart = useRef(0);

  // Auto-dismiss countdown & Progress calculation
  useEffect(() => {
    if (item.type === 'Processing' || !item.duration) return;

    const duration = item.duration;
    const interval = setInterval(() => {
      const now = Date.now();
      if (isHovered) {
        if (pauseStart.current === 0) pauseStart.current = now;
        return;
      } else if (pauseStart.current > 0) {
        pausedTime.current += now - pauseStart.current;
        pauseStart.current = 0;
      }

      const { remaining, progressPercent } = calculateRemainingDuration(
        startTime.current,
        duration,
        now,
        isHovered,
        pausedTime.current
      );

      setProgress(progressPercent);

      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss(item.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [item, isHovered, onDismiss]);

  // Swipe / Drag to dismiss gesture
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    dragStartX.current = clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const delta = clientX - dragStartX.current;
    if (delta > 0) {
      setDragOffset(delta);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 75) {
      // Swiped past threshold -> dismiss
      onDismiss(item.id);
    } else {
      setDragOffset(0);
    }
  };

  const getStyles = () => {
    switch (item.type) {
      case 'Success': return 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300 shadow-emerald-950/40';
      case 'Error': return 'bg-rose-950/90 border-rose-500/50 text-rose-300 shadow-rose-950/40';
      case 'Warning': return 'bg-amber-950/90 border-amber-500/50 text-amber-300 shadow-amber-950/40';
      case 'Processing': return 'bg-indigo-950/90 border-indigo-500/50 text-indigo-300 shadow-indigo-950/40';
      case 'Info': return 'bg-slate-900/90 border-slate-700 text-slate-200 shadow-slate-950/40';
    }
  };

  const getIcon = () => {
    switch (item.type) {
      case 'Success': return <CheckCircle size={18} className="text-emerald-400 shrink-0" />;
      case 'Error': return <AlertCircle size={18} className="text-rose-400 shrink-0" />;
      case 'Warning': return <AlertTriangle size={18} className="text-amber-400 shrink-0" />;
      case 'Processing': return <Loader2 size={18} className="animate-spin text-indigo-400 shrink-0" />;
      case 'Info': return <Info size={18} className="text-slate-400 shrink-0" />;
    }
  };

  const getProgressBarColor = () => {
    switch (item.type) {
      case 'Success': return 'bg-emerald-500';
      case 'Error': return 'bg-rose-500';
      case 'Warning': return 'bg-amber-500';
      case 'Processing': return 'bg-indigo-500';
      case 'Info': return 'bg-slate-500';
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      style={{
        transform: `translateX(${dragOffset}px)`,
        opacity: Math.max(0, 1 - dragOffset / 150),
        transition: isDragging ? 'none' : 'all 0.25s ease-out'
      }}
      className={`relative overflow-hidden flex flex-col p-4 rounded-xl border backdrop-blur-xl shadow-xl select-none cursor-grab active:cursor-grabbing max-w-sm w-full ${getStyles()}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {getIcon()}
          <span className="text-xs sm:text-sm font-medium tracking-tight leading-snug">
            {item.message}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(item.id);
          }}
          aria-label="Dismiss toast"
          className="opacity-50 hover:opacity-100 p-1 rounded-md hover:bg-slate-800/40 transition-colors focus-ring"
        >
          <X size={15} />
        </button>
      </div>

      {/* Progress Bar for finite duration toasts */}
      {item.type !== 'Processing' && item.duration && item.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div
            style={{ width: `${100 - progress}%` }}
            className={`h-full transition-all duration-75 ${getProgressBarColor()}`}
          />
        </div>
      )}
    </div>
  );
}

export function ToastStack({
  toasts,
  onDismiss
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-auto"
    >
      {toasts.map((item) => (
        <ToastItemCard key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/**
 * Backwards-compatible standalone component
 */
export function ToastNotification({
  message,
  type,
  duration = 3000,
  onDismiss
}: ToastNotificationProps) {
  const item: ToastItem = {
    id: 'single-toast',
    message,
    type,
    duration,
    createdAt: Date.now()
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full">
      <ToastItemCard item={item} onDismiss={onDismiss} />
    </div>
  );
}
