"use client";

import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { X } from 'lucide-react';
import { shouldDismissBottomSheet } from '@/lib/mobileUtils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxHeight?: string; // e.g. '85vh'
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = '85vh'
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Touch Drag-to-Dismiss handlers
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startY.current = clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const delta = clientY - startY.current;
    if (delta > 0) {
      setDragY(delta);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (shouldDismissBottomSheet(dragY, 80)) {
      onClose();
    }
    setDragY(0);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bottom-sheet-title"
      className="fixed inset-0 z-[999] flex items-end justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight,
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s ease-out'
        }}
        className="w-full max-w-2xl bg-slate-900 border-t border-x border-slate-800 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in slide-in-from-bottom duration-300"
      >
        {/* Touch Drag Handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          className="w-full pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:bg-slate-800/40 transition-colors select-none"
        >
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 id="bottom-sheet-title" className="text-base font-semibold text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close bottom sheet"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors focus-ring"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto overscroll-contain flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
