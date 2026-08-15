import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export function ProjectCardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading project..."
      className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between h-[210px]"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="w-20 h-5 rounded-full" />
          <Skeleton variant="circular" className="w-6 h-6" />
        </div>
        <Skeleton className="w-3/4 h-5" />
        <Skeleton className="w-full h-8 rounded-lg" />
      </div>

      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Skeleton variant="circular" className="w-6 h-6" />
          <Skeleton variant="circular" className="w-6 h-6" />
        </div>
        <Skeleton className="w-20 h-4 rounded-md" />
      </div>
    </div>
  );
}
