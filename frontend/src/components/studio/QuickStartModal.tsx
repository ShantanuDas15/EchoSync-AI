"use client";

import React, { useState, useMemo } from 'react';
import { StoryboardTemplate, TemplateCategory } from '@/types/onboarding';
import { STORYBOARD_TEMPLATES } from '@/lib/templatesData';
import { filterTemplatesByCategory } from '@/lib/onboardingContext';
import { X, Search, Clock, Users, Sparkles, ArrowRight, Play, CheckCircle2 } from 'lucide-react';

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
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-all"
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900/95 border border-indigo-500/30 rounded-2xl shadow-2xl shadow-indigo-950/50 backdrop-blur-xl flex flex-col overflow-hidden text-slate-100 z-10">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 id="quick-templates-title" className="text-xl font-bold text-white tracking-tight">
                Quick Start Dialogue Scenarios
              </h2>
              <p className="text-xs text-slate-400">
                Choose a pre-configured template to immediately populate the Storyboard timeline.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close templates modal"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors focus-ring"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/80 flex flex-col sm:flex-row items-center gap-3 justify-between">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all focus-ring ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates or tags..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus-ring"
            />
          </div>
        </div>

        {/* Template Cards Grid */}
        <div className="p-6 overflow-y-auto max-h-[550px] grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center text-slate-500">
              <Search size={32} className="mb-2 opacity-50" />
              <p className="text-sm font-medium">No templates match your search criteria.</p>
              <button
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                className="mt-2 text-xs text-indigo-400 hover:underline"
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
                  className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between group hover:shadow-lg hover:shadow-indigo-950/20"
                >
                  <div className="space-y-3">
                    {/* Top Metadata */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {tpl.category}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-500" />
                          {tpl.durationEstimate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={12} className="text-slate-500" />
                          {tpl.speakerCount} {tpl.speakerCount > 1 ? 'Voices' : 'Voice'}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {tpl.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>

                    {/* Snippet Preview */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5 font-mono">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        Sample Dialogue ({tpl.blocks.length} blocks):
                      </div>
                      <div className="line-clamp-2 italic text-slate-300">
                        &ldquo;{tpl.blocks[0].text}&rdquo;
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {tpl.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800/60 text-slate-400 border border-slate-700/40"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {tpl.recommendedVoice}
                    </span>

                    <button
                      onClick={() => handleApply(tpl)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all focus-ring ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 active:scale-95'
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
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>{STORYBOARD_TEMPLATES.length} total templates available</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
