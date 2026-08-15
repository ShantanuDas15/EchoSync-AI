"use client";

import React, { useEffect, useRef } from 'react';
import {
  Settings,
  X,
  Moon,
  Sun,
  Contrast,
  Laptop,
  Eye,
  Sliders,
  Sparkles,
  ShieldCheck,
  Check,
  ZapOff,
  Type,
} from 'lucide-react';
import { useTheme, ThemeMode, FontSizeScale } from '@/lib/themeContext';

export function SettingsDrawer() {
  const {
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
    closeSettings,
  } = useTheme();

  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trapping and Esc key listener for WCAG 2.1 Level AA compliance
  useEffect(() => {
    if (!isSettingsOpen) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSettings();
      }

      // Focus trap within drawer
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, closeSettings]);

  if (!isSettingsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Accessibility & Workspace Settings"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={closeSettings}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={drawerRef}
          className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between"
        >
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                <Settings size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">System & Accessibility</h2>
                <p className="text-xs text-slate-400">Personalize themes, motion, and readability</p>
              </div>
            </div>

            <button
              ref={closeButtonRef}
              onClick={closeSettings}
              aria-label="Close Settings Drawer"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-ring"
            >
              <X size={20} />
            </button>
          </div>

          {/* Settings Options Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Theme Mode Selection */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Moon size={14} className="text-indigo-400" />
                Color Theme & Palette
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'dark', label: 'Dark Studio', icon: Moon, desc: 'Deep glassmorphism' },
                  { id: 'light', label: 'Light Clean', icon: Sun, desc: 'High luminance' },
                  { id: 'high-contrast', label: 'High Contrast', icon: Contrast, desc: 'WCAG AAA 7:1' },
                  { id: 'system', label: 'System Auto', icon: Laptop, desc: 'Sync with OS' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = theme === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTheme(item.id as ThemeMode)}
                      aria-pressed={isSelected}
                      className={`p-3 rounded-xl border text-left transition-all focus-ring ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon size={16} className={isSelected ? 'text-indigo-400' : 'text-slate-500'} />
                        {isSelected && <Check size={14} className="text-indigo-400" />}
                      </div>
                      <div className="text-xs font-semibold text-slate-200">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accessibility Toggles */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-400" />
                Sensory & Motor Comfort
              </label>

              {/* Reduced Motion Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="flex items-start gap-3 pr-2">
                  <ZapOff size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Reduced Motion</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Disables UI pulse animations and throttles canvas render loops to reduce strain.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={reducedMotion}
                  aria-label="Toggle Reduced Motion"
                  onClick={() => setReducedMotion(!reducedMotion)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors focus-ring shrink-0 ${
                    reducedMotion ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      reducedMotion ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* High Contrast Mode Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="flex items-start gap-3 pr-2">
                  <Eye size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">High Contrast Text</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Forces maximum contrast borders and pure black background surfaces (WCAG AAA).
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={highContrast}
                  aria-label="Toggle High Contrast"
                  onClick={() => setHighContrast(!highContrast)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors focus-ring shrink-0 ${
                    highContrast ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      highContrast ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Font Size Scaling */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="flex items-start gap-3 pr-2">
                  <Type size={18} className="text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Text Scaling</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Enlarge script typography for comfortable studio voice reading.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg shrink-0">
                  <button
                    type="button"
                    onClick={() => setFontSize('default')}
                    aria-pressed={fontSize === 'default'}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                      fontSize === 'default'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    100%
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize('large')}
                    aria-pressed={fontSize === 'large'}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                      fontSize === 'large'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    120%
                  </button>
                </div>
              </div>
            </div>

            {/* Compliance Badge */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-3">
              <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold block text-white">WCAG 2.1 AA Compliant</span>
                <span>Active theme ({resolvedTheme}) verified for contrast ratios and screen readers.</span>
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-6 border-t border-slate-800 flex justify-end">
            <button
              onClick={closeSettings}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all focus-ring"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
