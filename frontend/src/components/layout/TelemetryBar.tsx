"use client";

import React, { useState, useEffect } from 'react';
import { MetricBadge } from '@/components/ui/MetricBadge';
import { ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { createTelemetryState, toggleTelemetryState } from '@/lib/layoutMinimalism';

interface TelemetryBarProps {
  currentRTF: number;
  currentTTFB: number;
  rtfHistory: number[];
  ttfbHistory: number[];
  isStreaming?: boolean;
}

export function TelemetryBar({
  currentRTF,
  currentTTFB,
  rtfHistory,
  ttfbHistory,
  isStreaming = false,
}: TelemetryBarProps) {
  const [state, setState] = useState(() => createTelemetryState(false));

  const handleToggle = () => {
    setState(prev => toggleTelemetryState(prev));
  };

  return (
    <div data-tour="telemetry-bar" className="w-full bg-surface-panel/80 border-b border-border-subtle backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
        
        {/* Compact Status Indicator */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-text-secondary">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isStreaming ? 'bg-sky-400' : 'bg-emerald-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isStreaming ? 'bg-sky-500' : 'bg-emerald-500'}`} />
            </span>
            <span className="font-medium text-text-primary text-[11px]">
              {isStreaming ? 'Synthesizing Audio Stream' : 'Neural Core Ready'}
            </span>
          </div>

          <span className="hidden sm:inline text-text-muted">•</span>

          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-text-muted">
            <span>RTF: <strong className="text-text-primary">{currentRTF.toFixed(2)}</strong></span>
            <span>TTFB: <strong className="text-text-primary">{currentTTFB}ms</strong></span>
          </div>
        </div>

        {/* Progressive Disclosure Toggle */}
        <button
          onClick={handleToggle}
          aria-expanded={state.isExpanded}
          aria-label={state.isExpanded ? "Collapse telemetry details" : "Expand telemetry details"}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-text-secondary hover:text-text-primary bg-surface-elevated/60 hover:bg-surface-elevated border border-border-subtle rounded-lg transition-all focus-ring"
        >
          <Activity size={12} className="text-sky-400" />
          <span>{state.isExpanded ? "Hide Telemetry" : "Show Analytics"}</span>
          {state.isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Expanded Metrics Section */}
      {state.isExpanded && (
        <div className="border-t border-border-subtle/60 bg-surface-elevated/40 px-4 sm:px-6 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-end gap-3">
            <MetricBadge label="Real-Time Factor (RTF)" value={currentRTF.toFixed(2)} type="rtf" history={rtfHistory} />
            <MetricBadge label="Time to First Byte (TTFB)" value={currentTTFB} unit="ms" type="ttfb" history={ttfbHistory} />
          </div>
        </div>
      )}
    </div>
  );
}
