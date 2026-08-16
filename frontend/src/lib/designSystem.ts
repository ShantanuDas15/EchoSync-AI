/**
 * EchoSync AI Design System & Typography Engine
 * Milestone 4.1: Curated HSL Color Tokens, WCAG Verification & Typographic Scales
 */

export interface HslColor {
  h: number;
  s: number;
  l: number;
  a?: number;
}

export interface ThemeTokens {
  bgRoot: string;
  bgPanel: string;
  bgElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderSubtle: string;
  borderElevated: string;
  brandPrimary: string;
  brandHover: string;
  brandAccent: string;
  statusOnline: string;
  statusWarning: string;
  statusError: string;
}

export const HSL_THEMES: Record<'dark' | 'light' | 'high-contrast', ThemeTokens> = {
  dark: {
    // Deep Charcoal / Neutral Obsidian base - eliminates cliché purple-on-dark
    bgRoot: 'hsl(220, 18%, 6%)',
    bgPanel: 'hsla(220, 16%, 10%, 0.85)',
    bgElevated: 'hsla(220, 16%, 15%, 0.9)',
    textPrimary: 'hsl(210, 24%, 98%)',
    textSecondary: 'hsl(215, 14%, 68%)',
    textMuted: 'hsl(215, 12%, 46%)',
    borderSubtle: 'hsla(215, 16%, 20%, 0.65)',
    borderElevated: 'hsla(215, 16%, 28%, 0.8)',
    brandPrimary: 'hsl(201, 96%, 42%)', // Refined Cerulean Sky
    brandHover: 'hsl(201, 96%, 48%)',
    brandAccent: 'hsl(192, 91%, 46%)', // Arctic Cyan
    statusOnline: 'hsl(158, 64%, 48%)',
    statusWarning: 'hsl(38, 92%, 50%)',
    statusError: 'hsl(0, 72%, 51%)',
  },
  light: {
    bgRoot: 'hsl(210, 20%, 98%)',
    bgPanel: 'hsla(0, 0%, 100%, 0.92)',
    bgElevated: 'hsla(210, 20%, 94%, 0.95)',
    textPrimary: 'hsl(222, 24%, 10%)',
    textSecondary: 'hsl(215, 16%, 38%)',
    textMuted: 'hsl(215, 12%, 56%)',
    borderSubtle: 'hsla(215, 20%, 84%, 0.8)',
    borderElevated: 'hsla(215, 20%, 74%, 0.9)',
    brandPrimary: 'hsl(201, 96%, 38%)',
    brandHover: 'hsl(201, 96%, 44%)',
    brandAccent: 'hsl(192, 91%, 38%)',
    statusOnline: 'hsl(158, 64%, 40%)',
    statusWarning: 'hsl(38, 92%, 44%)',
    statusError: 'hsl(0, 72%, 48%)',
  },
  'high-contrast': {
    bgRoot: 'hsl(0, 0%, 0%)',
    bgPanel: 'hsl(0, 0%, 5%)',
    bgElevated: 'hsl(0, 0%, 10%)',
    textPrimary: 'hsl(0, 0%, 100%)',
    textSecondary: 'hsl(0, 0%, 92%)',
    textMuted: 'hsl(0, 0%, 75%)',
    borderSubtle: 'hsl(0, 0%, 100%)',
    borderElevated: 'hsl(0, 0%, 100%)',
    brandPrimary: 'hsl(199, 100%, 65%)',
    brandHover: 'hsl(199, 100%, 75%)',
    brandAccent: 'hsl(187, 100%, 65%)',
    statusOnline: 'hsl(150, 100%, 60%)',
    statusWarning: 'hsl(45, 100%, 60%)',
    statusError: 'hsl(0, 100%, 65%)',
  }
};

export interface TypographyToken {
  fontSize: string;
  lineHeight: string;
  letterSpacing: string; // in em or px
  fontWeight: string;
  fontFamily?: string;
  textTransform?: string;
}

export const TYPOGRAPHY_SYSTEM: Record<string, TypographyToken> = {
  display: {
    fontSize: '2.25rem', // 36px
    lineHeight: '1.15',
    letterSpacing: '-0.035em', // Strict negative tracking for display headers
    fontWeight: '700',
  },
  headlineXl: {
    fontSize: '1.875rem', // 30px
    lineHeight: '1.2',
    letterSpacing: '-0.025em',
    fontWeight: '700',
  },
  headlineLg: {
    fontSize: '1.5rem', // 24px
    lineHeight: '1.25',
    letterSpacing: '-0.02em',
    fontWeight: '600',
  },
  headlineMd: {
    fontSize: '1.25rem', // 20px
    lineHeight: '1.3',
    letterSpacing: '-0.015em',
    fontWeight: '600',
  },
  headlineSm: {
    fontSize: '1rem', // 16px
    lineHeight: '1.4',
    letterSpacing: '-0.01em',
    fontWeight: '600',
  },
  bodyBase: {
    fontSize: '0.875rem', // 14px
    lineHeight: '1.5',
    letterSpacing: '-0.005em',
    fontWeight: '400',
  },
  bodySm: {
    fontSize: '0.75rem', // 12px
    lineHeight: '1.5',
    letterSpacing: '0em',
    fontWeight: '400',
  },
  monoTelemetry: {
    fontSize: '0.6875rem', // 11px
    lineHeight: '1.4',
    letterSpacing: '0.06em', // Positive tracking for micro uppercase telemetry
    fontWeight: '600',
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
  },
  monoCode: {
    fontSize: '0.75rem', // 12px
    lineHeight: '1.6',
    letterSpacing: '-0.01em',
    fontWeight: '400',
    fontFamily: 'var(--font-mono)',
  },
};

/**
 * Parses HSL or HSLA CSS strings into numerical components
 */
export function parseHslString(hslStr: string): HslColor {
  const match = hslStr.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)/);
  if (!match) {
    throw new Error(`Invalid HSL format: ${hslStr}`);
  }
  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
    a: match[4] !== undefined ? parseFloat(match[4]) : 1.0,
  };
}

/**
 * Converts HSL components to RGB tuple [0-255]
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sat = s / 100;
  const lum = l / 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lum, 1 - lum);
  const f = (n: number) =>
    lum - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  return [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255),
  ];
}

/**
 * Converts HSL string to Hex code
 */
export function hslStringToHex(hslStr: string): string {
  const { h, s, l } = parseHslString(hslStr);
  const [r, g, b] = hslToRgb(h, s, l);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculates WCAG 2.1 Contrast Ratio from HSL strings
 */
export function calculateHslContrastRatio(foregroundHsl: string, backgroundHsl: string): number {
  const fgHex = hslStringToHex(foregroundHsl);
  const bgHex = hslStringToHex(backgroundHsl);
  
  const [r1, g1, b1] = [parseInt(fgHex.slice(1, 3), 16), parseInt(fgHex.slice(3, 5), 16), parseInt(fgHex.slice(5, 7), 16)];
  const [r2, g2, b2] = [parseInt(bgHex.slice(1, 3), 16), parseInt(bgHex.slice(3, 5), 16), parseInt(bgHex.slice(5, 7), 16)];

  const lum = (r: number, g: number, b: number) => {
    const [sR, sG, sB] = [r, g, b].map(v => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
  };

  const l1 = lum(r1, g1, b1);
  const l2 = lum(r2, g2, b2);

  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);

  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

/**
 * Validates that large display/headline typography enforces negative tracking
 * and micro/telemetry uppercase typography enforces positive tracking.
 */
export function validateTypographyScale(token: TypographyToken, category: 'display' | 'headline' | 'body' | 'telemetry'): boolean {
  const trackingNum = parseFloat(token.letterSpacing.replace('em', ''));
  if (category === 'display' || category === 'headline') {
    // Large typefaces must be tracked tightly (negative letter spacing) to prevent huge untracked text
    return trackingNum < 0;
  }
  if (category === 'telemetry') {
    // Micro uppercase typography must have wide tracking
    return trackingNum > 0;
  }
  return true;
}
