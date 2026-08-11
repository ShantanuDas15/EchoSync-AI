import React from 'react';
import { Activity, Clock } from 'lucide-react';

interface MetricBadgeProps {
  label: string;
  value: string | number;
  unit?: string;
  type?: 'rtf' | 'ttfb' | 'default';
}

export const MetricBadge: React.FC<MetricBadgeProps> = ({
  label,
  value,
  unit,
  type = 'default',
}) => {
  const isRTF = type === 'rtf';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs">
      {isRTF ? (
        <Activity className="w-3.5 h-3.5 text-indigo-400" />
      ) : (
        <Clock className="w-3.5 h-3.5 text-violet-400" />
      )}
      <span className="text-slate-400">{label}:</span>
      <span className="font-mono font-medium text-slate-200">
        {value}{unit ? ` ${unit}` : ''}
      </span>
    </div>
  );
};
