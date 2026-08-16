import React, { useMemo } from 'react';
import { Activity, Clock } from 'lucide-react';

interface MetricBadgeProps {
  label: string;
  value: string | number;
  unit?: string;
  type?: 'rtf' | 'ttfb' | 'default';
  history?: number[]; // Array of past values for sparkline
}

export const MetricBadge: React.FC<MetricBadgeProps> = ({
  label,
  value,
  unit,
  type = 'default',
  history = []
}) => {
  const isRTF = type === 'rtf';
  const Icon = isRTF ? Activity : Clock;
  const colorClass = isRTF ? 'text-sky-400' : 'text-cyan-400';
  const strokeColor = isRTF ? '#38bdf8' : '#22d3ee';

  // Generate simple SVG sparkline path
  const sparklinePath = useMemo(() => {
    if (history.length < 2) return null;
    
    const max = Math.max(...history, typeof value === 'number' ? value : 0);
    const min = Math.min(...history, typeof value === 'number' ? value : 0);
    const range = max - min || 1;
    
    const width = 40;
    const height = 16;
    
    const points = history.map((val, i) => {
      const x = (i / (history.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');

    return points;
  }, [history, value]);

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-surface-panel border border-border-subtle rounded-xl text-xs shadow-inner">
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
        <span className="text-text-secondary">{label}:</span>
        <span className="font-mono font-medium text-text-primary">
          {value}{unit ? ` ${unit}` : ''}
        </span>
      </div>

      {sparklinePath && (
        <div className="w-10 h-4 border-l border-border-subtle pl-2 ml-1 flex items-center">
          <svg width="40" height="16" viewBox="0 0 40 16" className="overflow-visible">
            <path 
              d={sparklinePath} 
              fill="none" 
              stroke={strokeColor} 
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-70"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
