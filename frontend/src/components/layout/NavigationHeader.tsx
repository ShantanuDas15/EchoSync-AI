"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Waves, Mic, Library, Activity, Menu, X, Radio, FolderKanban, Code2, Settings, Compass } from 'lucide-react';
import { MetricBadge } from '@/components/ui/MetricBadge';
import { useTheme } from '@/lib/themeContext';
import { useOnboarding } from '@/lib/onboardingContext';

interface NavigationHeaderProps {
  activeTab?: string;
  isStreaming?: boolean;
  pingMs?: number;
}

export function NavigationHeader({
  activeTab,
  isStreaming = false,
  pingMs = 42,
}: NavigationHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { openSettings } = useTheme();
  const { startTour } = useOnboarding();

  const navLinks = [
    { href: '/', label: 'Studio Workspace', icon: Mic, id: 'studio' },
    { href: '/dashboard', label: 'Projects & Folders', icon: FolderKanban, id: 'dashboard' },
    { href: '/library', label: 'Voice Library', icon: Library, id: 'library' },
    { href: '/developer', label: 'Developer API', icon: Code2, id: 'developer' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface-panel backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            data-tour="brand-logo"
            className="flex items-center gap-3 group focus-ring rounded-lg p-1"
          >
            <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20 group-hover:border-sky-500/40 transition-colors shadow-sm">
              <Waves className="w-5 h-5 text-sky-400 group-hover:scale-105 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-text-primary tracking-tight font-sans">
                EchoSync <span className="text-sky-400">AI</span>
              </span>
              <span className="text-[10px] font-mono tracking-wider text-text-muted uppercase -mt-0.5">
                Neural Voice Studio
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-4 border-l border-border-subtle pl-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                activeTab === link.id ||
                pathname === link.href ||
                (link.href !== '/' && pathname?.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all focus-ring ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-sky-400' : 'text-text-muted'} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop System Status & Telemetry & Settings */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-medium">
          <MetricBadge label="Target RTF" value="< 0.35" type="rtf" />
          <MetricBadge label="Target TTFB" value="< 450" unit="ms" type="ttfb" />

          {/* Live System Signal Badge */}
          <div className="flex items-center gap-2 bg-surface-panel border border-border-subtle px-3 py-1.5 rounded-full shadow-inner">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isStreaming ? 'bg-sky-400' : 'bg-emerald-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isStreaming ? 'bg-sky-500' : 'bg-emerald-500'
                }`}
              />
            </span>
            <span className="text-text-secondary font-mono text-[11px]">
              {isStreaming ? (
                <span className="text-sky-400 animate-pulse font-medium">Streaming PCM</span>
              ) : (
                <span className="text-emerald-400 font-medium">Systems Online</span>
              )}
            </span>
            <span className="text-text-muted font-mono text-[10px]">({pingMs}ms)</span>
          </div>

          {/* Guided Tour Trigger */}
          <button
            onClick={startTour}
            aria-label="Start Guided Studio Tour"
            className="p-2 rounded-xl text-sky-400 hover:text-sky-200 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all focus-ring flex items-center gap-1.5 text-xs font-medium"
            title="Start Interactive Guided Tour"
          >
            <Compass size={16} />
            <span className="hidden xl:inline">Guided Tour</span>
          </button>

          {/* Accessibility Settings Trigger */}
          <button
            onClick={openSettings}
            aria-label="Open System and Accessibility Settings"
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary bg-surface-panel hover:bg-surface-elevated border border-border-subtle transition-colors focus-ring"
            title="System & Accessibility Settings"
          >
            <Settings size={17} />
          </button>
        </div>

        {/* Mobile Hamburger Toggle & Settings */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={startTour}
            aria-label="Start Guided Studio Tour"
            className="p-2 rounded-xl text-sky-400 hover:text-sky-200 bg-sky-500/10 border border-sky-500/30 focus-ring"
            title="Start Guided Tour"
          >
            <Compass size={18} />
          </button>
          <button
            onClick={openSettings}
            aria-label="Open System and Accessibility Settings"
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary bg-surface-panel border border-border-subtle focus-ring"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary bg-surface-panel border border-border-subtle focus-ring"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border-subtle bg-surface-root/95 backdrop-blur-2xl px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2">
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                      : 'text-text-secondary hover:bg-surface-elevated'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-sky-400' : 'text-text-muted'} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
            <MetricBadge label="Target RTF" value="< 0.35" type="rtf" />
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
