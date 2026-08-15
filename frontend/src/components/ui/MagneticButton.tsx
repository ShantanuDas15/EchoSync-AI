"use client";

import React, { useRef, useState, ReactNode } from 'react';
import { calculateMagneticOffset, MagneticResult } from '@/lib/microInteractions';
import { useTheme } from '@/lib/themeContext';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  maxOffset?: number;
  className?: string;
}

export function MagneticButton({
  children,
  maxOffset = 6,
  className = '',
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
    ? `translate3d(${offset.offsetX}px, ${offset.offsetY}px, 0)`
    : 'translate3d(0, 0, 0)';

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out'
      }}
      className={`will-change-transform ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
