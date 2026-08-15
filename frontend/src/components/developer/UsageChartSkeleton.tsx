import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export function UsageChartSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading telemetry metrics..."
      className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-6"
    >
      <div className="flex justify-between items-center">
        <div className="space-y-1.5">
          <Skeleton className="w-36 h-5" />
          <Skeleton className="w-56 h-3" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-16 h-8 rounded-lg" />
          <Skeleton className="w-16 h-8 rounded-lg" />
        </div>
      </div>

      <div className="h-64 flex items-end justify-between gap-2 pt-8">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <Skeleton
              className="w-full rounded-t-md"
              style={{ height: `${Math.max(20, (i * 17) % 85 + 15)}%` }}
            />
            <Skeleton className="w-6 h-3 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
