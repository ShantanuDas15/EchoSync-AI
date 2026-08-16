"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Info } from 'lucide-react';

interface ContextualHintProps {
  title: string;
  description: string;
  proTip?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  badge?: string;
  id?: string;
}

export function ContextualHint({
  title,
  description,
  proTip,
  placement = 'top',
  badge = 'Feature Tip',
  id
}: ContextualHintProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2.5',
  }[placement];

  return (
    <div ref={containerRef} className="relative inline-flex items-center" id={id}>
      {/* Pulsing Beacon Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
        aria-label={`Show tip: ${title}`}
        className="relative group p-1 rounded-full text-text-muted hover:text-sky-300 transition-colors focus-ring cursor-pointer"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500 border border-sky-300/40" />
        </span>
      </button>

      {/* Popover Tip Card */}
      {isOpen && (
        <div
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-50 w-72 sm:w-80 p-4 bg-surface-panel border border-border-elevated rounded-2xl shadow-2xl backdrop-blur-2xl text-text-primary transition-all duration-200 animate-in fade-in zoom-in-95 ${placementClasses}`}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle">
            <div className="flex items-center gap-1.5">
              <Info size={13} className="text-sky-400" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-sky-300 font-semibold">
                {badge}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              aria-label="Close tip"
              className="text-text-muted hover:text-text-primary p-0.5 rounded transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <h4 className="text-xs font-semibold text-text-primary mb-1">
            {title}
          </h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            {description}
          </p>

          {proTip && (
            <div className="mt-2.5 pt-2 border-t border-border-subtle flex items-start gap-1.5 text-[11px] text-sky-300 bg-sky-500/10 p-2.5 rounded-xl border border-sky-500/20">
              <Sparkles size={13} className="shrink-0 text-sky-400 mt-0.5" />
              <span className="leading-snug">{proTip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

