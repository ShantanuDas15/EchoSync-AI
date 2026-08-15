"use client";

import React, { useState } from 'react';
import { Play, Pause, Activity, MoreVertical } from 'lucide-react';
import { TiltCard } from './TiltCard';

export interface SpeakerProfile {
  id: string;
  name: string;
  avatarUrl: string;
  createdAt: string;
  tags: string[];
  similarityScore: number;
  dVectorNorm: number;
}

interface VoiceCardProps {
  profile: SpeakerProfile;
  onClick: (profile: SpeakerProfile) => void;
  onInspectVector: (profile: SpeakerProfile) => void;
  viewMode: 'grid' | 'list';
}

export function VoiceCard({ profile, onClick, onInspectVector, viewMode }: VoiceCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const handleInspect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInspectVector(profile);
  };

  if (viewMode === 'list') {
    return (
      <div 
        onClick={() => onClick(profile)}
        className="flex items-center justify-between p-4 glass-panel rounded-xl hover:bg-slate-800/80 cursor-pointer transition-all border border-slate-700/50 group"
      >
        <div className="flex items-center gap-4">
          <img src={profile.avatarUrl} alt={profile.name} className="w-12 h-12 rounded-full object-cover border-2 border-slate-700" />
          <div>
            <h3 className="text-slate-200 font-medium">{profile.name}</h3>
            <div className="flex gap-2 text-xs text-slate-500 mt-1">
              <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span className="flex gap-1">
                {profile.tags.map(tag => <span key={tag} className="text-indigo-400">#{tag}</span>)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
            <Activity size={12} />
            {(profile.similarityScore * 100).toFixed(1)}% Match
          </div>
          
          <button 
            onClick={togglePlay}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors focus-ring"
          >
            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
          </button>
          
          <button onClick={handleInspect} className="text-slate-500 hover:text-slate-300 focus-ring p-1 rounded">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Grid View with 3D Tilt micro-interaction
  return (
    <TiltCard maxAngle={6} className="h-full">
      <div 
        onClick={() => onClick(profile)}
        className="h-full flex flex-col p-5 glass-panel rounded-2xl hover:bg-slate-800/80 cursor-pointer transition-all border border-slate-700/50 group relative overflow-hidden"
      >
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
            <Activity size={10} />
            {(profile.similarityScore * 100).toFixed(0)}%
          </div>
          <button onClick={handleInspect} className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors focus-ring">
            <MoreVertical size={12} />
          </button>
        </div>

        <div className="flex flex-col items-center mb-4 mt-2">
          <div className="relative">
            <img src={profile.avatarUrl} alt={profile.name} className="w-20 h-20 rounded-full object-cover border-4 border-slate-800 shadow-xl" />
            <button 
              onClick={togglePlay}
              className="absolute -bottom-2 -right-2 w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:scale-110 transition-transform focus-ring"
            >
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
            </button>
          </div>
          
          <h3 className="text-slate-200 font-medium mt-4 text-lg">{profile.name}</h3>
          <span className="text-xs text-slate-500">{new Date(profile.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Fake waveform preview */}
        <div className="w-full h-8 flex items-center justify-center gap-[2px] opacity-40 group-hover:opacity-100 transition-opacity mt-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="w-1 bg-indigo-400 rounded-full" style={{ height: `${Math.max(20, ((i * 37) % 80) + 20)}%` }} />
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-1.5 mt-4">
          {profile.tags.map(tag => (
            <span key={tag} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </TiltCard>
  );
}
