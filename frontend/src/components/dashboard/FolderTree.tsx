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
      <div key={folder.id} className="flex flex-col select-none">
        <div
          onClick={() => onSelectFolder(folder.id)}
          className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
            isSelected
              ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {hasSubfolders ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(folder.id, e)}
                className="p-0.5 text-slate-500 hover:text-slate-300"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-3.5" />
            )}

            {isExpanded || isSelected ? (
              <FolderOpen size={15} className={isSelected ? 'text-indigo-400' : 'text-slate-400'} />
            ) : (
              <FolderIcon size={15} className={isSelected ? 'text-indigo-400' : 'text-slate-500'} />
            )}

            <span className="truncate">{folder.name}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-400 group-hover:text-slate-300">
              {count}
            </span>

            {/* Subfolder & Delete triggers */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setNewFolderParentId(folder.id);
                setShowNewFolderModal(true);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-indigo-300 transition-opacity"
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
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
              title="Delete folder and contents"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Render child subfolders */}
        {hasSubfolders && isExpanded && (
          <div className="flex flex-col mt-0.5 space-y-0.5">
            {subfolders.map((sub) => renderFolderItem(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 glass-panel rounded-2xl p-4 w-full">
      {/* Tree Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 text-slate-300">
          <Layers size={16} className="text-indigo-400" />
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
          className="flex items-center gap-1 text-[11px] font-medium bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded-lg transition-colors"
        >
          <FolderPlus size={12} />
          New Folder
        </button>
      </div>

      {/* Root Categories */}
      <div className="flex flex-col space-y-1">
        {/* All Projects */}
        <div
          onClick={() => onSelectFolder(null)}
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
            selectedFolderId === null
              ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers size={15} className={selectedFolderId === null ? 'text-indigo-400' : 'text-slate-400'} />
            <span>All Projects</span>
          </div>
          <span className="text-[10px] font-mono bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-400">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button
              onClick={() => setShowNewFolderModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
              <FolderPlus className="text-indigo-400" size={18} />
              {newFolderParentId ? 'Create Subfolder' : 'Create New Folder'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {newFolderParentId
                ? `Adding nested folder inside "${folders.find((f) => f.id === newFolderParentId)?.name}"`
                : 'Organize your scripts and audio synthesis projects'}
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Folder name (e.g. Podcasts 2026)"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-colors"
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
