"use client";

import React, { useState, useMemo } from 'react';
import { StoryboardTemplate, TemplateCategory } from '@/types/onboarding';
import { STORYBOARD_TEMPLATES } from '@/lib/templatesData';
import { filterTemplatesByCategory } from '@/lib/onboardingContext';
import { X, Search, Clock, Users, Sparkles, ArrowRight, CheckCircle2, Mic, Volume2 } from 'lucide-react';

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: StoryboardTemplate) => void;
}

const CATEGORIES: TemplateCategory[] = ['All', 'Podcast', 'Audiobook', 'Gaming', 'Commercial', 'Customer Support'];

export function QuickStartModal({
  isOpen,
  onClose,
  onSelectTemplate
}: QuickStartModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    return filterTemplatesByCategory(STORYBOARD_TEMPLATES, selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleApply = (template: StoryboardTemplate) => {
    setActiveTemplateId(template.id);
    setTimeout(() => {
      onSelectTemplate(template);
      onClose();
      setActiveTemplateId(null);
    }, 250);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-templates-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-surface-root/80 backdrop-blur-md transition-all"
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative max-w-4xl w-full max-h-[90vh] bg-surface-panel border border-border-elevated rounded-2xl shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-text-primary z-10">
        
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 id="quick-templates-title" className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
                Quick Start Dialogue Scenarios
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Load curated multi-speaker dialogue scripts and neural voice assignments in one click.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close templates modal"
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-xl transition-colors focus-ring cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="px-5 sm:px-6 py-3 bg-surface-root/60 border-b border-border-subtle flex flex-col sm:flex-row items-center gap-3 justify-between">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all focus-ring ${
                  selectedCategory === cat
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm font-semibold'
                    : 'bg-surface-elevated text-text-secondary hover:text-text-primary hover:bg-surface-elevated/80 border border-border-subtle'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates or tags..."
              className="w-full pl-9 pr-7 py-1.5 text-xs bg-surface-elevated border border-border-subtle rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-sky-500/60 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Template Cards Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[550px] grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center text-text-muted">
              <Search size={32} className="mb-2 opacity-30 text-sky-400" />
              <p className="text-sm font-medium text-text-primary">No templates match your search criteria.</p>
              <p className="text-xs text-text-secondary mt-1">Try clearing your search query or selecting another category.</p>
              <button
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                className="mt-3 px-3 py-1.5 bg-surface-elevated text-xs text-sky-400 hover:text-sky-300 rounded-xl border border-border-subtle transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            filteredTemplates.map((tpl) => {
              const isSelected = activeTemplateId === tpl.id;

              return (
                <div
                  key={tpl.id}
                  className="p-5 rounded-2xl bg-surface-panel border border-border-subtle hover:border-border-elevated transition-all flex flex-col justify-between group hover:shadow-lg backdrop-blur-xl"
                >
                  <div className="space-y-3">
                    {/* Top Metadata */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-surface-elevated text-sky-300 border border-border-subtle">
                        {tpl.category}
                      </span>
                      <div className="flex items-center gap-2.5 text-xs text-text-muted font-mono">
                        <span className="flex items-center gap-1 bg-surface-elevated px-2 py-0.5 rounded border border-border-subtle text-[11px]">
                          <Clock size={11} className="text-text-muted" />
                          {tpl.durationEstimate}
                        </span>
                        <span className="flex items-center gap-1 bg-surface-elevated px-2 py-0.5 rounded border border-border-subtle text-[11px]">
                          <Users size={11} className="text-text-muted" />
                          {tpl.speakerCount} {tpl.speakerCount > 1 ? 'Speakers' : 'Speaker'}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-bold text-text-primary group-hover:text-sky-300 transition-colors tracking-tight">
                        {tpl.title}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>

                    {/* Pseudo Audio Waveform Preview Accent */}
                    <div className="h-4 bg-surface-elevated rounded-lg p-1 flex items-center justify-between gap-0.5 overflow-hidden opacity-60 group-hover:opacity-100 transition-opacity">
                      {Array.from({ length: 36 }).map((_, i) => {
                        const heights = [30, 60, 90, 45, 75, 100, 40, 80, 65, 50, 85, 35];
                        const h = heights[i % heights.length];
                        return (
                          <div
                            key={i}
                            style={{ height: `${h}%` }}
                            className="flex-1 bg-sky-400/60 rounded-xs min-w-[2px]"
                          />
                        );
                      })}
                    </div>

                    {/* Snippet Preview */}
                    <div className="p-3 rounded-xl bg-surface-elevated border border-border-subtle text-[11px] text-text-secondary space-y-1 font-mono">
                      <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold flex items-center gap-1.5">
                        <Volume2 size={11} className="text-sky-400" />
                        Sample Dialogue ({tpl.blocks.length} blocks):
                      </div>
                      <div className="line-clamp-2 italic text-text-primary">
                        &ldquo;{tpl.blocks[0].text}&rdquo;
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {tpl.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-surface-elevated text-text-muted border border-border-subtle"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-text-muted truncate max-w-[200px]">
                      <Mic size={12} className="text-sky-400 shrink-0" />
                      <span className="truncate">{tpl.recommendedVoice}</span>
                    </div>

                    <button
                      onClick={() => handleApply(tpl)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all focus-ring cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20 active:scale-95'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 size={13} />
                          Loaded
                        </>
                      ) : (
                        <>
                          Use Template
                          <ArrowRight size={13} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-root/60 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
          <span>{STORYBOARD_TEMPLATES.length} pre-configured studio scenarios available</span>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-xs hover:underline cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

