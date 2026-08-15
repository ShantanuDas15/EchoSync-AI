"use client";

import React, { ReactNode } from 'react';
import { useTheme } from '@/lib/themeContext';

export default function Template({ children }: { children: ReactNode }) {
  const { reducedMotion } = useTheme();

  return (
    <div
      className={`flex-1 flex flex-col w-full ${
        reducedMotion
          ? ''
          : 'animate-in fade-in slide-in-from-bottom-1.5 duration-300 ease-out'
      }`}
    >
      {children}
    </div>
  );
}
