"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Waves, Mic, Library, Activity, Menu, X, Radio, FolderKanban, Code2 } from 'lucide-react';
import { MetricBadge } from '@/components/ui/MetricBadge';

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

  const navLinks = [
    { href: '/', label: 'Studio Workspace', icon: Mic, id: 'studio' },
    { href: '/dashboard', label: 'Projects & Folders', icon: FolderKanban, id: 'dashboard' },
    { href: '/library', label: 'Voice Library', icon: Library, id: 'library' },
    { href: '/developer', label: 'Developer API', icon: Code2, id: 'developer' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-3 group focus-ring rounded-lg p-1"
          >
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 group-hover:border-indigo-500/40 transition-colors shadow-lg shadow-indigo-500/10">
              <Waves className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200 bg-clip-text text-transparent tracking-tight">
                EchoSync AI
              </span>
              <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase -mt-1">
                Zero-Shot Neural Studio
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-4 border-l border-slate-800/80 pl-6">
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
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop System Status & Telemetry */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-medium">
          <MetricBadge label="Target RTF" value="< 0.35" type="rtf" />
          <MetricBadge label="Target TTFB" value="< 450" unit="ms" type="ttfb" />

          {/* Live System Signal Badge */}
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full shadow-inner">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isStreaming ? 'bg-indigo-400' : 'bg-emerald-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isStreaming ? 'bg-indigo-500' : 'bg-emerald-500'
                }`}
              />
            </span>
            <span className="text-slate-300 font-mono">
              {isStreaming ? (
                <span className="text-indigo-400 animate-pulse">Streaming PCM</span>
              ) : (
                <span className="text-emerald-400">Systems Online</span>
              )}
            </span>
            <span className="text-slate-600 font-mono text-[10px]">({pingMs}ms)</span>
          </div>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800 focus-ring"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2">
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
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
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
