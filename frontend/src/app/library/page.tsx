"use client";

import React, { useState, useMemo } from 'react';
import { Search, Grid, List, Plus, X, Activity, Database, DownloadCloud, Sparkles } from 'lucide-react';
import { VoiceCard, SpeakerProfile } from '@/components/ui/VoiceCard';
import { VoiceCardSkeleton } from '@/components/ui/VoiceCardSkeleton';
import { NavigationHeader } from '@/components/layout/NavigationHeader';
import { KeyboardShortcutFooter } from '@/components/layout/KeyboardShortcutFooter';

// Data for Voice Library
const MOCK_PROFILES: SpeakerProfile[] = [
  { id: '1', name: 'Sarah (Broadcast)', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', createdAt: '2026-08-10', tags: ['Preset', 'Female', 'Broadcast'], similarityScore: 0.98, dVectorNorm: 0.999 },
  { id: '2', name: 'James (Podcast)', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', createdAt: '2026-08-11', tags: ['Cloned', 'Male'], similarityScore: 0.85, dVectorNorm: 1.001 },
  { id: '3', name: 'Alice (Narrative)', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', createdAt: '2026-08-12', tags: ['Preset', 'Female'], similarityScore: 0.95, dVectorNorm: 1.0 },
  { id: '4', name: 'Marcus (Gaming)', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', createdAt: '2026-08-01', tags: ['Cloned', 'Male', 'Gaming'], similarityScore: 0.88, dVectorNorm: 0.998 },
];

const AVAILABLE_TAGS = ['Cloned', 'Preset', 'Female', 'Male', 'Broadcast', 'Gaming'];

export default function VoiceLibraryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [inspectedProfile, setInspectedProfile] = useState<SpeakerProfile | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Filter Logic
  const filteredProfiles = useMemo(() => {
    return MOCK_PROFILES.filter(profile => {
      const matchesSearch = profile.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags = selectedTags.length === 0 || selectedTags.every(t => profile.tags.includes(t));
      return matchesSearch && matchesTags;
    });
  }, [searchQuery, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <main className="min-h-screen bg-surface-root flex flex-col font-sans text-text-primary">
      <NavigationHeader activeTab="library" />

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">Voice Library</h1>
            <p className="text-text-secondary mt-1 text-sm">Manage and inspect neural speaker embeddings & zero-shot voice profiles</p>
          </div>
          
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 px-5 py-2.5 rounded-xl transition-all font-semibold shadow-lg shadow-sky-500/20 active:scale-[0.98] focus-ring cursor-pointer"
          >
            <Plus size={18} /> Clone New Voice
          </button>
        </div>

        {/* Toolbar: Search, Filters, View Toggles */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-surface-panel border border-border-subtle p-4 rounded-2xl backdrop-blur-xl shadow-sm">
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search speaker profiles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surface-elevated border border-border-subtle focus:border-sky-500/60 rounded-xl pl-9.5 pr-4 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <div className="flex gap-1.5">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 text-xs font-medium rounded-xl whitespace-nowrap transition-all focus-ring ${
                    selectedTags.includes(tag) 
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm' 
                      : 'bg-surface-elevated text-text-secondary hover:text-text-primary hover:bg-surface-elevated/80 border border-border-subtle'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            
            <div className="w-px h-6 bg-border-subtle mx-1 hidden md:block" />
            
            <div className="flex gap-1 shrink-0 bg-surface-elevated p-1 rounded-xl border border-border-subtle">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors focus-ring ${viewMode === 'grid' ? 'bg-sky-500/20 text-sky-300 shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                title="Grid View"
              >
                <Grid size={15} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors focus-ring ${viewMode === 'list' ? 'bg-sky-500/20 text-sky-300 shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                title="List View"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {Array.from({ length: 4 }).map((_, i) => (
              <VoiceCardSkeleton key={i} viewMode={viewMode} />
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center text-text-muted bg-surface-panel border border-border-subtle rounded-2xl p-8 text-center backdrop-blur-xl">
            <Database size={44} className="mb-3 opacity-30 text-sky-400" />
            <p className="text-sm text-text-secondary">No speaker profiles match your filters.</p>
            <button onClick={() => {setSearchQuery(''); setSelectedTags([])}} className="mt-3 text-xs text-sky-400 hover:underline">Clear filters</button>
          </div>
        ) : (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {filteredProfiles.map(profile => (
              <VoiceCard 
                key={profile.id}
                profile={profile}
                viewMode={viewMode}
                onClick={(p) => console.log('Selected', p.name)}
                onInspectVector={setInspectedProfile}
              />
            ))}
          </div>
        )}

      </div>

      <KeyboardShortcutFooter />

      {/* Vector Embedding Drawer / Modal */}
      {inspectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-surface-panel border border-border-elevated rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
            <button 
              onClick={() => setInspectedProfile(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors focus-ring rounded-lg p-1"
            >
              <X size={18} />
            </button>
            
            <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
              <Activity className="text-sky-400" size={18} /> Embedding Inspector
            </h2>
            
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <img src={inspectedProfile.avatarUrl} alt="" className="w-14 h-14 rounded-full border-2 border-border-elevated bg-surface-elevated" />
                <div>
                  <h3 className="text-base font-semibold text-text-primary">{inspectedProfile.name}</h3>
                  <p className="text-xs text-text-muted font-mono">ID: {inspectedProfile.id}-vec-256</p>
                </div>
              </div>
              
              <div className="bg-surface-elevated rounded-xl p-4 border border-border-subtle space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">Vector Dimensionality</span>
                  <span className="text-text-primary font-mono font-semibold">256-d</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">Euclidean Norm ||e||₂</span>
                  <span className="text-emerald-400 font-mono font-semibold">{inspectedProfile.dVectorNorm.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">Cosine Similarity Score</span>
                  <span className="text-emerald-400 font-mono font-semibold">{(inspectedProfile.similarityScore * 100).toFixed(2)}%</span>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-text-muted mb-2 font-mono uppercase tracking-wider">Vector Distribution Preview</p>
                <div className="w-full h-16 bg-surface-root rounded-xl border border-border-subtle overflow-hidden flex flex-wrap content-start p-1 gap-0.5">
                  {/* 256 vector visualization */}
                  {Array.from({ length: 128 }).map((_, i) => {
                    const val = Math.random();
                    const color = val > 0.8 ? 'bg-sky-400' : val > 0.5 ? 'bg-sky-500/60' : val > 0.2 ? 'bg-surface-elevated' : 'bg-surface-panel';
                    return <div key={i} className={`w-1.5 h-1.5 rounded-xs ${color}`} />
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal Stub */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-surface-panel border border-border-elevated rounded-2xl p-8 w-full max-w-md shadow-2xl relative text-center">
            <button 
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors focus-ring rounded-lg p-1"
            >
              <X size={18} />
            </button>
            <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-sky-400">
              <DownloadCloud size={24} />
            </div>
            <h2 className="text-lg font-bold text-text-primary mb-1">Clone a New Voice</h2>
            <p className="text-text-secondary text-xs mb-5 leading-relaxed">Upload a clean audio sample of a single speaker without background noise.</p>
            <div className="w-full h-32 border-2 border-dashed border-border-subtle hover:border-sky-500/50 rounded-2xl flex flex-col items-center justify-center text-text-muted hover:text-sky-300 transition-colors cursor-pointer bg-surface-elevated/40">
              <Sparkles size={20} className="text-sky-400 mb-2 opacity-60" />
              <span className="text-xs font-medium">Drag & Drop .WAV or .MP3</span>
              <span className="text-[10px] text-text-muted mt-0.5">3 - 10 seconds recommended</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

