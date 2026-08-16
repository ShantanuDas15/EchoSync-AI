"use client";

import React from 'react';
import { Play, Pause, Activity, MoreVertical, Loader2 } from 'lucide-react';
import { TiltCard } from './TiltCard';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { VolumeNormalizationBadge } from './VolumeNormalizationBadge';

export interface SpeakerProfile {
  id: string;
  name: string;
  avatarUrl: string;
  createdAt: string;
  tags: string[];
  similarityScore: number;
  dVectorNorm: number;
  sampleAudioUrl?: string;
  referenceAudioId?: string;
}

interface VoiceCardProps {
  profile: SpeakerProfile;
  onClick: (profile: SpeakerProfile) => void;
  onInspectVector: (profile: SpeakerProfile) => void;
  viewMode: 'grid' | 'list';
}

export function VoiceCard({ profile, onClick, onInspectVector, viewMode }: VoiceCardProps) {
  const { isPlaying, toggle, isLoading, activeId } = useAudioPlayer();
  const currentlyPlaying = isPlaying(profile.id);
  const isCurrentlyLoading = isLoading && activeId === profile.id;

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audioSource = profile.referenceAudioId || profile.sampleAudioUrl;
    const isAsset = Boolean(profile.referenceAudioId);
    toggle(profile.id, audioSource, isAsset);
  };

  const handleInspect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInspectVector(profile);
  };

  if (viewMode === 'list') {
    return (
      <div 
        data-testid="voice-card-list"
        onClick={() => onClick(profile)}
        className="flex items-center justify-between p-4 bg-surface-panel/90 border border-border-subtle rounded-xl hover:bg-surface-elevated cursor-pointer transition-all group"
      >
        <div className="flex items-center gap-4">
          <img src={profile.avatarUrl} alt={profile.name} className="w-12 h-12 rounded-full object-cover border-2 border-border-subtle" />
          <div>
            <h3 className="text-text-primary font-semibold text-sm">{profile.name}</h3>
            <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
              <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <VolumeNormalizationBadge dVectorNorm={profile.dVectorNorm} />
              <span>•</span>
              <span className="flex gap-1">
                {profile.tags.map(tag => <span key={tag} className="text-sky-400 font-mono">#{tag}</span>)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
            <Activity size={12} />
            {(profile.similarityScore * 100).toFixed(1)}% Match
          </div>
          
          <button 
            onClick={togglePlay}
            disabled={isCurrentlyLoading}
            aria-label={currentlyPlaying ? `Pause ${profile.name}` : `Play ${profile.name}`}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-sky-500/15 text-sky-400 hover:bg-sky-500 hover:text-white transition-colors focus-ring"
          >
            {isCurrentlyLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : currentlyPlaying ? (
              <Pause size={14} fill="currentColor" />
            ) : (
              <Play size={14} fill="currentColor" className="ml-0.5" />
            )}
          </button>
          
          <button onClick={handleInspect} aria-label="Inspect voice vector" className="text-text-muted hover:text-text-primary focus-ring p-1 rounded">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Grid View - Flattened and Clean
  return (
    <TiltCard maxAngle={6} className="h-full">
      <div 
        data-testid="voice-card-grid"
        onClick={() => onClick(profile)}
        className="h-full flex flex-col p-5 bg-surface-panel/90 rounded-2xl hover:bg-surface-elevated cursor-pointer transition-all border border-border-subtle group relative overflow-hidden"
      >
        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
          <VolumeNormalizationBadge dVectorNorm={profile.dVectorNorm} />
          <button onClick={handleInspect} aria-label="Inspect voice vector" className="w-6 h-6 flex items-center justify-center rounded-full bg-surface-elevated text-text-muted hover:text-text-primary transition-colors focus-ring">
            <MoreVertical size={12} />
          </button>
        </div>

        <div className="flex flex-col items-center mb-3 mt-1">
          <div className="relative">
            <img src={profile.avatarUrl} alt={profile.name} className="w-20 h-20 rounded-full object-cover border-2 border-border-subtle shadow-md" />
            <button 
              onClick={togglePlay}
              disabled={isCurrentlyLoading}
              aria-label={currentlyPlaying ? `Pause ${profile.name}` : `Play ${profile.name}`}
              className="absolute -bottom-2 -right-2 w-8 h-8 flex items-center justify-center rounded-full bg-sky-600 text-white shadow-md hover:scale-105 transition-transform focus-ring"
            >
              {isCurrentlyLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : currentlyPlaying ? (
                <Pause size={14} fill="currentColor" />
              ) : (
                <Play size={14} fill="currentColor" className="ml-0.5" />
              )}
            </button>
          </div>
          
          <h3 className="text-text-primary font-semibold mt-3 text-base tracking-tight">{profile.name}</h3>
          <span className="text-xs text-text-muted">{new Date(profile.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Dynamic Waveform Preview */}
        <div className="w-full h-7 flex items-center justify-center gap-[2px] opacity-60 group-hover:opacity-100 transition-opacity mt-1 px-2">
          {Array.from({ length: 24 }).map((_, i) => {
            const height = Math.max(20, ((i * 37) % 80) + 20);
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all ${
                  currentlyPlaying ? 'bg-sky-400 animate-pulse' : 'bg-surface-elevated group-hover:bg-sky-400/60'
                }`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap justify-center gap-1.5 mt-4">
          {profile.tags.map(tag => (
            <span key={tag} className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-surface-elevated text-text-muted border border-border-subtle">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </TiltCard>
  );
}
