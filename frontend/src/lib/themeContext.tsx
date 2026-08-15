"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light' | 'high-contrast' | 'system';
export type FontSizeScale = 'default' | 'large';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'dark' | 'light' | 'high-contrast';
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: FontSizeScale;
  isSettingsOpen: boolean;
  setTheme: (mode: ThemeMode) => void;
  setReducedMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  setFontSize: (size: FontSizeScale) => void;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSettings: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Calculates relative luminance for RGB according to WCAG 2.1 specifications.
 */
export function calculateRelativeLuminance(r: number, g: number, b: number): number {
  const [sR, sG, sB] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

/**
 * Converts Hex string to RGB tuple.
 */
export function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '').trim();
  const fullHex = cleaned.length === 3
    ? cleaned.split('').map((c) => c + c).join('')
    : cleaned;

  const num = parseInt(fullHex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Calculates contrast ratio between two hex color codes according to WCAG 2.1.
 * Returns ratio from 1.0 to 21.0.
 */
export function calculateContrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);

  const lum1 = calculateRelativeLuminance(r1, g1, b1);
  const lum2 = calculateRelativeLuminance(r2, g2, b2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  const ratio = (brightest + 0.05) / (darkest + 0.05);
  return Number(ratio.toFixed(2));
}

/**
 * Checks WCAG compliance level (AA requires >= 4.5:1, AAA requires >= 7.0:1 for normal text).
 */
export function isWcagCompliant(ratio: number, level: 'AA' | 'AAA' = 'AA'): boolean {
  const threshold = level === 'AAA' ? 7.0 : 4.5;
  return ratio >= threshold;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light' | 'high-contrast'>('dark');
  const [reducedMotion, setReducedMotionState] = useState<boolean>(false);
  const [highContrast, setHighContrastState] = useState<boolean>(false);
  const [fontSize, setFontSizeState] = useState<FontSizeScale>('default');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Initialize from LocalStorage and System Preferences
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('echosync_theme') as ThemeMode | null;
      const savedMotion = localStorage.getItem('echosync_reduced_motion');
      const savedContrast = localStorage.getItem('echosync_high_contrast');
      const savedFontSize = localStorage.getItem('echosync_font_size') as FontSizeScale | null;

      if (savedTheme) setThemeState(savedTheme);
      if (savedMotion !== null) setReducedMotionState(savedMotion === 'true');
      if (savedContrast !== null) setHighContrastState(savedContrast === 'true');
      if (savedFontSize) setFontSizeState(savedFontSize);

      // System media queries
      if (!savedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setReducedMotionState(true);
      }
      if (!savedContrast && window.matchMedia('(prefers-contrast: more)').matches) {
        setHighContrastState(true);
      }
    } catch {
      // LocalStorage unavailable
    }
  }, []);

  // Resolve active theme based on preferences
  useEffect(() => {
    let active: 'dark' | 'light' | 'high-contrast' = 'dark';

    if (highContrast) {
      active = 'high-contrast';
    } else if (theme === 'high-contrast') {
      active = 'high-contrast';
    } else if (theme === 'light') {
      active = 'light';
    } else if (theme === 'system') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      active = isSystemDark ? 'dark' : 'light';
    } else {
      active = 'dark';
    }

    setResolvedTheme(active);

    // Apply attributes to DOM
    const root = document.documentElement;
    root.setAttribute('data-theme', active);
    root.setAttribute('data-reduced-motion', String(reducedMotion));
    root.setAttribute('data-contrast', String(highContrast));
    root.setAttribute('data-font-size', fontSize);
  }, [theme, highContrast, reducedMotion, fontSize]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem('echosync_theme', mode);
    } catch {}
  };

  const setReducedMotion = (enabled: boolean) => {
    setReducedMotionState(enabled);
    try {
      localStorage.setItem('echosync_reduced_motion', String(enabled));
    } catch {}
  };

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
    try {
      localStorage.setItem('echosync_high_contrast', String(enabled));
    } catch {}
  };

  const setFontSize = (size: FontSizeScale) => {
    setFontSizeState(size);
    try {
      localStorage.setItem('echosync_font_size', size);
    } catch {}
  };

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);
  const toggleSettings = () => setIsSettingsOpen((prev) => !prev);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        reducedMotion,
        highContrast,
        fontSize,
        isSettingsOpen,
        setTheme,
        setReducedMotion,
        setHighContrast,
        setFontSize,
        openSettings,
        closeSettings,
        toggleSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
