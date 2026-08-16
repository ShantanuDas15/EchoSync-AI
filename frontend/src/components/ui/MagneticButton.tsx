"use client";

import React, { useRef, useState, ReactNode } from 'react';
import { calculateMagneticOffset, MagneticResult } from '@/lib/microInteractions';
import { useTheme } from '@/lib/themeContext';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  maxOffset?: number;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function MagneticButton({
  children,
  maxOffset = 5,
  className = '',
  variant = 'primary',
  ...props
}: MagneticButtonProps) {
  const { reducedMotion } = useTheme();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState<MagneticResult>({ offsetX: 0, offsetY: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reducedMotion || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const result = calculateMagneticOffset(mouseX, mouseY, rect.width, rect.height, maxOffset);
    setOffset(result);
  };

  const handleMouseEnter = () => {
    if (!reducedMotion) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setOffset({ offsetX: 0, offsetY: 0 });
  };

  const transformStyle = isHovered && !reducedMotion
    ? `translate3d(${offset.offsetX}px, ${offset.offsetY}px, 0) scale(1.02)`
    : 'translate3d(0, 0, 0) scale(1)';

  const variantStyles = {
    primary: 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 active:scale-95',
    secondary: 'bg-surface-elevated hover:bg-surface-panel text-text-primary border border-border-subtle hover:border-border-elevated active:scale-95',
    ghost: 'bg-transparent hover:bg-surface-elevated text-text-secondary hover:text-text-primary active:scale-95',
  }[variant];

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transition: isHovered ? 'transform 0.12s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.2s ease' : 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.2s ease'
      }}
      className={`will-change-transform focus-ring rounded-xl font-medium transition-colors ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
