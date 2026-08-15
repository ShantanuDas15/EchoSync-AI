import React from 'react';
import { Skeleton } from './Skeleton';

interface VoiceCardSkeletonProps {
  viewMode?: 'grid' | 'list';
}

export function VoiceCardSkeleton({ viewMode = 'grid' }: VoiceCardSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div 
        aria-busy="true"
        aria-label="Loading speaker profile..."
        className="flex items-center justify-between p-4 glass-panel rounded-xl border border-slate-800"
      >
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" className="w-12 h-12 shrink-0" />
          <div className="space-y-2">
            <Skeleton className="w-36 h-4" />
            <Skeleton className="w-48 h-3" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="w-24 h-6 rounded-full" />
          <Skeleton variant="circular" className="w-8 h-8" />
        </div>
      </div>
    );
  }

  return (
    <div 
      aria-busy="true"
      aria-label="Loading speaker profile..."
      className="flex flex-col p-5 glass-panel rounded-2xl border border-slate-800 relative overflow-hidden"
    >
      <div className="flex justify-between items-center w-full mb-4">
        <Skeleton className="w-16 h-4 rounded-full" />
        <Skeleton variant="circular" className="w-6 h-6" />
      </div>

      <div className="flex flex-col items-center mb-4 mt-2">
        <Skeleton variant="circular" className="w-20 h-20 shadow-xl" />
        <Skeleton className="w-32 h-5 mt-4" />
        <Skeleton className="w-20 h-3 mt-2" />
      </div>

      {/* Waveform placeholder */}
      <div className="w-full h-8 flex items-center justify-center gap-1 opacity-30 mt-2">
        {Array.from({ length: 16 }).map((_, i) => (
          <Skeleton key={i} className="w-1.5 h-6 rounded-full" />
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-4">
        <Skeleton className="w-12 h-4 rounded-md" />
        <Skeleton className="w-14 h-4 rounded-md" />
        <Skeleton className="w-16 h-4 rounded-md" />
      </div>
    </div>
  );
}
