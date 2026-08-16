"use client";

import React, { useState } from 'react';
import { Folder as FolderIcon, FolderPlus, FolderOpen, ChevronRight, ChevronDown, Trash2, Layers, Plus, X } from 'lucide-react';
import { Folder } from '@/lib/workspaceUtils';

interface FolderTreeProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onDeleteFolder: (folderId: string) => void;
  projectCounts: Record<string, number>;
  totalProjectsCount: number;
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
  projectCounts,
  totalProjectsCount,
}: FolderTreeProps) {
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([]);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);

  const toggleExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolderIds((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    );
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim(), newFolderParentId);
    setNewFolderName('');
    setNewFolderParentId(null);
    setShowNewFolderModal(false);
  };

  // Build tree hierarchy
  const rootFolders = folders.filter((f) => f.parentId === null);
  const getSubfolders = (parentId: string) => folders.filter((f) => f.parentId === parentId);

  const renderFolderItem = (folder: Folder, depth = 0) => {
    const isSelected = selectedFolderId === folder.id;
    const subfolders = getSubfolders(folder.id);
    const hasSubfolders = subfolders.length > 0;
    const isExpanded = expandedFolderIds.includes(folder.id);
    const count = projectCounts[folder.id] || 0;

    return (
      <div key={folder.id} className="flex flex-col select-none relative">
        <div
          onClick={() => onSelectFolder(folder.id)}
          className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150 relative ${
            isSelected
              ? 'bg-sky-500/15 text-text-primary border border-sky-500/30 shadow-sm font-semibold'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/60 border border-transparent'
          }`}
          style={{ paddingLeft: `${12 + depth * 14}px` }}
        >
          {isSelected && (
            <div className="absolute left-1 top-2 bottom-2 w-1 bg-sky-400 rounded-full" />
          )}

          <div className="flex items-center gap-2 min-w-0 flex-1">
            {hasSubfolders ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(folder.id, e)}
                className="p-0.5 text-text-muted hover:text-text-primary transition-colors focus-ring rounded"
                aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
              >
                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            ) : (
              <span className="w-3.5" />
            )}

            {isExpanded || isSelected ? (
              <FolderOpen size={15} className={isSelected ? 'text-sky-400' : 'text-text-muted'} />
            ) : (
              <FolderIcon size={15} className={isSelected ? 'text-sky-400' : 'text-text-muted'} />
            )}

            <span className="truncate tracking-tight">{folder.name}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
              isSelected ? 'bg-sky-500/20 text-sky-300 font-bold' : 'bg-surface-elevated text-text-muted group-hover:text-text-secondary'
            }`}>
              {count}
            </span>

            {/* Subfolder & Delete triggers on hover */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setNewFolderParentId(folder.id);
                  setShowNewFolderModal(true);
                }}
                className="p-1 text-text-muted hover:text-sky-300 hover:bg-surface-elevated rounded transition-colors focus-ring"
                title="Add subfolder"
              >
                <Plus size={12} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFolder(folder.id);
                }}
                className="p-1 text-text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors focus-ring"
                title="Delete folder and contents"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Render child subfolders with hierarchical guide line */}
        {hasSubfolders && isExpanded && (
          <div className="flex flex-col mt-0.5 space-y-0.5 border-l border-border-subtle/60 ml-4 pl-1">
            {subfolders.map((sub) => renderFolderItem(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 bg-surface-panel border border-border-subtle rounded-2xl p-4 w-full backdrop-blur-xl shadow-sm">
      {/* Tree Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2 text-text-secondary">
          <Layers size={16} className="text-sky-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider font-mono">
            Workspaces & Folders
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewFolderParentId(null);
            setShowNewFolderModal(true);
          }}
          className="flex items-center gap-1 text-[11px] font-medium bg-surface-elevated hover:bg-sky-500/20 text-text-secondary hover:text-sky-300 border border-border-subtle hover:border-sky-500/30 px-2.5 py-1 rounded-xl transition-all focus-ring"
        >
          <FolderPlus size={13} className="text-sky-400" />
          <span>New Folder</span>
        </button>
      </div>

      {/* Root Categories */}
      <div className="flex flex-col space-y-1">
        {/* All Projects Item */}
        <div
          onClick={() => onSelectFolder(null)}
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150 relative ${
            selectedFolderId === null
              ? 'bg-sky-500/15 text-text-primary border border-sky-500/30 shadow-sm font-semibold'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/60 border border-transparent'
          }`}
        >
          {selectedFolderId === null && (
            <div className="absolute left-1 top-2 bottom-2 w-1 bg-sky-400 rounded-full" />
          )}
          <div className="flex items-center gap-2">
            <Layers size={15} className={selectedFolderId === null ? 'text-sky-400' : 'text-text-muted'} />
            <span className="tracking-tight">All Projects</span>
          </div>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
            selectedFolderId === null ? 'bg-sky-500/20 text-sky-300 font-bold' : 'bg-surface-elevated text-text-muted'
          }`}>
            {totalProjectsCount}
          </span>
        </div>

        {/* Folders Hierarchical Tree */}
        <div className="pt-1 flex flex-col space-y-0.5">
          {rootFolders.map((folder) => renderFolderItem(folder, 0))}
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-surface-panel border border-border-elevated rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button
              onClick={() => setShowNewFolderModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors focus-ring rounded-lg p-1"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
                <FolderPlus size={18} />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">
                {newFolderParentId ? 'Create Subfolder' : 'Create New Folder'}
              </h3>
            </div>
            
            <p className="text-xs text-text-muted mb-4 pl-0.5">
              {newFolderParentId
                ? `Adding nested folder inside "${folders.find((f) => f.id === newFolderParentId)?.name}"`
                : 'Organize your scripts and neural audio projects'}
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Folder name (e.g. Podcasts Season 2)"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  className="w-full bg-surface-elevated border border-border-subtle focus:border-sky-500/60 rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-xl transition-colors focus-ring"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl shadow-lg shadow-sky-500/20 disabled:opacity-50 transition-colors focus-ring"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
