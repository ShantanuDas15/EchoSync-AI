"use client";

import React, { useState } from 'react';
import { Clock, History, Trash2, Folder as FolderIcon, Play, ChevronRight, MoreVertical, Sparkles, User, AudioWaveform } from 'lucide-react';
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

  // Derive pseudo waveform bar heights from project script/id for visual audio identity
  const waveformHeights = React.useMemo(() => {
    const seed = project.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from({ length: 18 }, (_, i) => {
      const val = Math.sin(seed + i * 1.3) * 0.5 + 0.5;
      return Math.max(15, Math.round(val * 90));
    });
  }, [project.id]);

  return (
    <div className="group relative bg-surface-panel hover:bg-surface-panel/90 border border-border-subtle hover:border-border-elevated rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md backdrop-blur-xl">
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {folderName ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-surface-elevated text-text-secondary px-2 py-0.5 rounded-md border border-border-subtle">
                  <FolderIcon size={11} className="text-sky-400" />
                  <span className="truncate max-w-[110px]">{folderName}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-surface-elevated/50 text-text-muted px-2 py-0.5 rounded-md border border-border-subtle">
                  Root
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-sky-500/10 text-sky-300 px-2 py-0.5 rounded-md border border-sky-500/20">
                <Clock size={10} />
                {project.duration}
              </span>

              {project.tags?.map((tag) => (
                <span key={tag} className="text-[10px] font-mono bg-surface-elevated text-text-muted px-1.5 py-0.5 rounded border border-border-subtle">
                  #{tag}
                </span>
              ))}
            </div>

            <h3 
              onClick={() => onOpenProject?.(project)}
              className="text-base font-semibold text-text-primary group-hover:text-sky-300 transition-colors cursor-pointer truncate tracking-tight"
              title={project.title}
            >
              {project.title}
            </h3>
          </div>

          {/* Actions Context Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors focus-ring cursor-pointer"
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
                <div className="absolute right-0 mt-1 w-52 bg-surface-panel border border-border-elevated rounded-xl shadow-2xl z-30 py-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 text-text-secondary">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenProject?.(project);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-text-secondary hover:bg-surface-elevated hover:text-sky-300 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Play size={13} className="text-sky-400" />
                    Open in Studio
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onViewRevisions?.(project);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-text-secondary hover:bg-surface-elevated hover:text-sky-300 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <History size={13} className="text-sky-400" />
                    Revision History ({project.versions.length})
                  </button>

                  <button
                    onClick={() => setShowMoveDropdown(!showMoveDropdown)}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-text-secondary hover:bg-surface-elevated hover:text-sky-300 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <FolderIcon size={13} className="text-amber-400" />
                      Move to Folder
                    </span>
                    <ChevronRight size={12} className="text-text-muted" />
                  </button>

                  {showMoveDropdown && (
                    <div className="bg-surface-elevated/90 border-y border-border-subtle py-1 my-1">
                      <button
                        onClick={() => {
                          onMoveProject?.(project.id, null);
                          setShowMenu(false);
                          setShowMoveDropdown(false);
                        }}
                        className={`w-full px-5 py-1.5 text-left text-[11px] cursor-pointer transition-colors ${
                          project.folderId === null ? 'text-sky-400 font-semibold' : 'text-text-muted hover:text-text-primary'
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
                          className={`w-full px-5 py-1.5 text-left text-[11px] truncate cursor-pointer transition-colors ${
                            project.folderId === f.id ? 'text-sky-400 font-semibold' : 'text-text-muted hover:text-text-primary'
                          }`}
                        >
                          • {f.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="h-px bg-border-subtle my-1" />

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDeleteProject?.(project.id);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    Delete Project
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mini Waveform Visual Accent */}
        <div className="flex items-end gap-1 h-6 py-1 px-2.5 rounded-lg bg-surface-elevated/40 border border-border-subtle/50 mb-3 overflow-hidden">
          {waveformHeights.map((h, idx) => (
            <div
              key={idx}
              className="flex-1 bg-sky-400/40 rounded-full transition-all duration-300 group-hover:bg-sky-400/70"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>

        {/* Script Preview Snippet */}
        <p className="text-xs text-text-secondary line-clamp-2 mb-4 leading-relaxed font-sans">
          {project.script || "No script content recorded in this project."}
        </p>
      </div>

      {/* Card Footer: Voice Avatars, Studio Launch & Revisions Badge */}
      <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
        {/* Voice Speaker Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {project.voices.map((voice) => (
            <span
              key={voice}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-elevated text-text-secondary border border-border-subtle"
              title={`Speaker: ${voice}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              {voice}
            </span>
          ))}
        </div>

        {/* Quick Revisions & Open CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onViewRevisions?.(project)}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-text-muted hover:text-sky-300 transition-colors bg-surface-elevated px-2 py-1 rounded-lg border border-border-subtle focus-ring cursor-pointer"
            title="View revision checkpoints"
          >
            <History size={12} className="text-sky-400" />
            <span>v{project.versions.length}</span>
          </button>

          <button
            onClick={() => onOpenProject?.(project)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-300 hover:text-sky-200 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 rounded-lg border border-sky-500/30 transition-all focus-ring cursor-pointer"
            title="Open in Studio"
          >
            <Play size={11} className="text-sky-400 fill-sky-400" />
            <span className="hidden sm:inline">Open</span>
          </button>
        </div>
      </div>
    </div>
  );
}

