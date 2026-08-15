"use client";

import React, { useState } from 'react';
import { History, X, RotateCcw, Check, FileText, Clock, User, ArrowLeftRight } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-400">
                <History size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Revision History</h2>
                <p className="text-xs text-slate-400 font-mono truncate max-w-md">
                  Project: {project.title}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body: Split View (Timeline List + Script Inspector) */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800">
            {/* Version List (Left Side) */}
            <div className="md:col-span-5 p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-140px)]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 px-2 mb-2">
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
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-slate-100 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-semibold text-indigo-300">
                        {ver.id.split('-')[0]}
                      </span>
                      {isLatest && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Current
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-1 mb-2 font-medium">
                      {ver.summary}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
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
            <div className="md:col-span-7 p-6 flex flex-col justify-between bg-slate-950/30">
              {activeVersion ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">
                        {activeVersion.summary}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Saved: {new Date(activeVersion.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <FileText size={14} className="text-indigo-400" />
                      Script Content Snapshot
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 max-h-[350px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {activeVersion.script || "Empty script content."}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  Select a version to inspect.
                </div>
              )}

              {/* Restore Action */}
              {activeVersion && (
                <div className="pt-6 border-t border-slate-800 mt-6">
                  {confirmRestoreId === activeVersion.id ? (
                    <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                      <span className="text-xs text-amber-200 flex-1">
                        Confirm rollback to this snapshot?
                      </span>
                      <button
                        onClick={() => handleRestore(activeVersion.id)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Check size={13} />
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmRestoreId(null)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRestoreId(activeVersion.id)}
                      className="w-full py-3 bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-slate-700 hover:border-indigo-500/50 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={14} />
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
