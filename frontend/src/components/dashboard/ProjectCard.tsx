"use client";

import React, { useState } from 'react';
import { Clock, History, Trash2, Folder as FolderIcon, Play, ChevronRight, MoreVertical, FileText, User } from 'lucide-react';
import { Project, Folder } from '@/lib/workspaceUtils';

interface ProjectCardProps {
  project: Project;
  folderName?: string;
  folders?: Folder[];
  onOpenProject?: (project: Project) => void;
  onViewRevisions?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onMoveProject?: (projectId: string, folderId: string | null) => void;
}

// Voice color palette generator based on voice name hash
const VOICE_COLORS = [
  'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'bg-rose-500/20 text-rose-300 border-rose-500/30',
  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
];

function getVoiceBadgeColor(voiceName: string): string {
  let hash = 0;
  for (let i = 0; i < voiceName.length; i++) {
    hash = voiceName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % VOICE_COLORS.length;
  return VOICE_COLORS[index];
}

export function ProjectCard({
  project,
  folderName,
  folders = [],
  onOpenProject,
  onViewRevisions,
  onDeleteProject,
  onMoveProject,
}: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);

  return (
    <div className="group relative bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between shadow-lg shadow-black/20 hover:shadow-indigo-500/5">
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {folderName ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md border border-slate-700/50">
                  <FolderIcon size={11} className="text-indigo-400" />
                  {folderName}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-slate-800/50 text-slate-500 px-2 py-0.5 rounded-md border border-slate-800">
                  Root
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/20">
                <Clock size={11} />
                {project.duration}
              </span>
            </div>

            <h3 
              onClick={() => onOpenProject?.(project)}
              className="text-base font-semibold text-slate-100 hover:text-indigo-300 transition-colors cursor-pointer truncate"
              title={project.title}
            >
              {project.title}
            </h3>
          </div>

          {/* Actions Context Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              aria-label="Project actions"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => {
                    setShowMenu(false);
                    setShowMoveDropdown(false);
                  }} 
                />
                <div className="absolute right-0 mt-1 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 py-1.5 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenProject?.(project);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-indigo-300 flex items-center gap-2"
                  >
                    <Play size={13} className="text-indigo-400" />
                    Open in Studio
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onViewRevisions?.(project);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-indigo-300 flex items-center gap-2"
                  >
                    <History size={13} className="text-violet-400" />
                    Revisions ({project.versions.length})
                  </button>

                  <button
                    onClick={() => setShowMoveDropdown(!showMoveDropdown)}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-indigo-300 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <FolderIcon size={13} className="text-amber-400" />
                      Move to Folder
                    </span>
                    <ChevronRight size={12} className="text-slate-500" />
                  </button>

                  {showMoveDropdown && (
                    <div className="bg-slate-950/90 border-y border-slate-800 py-1 my-1">
                      <button
                        onClick={() => {
                          onMoveProject?.(project.id, null);
                          setShowMenu(false);
                          setShowMoveDropdown(false);
                        }}
                        className={`w-full px-5 py-1.5 text-left text-[11px] ${
                          project.folderId === null ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        • Root (No Folder)
                      </button>
                      {folders.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => {
                            onMoveProject?.(project.id, f.id);
                            setShowMenu(false);
                            setShowMoveDropdown(false);
                          }}
                          className={`w-full px-5 py-1.5 text-left text-[11px] truncate ${
                            project.folderId === f.id ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          • {f.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="h-px bg-slate-800 my-1" />

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDeleteProject?.(project.id);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <Trash2 size={13} />
                    Delete Project
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Script Preview Snippet */}
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed font-sans">
          {project.script || "No script content recorded in this project."}
        </p>
      </div>

      {/* Card Footer: Voice Avatars & Revisions Badge */}
      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
        {/* Voice Avatars Stack */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {project.voices.map((voice) => {
            const colorClass = getVoiceBadgeColor(voice);
            return (
              <span
                key={voice}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${colorClass}`}
                title={`Speaker: ${voice}`}
              >
                <User size={10} />
                {voice}
              </span>
            );
          })}
        </div>

        {/* Quick Revisions & Date */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewRevisions?.(project)}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-indigo-300 transition-colors bg-slate-800/60 px-2 py-1 rounded-lg border border-slate-700/40"
            title="View revision history"
          >
            <History size={12} className="text-indigo-400" />
            <span>v{project.versions.length}</span>
          </button>
          <span className="text-[11px] text-slate-500 font-mono">
            {project.lastModified}
          </span>
        </div>
      </div>
    </div>
  );
}
