import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export function TimelineBlockSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading dialogue block..."
      className="flex gap-3 p-4 bg-slate-900/40 border border-slate-800 rounded-xl"
    >
      <div className="flex flex-col items-center justify-center">
        <Skeleton className="w-4 h-8 rounded-sm" />
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <Skeleton className="w-36 h-7 rounded-md" />
          <Skeleton variant="circular" className="w-5 h-5" />
        </div>

        <Skeleton className="w-full h-12 rounded-lg" />

        <div className="flex justify-end mt-1">
          <Skeleton className="w-24 h-7 rounded-md" />
        </div>
      </div>
    </div>
  );
}
