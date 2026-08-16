"use client";

import React, { useState } from 'react';
import { History, X, RotateCcw, Check, FileText, Clock, User, ArrowLeftRight, Sparkles, Hash } from 'lucide-react';
import { Project, ProjectVersion } from '@/lib/workspaceUtils';

interface RevisionsDrawerProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onRestoreRevision: (projectId: string, versionId: string) => void;
}

export function RevisionsDrawer({
  project,
  isOpen,
  onClose,
  onRestoreRevision,
}: RevisionsDrawerProps) {
  const [selectedVersion, setSelectedVersion] = useState<ProjectVersion | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);

  if (!isOpen || !project) return null;

  const activeVersion = selectedVersion || project.versions[0];

  const handleRestore = (versionId: string) => {
    onRestoreRevision(project.id, versionId);
    setConfirmRestoreId(null);
    onClose();
  };

  const scriptWords = activeVersion?.script ? activeVersion.script.trim().split(/\s+/).filter(Boolean).length : 0;
  const scriptChars = activeVersion?.script ? activeVersion.script.length : 0;
  const estSeconds = Math.round(scriptWords * 0.45);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-2xl bg-surface-panel border-l border-border-elevated shadow-2xl flex flex-col justify-between backdrop-blur-xl">
          {/* Header */}
          <div className="p-6 border-b border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
                <History size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Revision History</h2>
                <p className="text-xs text-text-muted font-mono truncate max-w-md">
                  Project: {project.title}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors focus-ring"
              aria-label="Close revisions drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body: Split View (Timeline List + Script Inspector) */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border-subtle">
            {/* Version List (Left Side) */}
            <div className="md:col-span-5 p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-140px)]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-text-muted px-2 mb-2">
                Checkpoints ({project.versions.length})
              </div>

              {project.versions.map((ver, idx) => {
                const isSelected = activeVersion?.id === ver.id;
                const isLatest = idx === 0;

                return (
                  <div
                    key={ver.id}
                    onClick={() => setSelectedVersion(ver)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-500/30 text-text-primary shadow-sm'
                        : 'bg-surface-elevated/40 border-border-subtle text-text-secondary hover:border-border-elevated hover:bg-surface-elevated/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-semibold text-sky-400">
                        {ver.id.split('-')[0]}
                      </span>
                      {isLatest && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Current
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-text-primary line-clamp-1 mb-2 font-medium">
                      {ver.summary}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-text-muted font-mono">
                      <span className="flex items-center gap-1">
                        <User size={10} />
                        {ver.author || 'User'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(ver.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Version Content Inspector (Right Side) */}
            <div className="md:col-span-7 p-6 flex flex-col justify-between bg-surface-root/40">
              {activeVersion ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">
                        {activeVersion.summary}
                      </h3>
                      <p className="text-[11px] text-text-muted font-mono mt-0.5">
                        Saved: {new Date(activeVersion.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Telemetry Chips for this version */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-surface-elevated p-2 rounded-xl border border-border-subtle text-center">
                      <span className="text-[10px] font-mono uppercase text-text-muted block">Words</span>
                      <span className="text-xs font-bold font-mono text-text-primary">{scriptWords}</span>
                    </div>
                    <div className="bg-surface-elevated p-2 rounded-xl border border-border-subtle text-center">
                      <span className="text-[10px] font-mono uppercase text-text-muted block">Characters</span>
                      <span className="text-xs font-bold font-mono text-text-primary">{scriptChars}</span>
                    </div>
                    <div className="bg-surface-elevated p-2 rounded-xl border border-border-subtle text-center">
                      <span className="text-[10px] font-mono uppercase text-text-muted block">Est. Audio</span>
                      <span className="text-xs font-bold font-mono text-sky-400">{estSeconds}s</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
                      <FileText size={14} className="text-sky-400" />
                      Script Content Snapshot
                    </div>
                    <div className="bg-surface-panel border border-border-subtle rounded-xl p-4 text-xs font-mono text-text-primary max-h-[300px] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                      {activeVersion.script || "Empty script content."}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-text-muted text-sm">
                  Select a version to inspect.
                </div>
              )}

              {/* Restore Action */}
              {activeVersion && (
                <div className="pt-6 border-t border-border-subtle mt-6">
                  {confirmRestoreId === activeVersion.id ? (
                    <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl">
                      <span className="text-xs text-amber-200 flex-1 font-medium">
                        Confirm rollback to this snapshot?
                      </span>
                      <button
                        onClick={() => handleRestore(activeVersion.id)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 focus-ring cursor-pointer"
                      >
                        <Check size={13} />
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmRestoreId(null)}
                        className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors focus-ring"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRestoreId(activeVersion.id)}
                      className="w-full py-3 bg-surface-elevated hover:bg-sky-500/20 text-text-primary hover:text-sky-300 border border-border-subtle hover:border-sky-500/30 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 focus-ring cursor-pointer"
                    >
                      <RotateCcw size={14} className="text-sky-400" />
                      Rollback to this Revision
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

