/**
 * EchoSync AI Surface Depth & Elevation Engine
 * Milestone 4.2: Organic Textures, Multi-Tier Shadow Depth & Monochromatic Focus
 */

export interface ElevationLevel {
  level: number;
  name: string;
  boxShadow: string;
  innerShadow: string;
  borderOpacity: number;
  backdropBlurPx: number;
}

export const SURFACE_ELEVATIONS: Record<'level0' | 'level1' | 'level2' | 'level3' | 'inset', ElevationLevel> = {
  level0: {
    level: 0,
    name: 'Root Canvas',
    boxShadow: 'none',
    innerShadow: 'none',
    borderOpacity: 0,
    backdropBlurPx: 0,
  },
  level1: {
    level: 1,
    name: 'Standard Glass Panel',
    boxShadow: '0 4px 20px -2px hsla(220, 25%, 3%, 0.5)',
    innerShadow: 'inset 0 1px 1px 0 hsla(0, 0%, 100%, 0.04), inset 0 -1px 1px 0 hsla(0, 0%, 0%, 0.35)',
    borderOpacity: 0.65,
    backdropBlurPx: 16,
  },
  level2: {
    level: 2,
    name: 'Elevated Surface Panel',
    boxShadow: '0 10px 30px -4px hsla(220, 25%, 2%, 0.7)',
    innerShadow: 'inset 0 1px 1px 0 hsla(0, 0%, 100%, 0.08), inset 0 -1px 2px 0 hsla(0, 0%, 0%, 0.45)',
    borderOpacity: 0.8,
    backdropBlurPx: 20,
  },
  level3: {
    level: 3,
    name: 'Modal & Floating Overlay',
    boxShadow: '0 25px 50px -12px hsla(220, 30%, 2%, 0.85), 0 0 0 1px hsla(215, 16%, 30%, 0.5)',
    innerShadow: 'inset 0 1px 2px 0 hsla(0, 0%, 100%, 0.1)',
    borderOpacity: 0.9,
    backdropBlurPx: 24,
  },
  inset: {
    level: -1,
    name: 'Sunken Recessed Inset',
    boxShadow: 'none',
    innerShadow: 'inset 0 2px 4px 0 hsla(0, 0%, 0%, 0.4), inset 0 1px 2px 0 hsla(0, 0%, 0%, 0.3)',
    borderOpacity: 0.5,
    backdropBlurPx: 8,
  }
};

export interface NoiseTextureConfig {
  baseFrequency: number;
  numOctaves: number;
  opacity: number;
  stitchTiles: 'stitch' | 'noStitch';
  blendMode: string;
}

export const DEFAULT_NOISE_CONFIG: NoiseTextureConfig = {
  baseFrequency: 0.75,
  numOctaves: 3,
  opacity: 0.028,
  stitchTiles: 'stitch',
  blendMode: 'overlay',
};

/**
 * Validates that noise configuration satisfies subtle organic depth without hindering readability
 */
export function validateNoiseConfig(config: NoiseTextureConfig): boolean {
  if (config.opacity <= 0 || config.opacity > 0.08) {
    // Opacity must be subtle (< 8%) to prevent visual grain clutter
    return false;
  }
  if (config.baseFrequency < 0.2 || config.baseFrequency > 1.5) {
    return false;
  }
  if (config.numOctaves < 1 || config.numOctaves > 5) {
    return false;
  }
  return true;
}

/**
 * Generates an SVG XML string for procedural noise filter
 */
export function generateNoiseSvgXml(config: NoiseTextureConfig = DEFAULT_NOISE_CONFIG): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="${config.baseFrequency}" numOctaves="${config.numOctaves}" stitchTiles="${config.stitchTiles}"/></filter><rect width="100%" height="100%" filter="url(#noiseFilter)" opacity="${config.opacity}"/></svg>`;
}

/**
 * Checks if a focus ring configuration uses monochromatic/neutral tones (white, neutral-*, slate-*, zinc-*)
 * rather than glowing colored outlines (e.g. indigo, purple, red, green, blue).
 */
export function isMonochromaticFocusRing(classNameOrToken: string): boolean {
  const coloredKeywords = [
    'ring-indigo', 'ring-purple', 'ring-violet', 'ring-pink',
    'ring-blue', 'ring-emerald', 'ring-green', 'ring-red', 'ring-amber', 'ring-orange'
  ];

  const hasColoredKeyword = coloredKeywords.some(kw => classNameOrToken.includes(kw));
  if (hasColoredKeyword) return false;

  const neutralKeywords = ['ring-white', 'ring-neutral', 'ring-zinc', 'ring-gray', 'ring-slate-100', 'ring-white/'];
  return neutralKeywords.some(kw => classNameOrToken.includes(kw));
}

/**
 * Validates that elevated panels have strictly higher luminance or depth definition than lower levels
 */
export function validateLuminanceProgression(levels: ElevationLevel[]): boolean {
  for (let i = 1; i < levels.length; i++) {
    if (levels[i].backdropBlurPx < levels[i - 1].backdropBlurPx) {
      return false;
    }
  }
  return true;
}
