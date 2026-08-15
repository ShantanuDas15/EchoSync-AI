"use client";

import React, { useRef, useState, ReactNode } from 'react';
import { calculateTiltAngles, TiltResult } from '@/lib/microInteractions';
import { useTheme } from '@/lib/themeContext';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  maxAngle?: number;
  enableGlare?: boolean;
  className?: string;
}

export function TiltCard({
  children,
  maxAngle = 8,
  enableGlare = true,
  className = '',
  ...props
}: TiltCardProps) {
  const { reducedMotion } = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<TiltResult>({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const result = calculateTiltAngles(mouseX, mouseY, rect.width, rect.height, maxAngle);
    setTilt(result);
  };

  const handleMouseEnter = () => {
    if (!reducedMotion) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  const transformStyle = isHovered && !reducedMotion
    ? `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.02, 1.02, 1.02)`
    : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out'
      }}
      className={`relative transform-gpu will-change-transform ${className}`}
      {...props}
    >
      {children}

      {/* Subtle Dynamic Glare Layer */}
      {enableGlare && isHovered && !reducedMotion && (
        <div
          aria-hidden="true"
          style={{
            background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.08) 0%, transparent 65%)`,
            pointerEvents: 'none'
          }}
          className="absolute inset-0 rounded-2xl transition-opacity duration-300 z-20"
        />
      )}
    </div>
  );
}
