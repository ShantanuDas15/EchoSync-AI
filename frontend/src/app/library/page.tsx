"use client";

import React, { useState, useMemo } from 'react';
import { Search, Grid, List, Plus, X, Activity, Database, DownloadCloud } from 'lucide-react';
import { VoiceCard, SpeakerProfile } from '@/components/ui/VoiceCard';
import { NavigationHeader } from '@/components/layout/NavigationHeader';
import { KeyboardShortcutFooter } from '@/components/layout/KeyboardShortcutFooter';

// Dummy data for Voice Library
const MOCK_PROFILES: SpeakerProfile[] = [
  { id: '1', name: 'Sarah (Broadcast)', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', createdAt: '2026-08-10', tags: ['Preset', 'Female', 'Broadcast'], similarityScore: 0.98, dVectorNorm: 0.999 },
  { id: '2', name: 'James (Podcast)', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', createdAt: '2026-08-11', tags: ['Cloned', 'Male'], similarityScore: 0.85, dVectorNorm: 1.001 },
  { id: '3', name: 'Alice (Narrative)', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', createdAt: '2026-08-12', tags: ['Preset', 'Female'], similarityScore: 0.95, dVectorNorm: 1.0 },
  { id: '4', name: 'Marcus (Gaming)', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', createdAt: '2026-08-01', tags: ['Cloned', 'Male', 'Gaming'], similarityScore: 0.88, dVectorNorm: 0.998 },
];

const AVAILABLE_TAGS = ['Cloned', 'Preset', 'Female', 'Male', 'Broadcast', 'Gaming'];

export default function VoiceLibraryPage() {
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
    <main className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <NavigationHeader />

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
          <div>
            <h1 className="text-3xl font-light text-slate-100 tracking-tight">Voice Library</h1>
            <p className="text-slate-400 mt-1">Manage and inspect neural speaker embeddings</p>
          </div>
          
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl transition-colors font-medium shadow-lg shadow-indigo-500/20"
          >
            <Plus size={18} /> Clone New Voice
          </button>
        </div>

        {/* Toolbar: Search, Filters, View Toggles */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center glass-panel p-4 rounded-xl">
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search speaker profiles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/50 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <div className="flex gap-2">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                    selectedTags.includes(tag) 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            
            <div className="w-px h-6 bg-slate-800 mx-2 hidden md:block" />
            
            <div className="flex gap-1 shrink-0 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Grid size={16} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {filteredProfiles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <Database size={48} className="mb-4 opacity-20" />
            <p>No speaker profiles match your filters.</p>
            <button onClick={() => {setSearchQuery(''); setSelectedTags([])}} className="mt-4 text-indigo-400 hover:underline">Clear filters</button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
            <button 
              onClick={() => setInspectedProfile(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
              <Activity className="text-indigo-400" /> Embedding Inspector
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <img src={inspectedProfile.avatarUrl} alt="" className="w-16 h-16 rounded-full border-2 border-slate-700" />
                <div>
                  <h3 className="text-lg text-slate-200">{inspectedProfile.name}</h3>
                  <p className="text-sm text-slate-400 font-mono">ID: {inspectedProfile.id}-vec-256</p>
                </div>
              </div>
              
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Vector Dimensionality</span>
                  <span className="text-slate-200 font-mono">256-d</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Euclidean Norm ||e||₂</span>
                  <span className="text-emerald-400 font-mono">{inspectedProfile.dVectorNorm.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Cosine Similarity Score</span>
                  <span className="text-emerald-400 font-mono">{(inspectedProfile.similarityScore * 100).toFixed(2)}%</span>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-slate-500 mb-2 font-mono uppercase tracking-widest">Vector Distribution Preview</p>
                <div className="w-full h-16 bg-slate-950 rounded border border-slate-800 overflow-hidden flex flex-wrap content-start">
                  {/* Fake 256 vector visualization */}
                  {Array.from({ length: 128 }).map((_, i) => {
                    const val = Math.random();
                    const color = val > 0.8 ? 'bg-indigo-400' : val > 0.5 ? 'bg-indigo-600' : val > 0.2 ? 'bg-slate-600' : 'bg-slate-800';
                    return <div key={i} className={`w-2 h-2 ${color}`} />
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal Stub */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl relative text-center">
            <button 
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <DownloadCloud size={48} className="text-indigo-500 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-white mb-2">Clone a New Voice</h2>
            <p className="text-slate-400 text-sm mb-6">Upload a 1-5 minute clean audio sample of a single speaker without background noise.</p>
            <div className="w-full h-32 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-colors cursor-pointer bg-slate-800/30">
              Drag & Drop .WAV or .MP3
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
