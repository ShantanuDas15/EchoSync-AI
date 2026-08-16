"use client";

import React from 'react';
import { DEFAULT_NOISE_CONFIG, NoiseTextureConfig } from '@/lib/surfaceDepth';

interface TextureOverlayProps {
  opacity?: number;
  className?: string;
  config?: Partial<NoiseTextureConfig>;
}

export function TextureOverlay({
  opacity = 0.03,
  className = '',
  config,
}: TextureOverlayProps) {
  const mergedConfig = { ...DEFAULT_NOISE_CONFIG, ...config, opacity };

  return (
    <div
      aria-hidden="true"
      data-testid="texture-overlay"
      className={`fixed inset-0 pointer-events-none z-0 select-none overflow-hidden ${className}`}
      style={{
        opacity: mergedConfig.opacity,
        mixBlendMode: mergedConfig.blendMode as any,
      }}
    >
      <svg
        className="w-full h-full object-cover"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <filter id="echosync-noise-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={mergedConfig.baseFrequency}
            numOctaves={mergedConfig.numOctaves}
            stitchTiles={mergedConfig.stitchTiles}
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect
          width="100%"
          height="100%"
          filter="url(#echosync-noise-filter)"
          fill="#808080"
        />
      </svg>
    </div>
  );
}
