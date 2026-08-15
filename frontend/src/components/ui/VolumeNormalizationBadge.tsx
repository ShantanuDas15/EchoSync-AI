"use client";

import React, { useMemo } from 'react';
import { evaluateClippingRisk } from '@/lib/audioPreviewUtils';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface VolumeNormalizationBadgeProps {
  dVectorNorm: number;
  targetGainDb?: number;
  showDetails?: boolean;
}

export function VolumeNormalizationBadge({
  dVectorNorm,
  targetGainDb = 0,
  showDetails = false
}: VolumeNormalizationBadgeProps) {
  const report = useMemo(() => evaluateClippingRisk(dVectorNorm, targetGainDb), [dVectorNorm, targetGainDb]);

  const config = {
    safe: {
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      textColor: 'text-emerald-400',
      icon: <ShieldCheck size={11} className="text-emerald-400 shrink-0" />,
      label: 'Safe Headroom'
    },
    warning: {
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      textColor: 'text-amber-400',
      icon: <AlertTriangle size={11} className="text-amber-400 shrink-0" />,
      label: 'Near Peak'
    },
    critical: {
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      textColor: 'text-rose-400',
      icon: <AlertOctagon size={11} className="text-rose-400 shrink-0" />,
      label: 'Clipping Risk'
    }
  }[report.risk];

  return (
    <div
      title={report.message}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono select-none ${config.bgColor} ${config.borderColor} ${config.textColor}`}
    >
      {config.icon}
      <span>{report.estimatedDb > 0 ? `+${report.estimatedDb}` : `${report.estimatedDb}`} dBFS</span>
      {showDetails && <span className="opacity-80">({config.label})</span>}
    </div>
  );
}
