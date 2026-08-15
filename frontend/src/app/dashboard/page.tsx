"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Folder as FolderIcon,
  Search,
  Plus,
  Radio,
  FileAudio,
  Sparkles,
  Zap,
  Mic,
  Clock,
  HardDrive,
  Users,
  Grid,
  Filter,
  X,
  Play
} from 'lucide-react';
import { NavigationHeader } from '@/components/layout/NavigationHeader';
import { KeyboardShortcutFooter } from '@/components/layout/KeyboardShortcutFooter';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { FolderTree } from '@/components/dashboard/FolderTree';
import { RevisionsDrawer } from '@/components/dashboard/RevisionsDrawer';
import {
  Project,
  Folder,
  Template,
  deleteFolderCascade,
  moveProjectToFolder,
  createRevision,
  rollbackRevision,
} from '@/lib/workspaceUtils';

// Mock Quick-Start Templates
const STARTER_TEMPLATES: Template[] = [
  {
    id: 'tpl-1',
    title: 'Two-Host Dialogue Podcast',
    description: 'Banter template with alternating host and guest voices and audio pacing pauses.',
    duration: '2m 15s',
    voices: ['Sarah (Broadcast)', 'James (Podcast)'],
    category: 'Podcast',
    defaultScript: 'Host: Welcome back to Deep Dive AI!\nGuest: Great to be here. What are we exploring today?',
  },
  {
    id: 'tpl-2',
    title: 'Documentary Nature Narration',
    description: 'Deep, cinematic voice styling with SSML soft pauses and calm pacing.',
    duration: '1m 40s',
    voices: ['Marcus (Gaming)'],
    category: 'Narrative',
    defaultScript: 'Deep within the ancient rainforest, silence is not an absence of sound, but a symphony of life.',
  },
  {
    id: 'tpl-3',
    title: 'High-Energy Commercial Ad Spot',
    description: 'Fast-paced, high dynamic range pitch modulation for consumer audio promos.',
    duration: '30s',
    voices: ['Sarah (Broadcast)'],
    category: 'Commercial',
    defaultScript: 'Unleash your true creative potential with EchoSync AI. Next-generation neural voice streaming.',
  },
  {
    id: 'tpl-4',
    title: 'Audiobook Chapter Intro',
    description: 'Warm character voice profiles with expressive chapter transitions.',
    duration: '3m 10s',
    voices: ['Alice (Narrative)', 'James (Podcast)'],
    category: 'Audiobook',
    defaultScript: 'Chapter One. The morning mist clung to the cobblestones of the sleeping city.',
  },
];

// Initial mock folders
const INITIAL_FOLDERS: Folder[] = [
  { id: 'f-1', name: 'Podcasts & Shows', parentId: null },
  { id: 'f-2', name: 'Season 1 Episodes', parentId: 'f-1' },
  { id: 'f-3', name: 'Commercial Campaigns', parentId: null },
  { id: 'f-4', name: 'Audiobook Series', parentId: null },
];

// Initial mock projects
const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'EchoSync AI Launch Podcast Ep. 1',
    folderId: 'f-2',
    duration: '12m 45s',
    lastModified: '2026-08-14',
    voices: ['Sarah (Broadcast)', 'James (Podcast)'],
    script: 'Welcome to episode one of the EchoSync AI podcast where we discuss zero-shot speech synthesis.',
    versions: [
      {
        id: 'v2-9a8b',
        timestamp: '2026-08-14T18:20:00Z',
        script: 'Welcome to episode one of the EchoSync AI podcast where we discuss zero-shot speech synthesis.',
        summary: 'Added intro pause tag and guest audio block',
        author: 'Shantanu',
      },
      {
        id: 'v1-1c2d',
        timestamp: '2026-08-14T15:00:00Z',
        script: 'Welcome to episode one of our podcast.',
        summary: 'Initial draft',
        author: 'Shantanu',
      },
    ],
    tags: ['Podcast', 'Ep1'],
  },
  {
    id: 'proj-2',
    title: 'Summer Sale Radio Spot 30s',
    folderId: 'f-3',
    duration: '0m 30s',
    lastModified: '2026-08-13',
    voices: ['Sarah (Broadcast)'],
    script: 'Don’t miss our biggest summer sale event! Up to 50 percent off starting this Friday only.',
    versions: [
      {
        id: 'v1-3e4f',
        timestamp: '2026-08-13T10:15:00Z',
        script: 'Don’t miss our biggest summer sale event! Up to 50 percent off starting this Friday only.',
        summary: 'Final client approved script',
        author: 'Shantanu',
      },
    ],
    tags: ['Ad', 'Promo'],
  },
  {
    id: 'proj-3',
    title: 'The Silent Horizon - Chapter 1',
    folderId: 'f-4',
    duration: '8m 20s',
    lastModified: '2026-08-12',
    voices: ['Alice (Narrative)', 'Marcus (Gaming)'],
    script: 'The stars shone with an unnatural luminescence as the explorer opened the ancient gate.',
    versions: [
      {
        id: 'v1-5g6h',
        timestamp: '2026-08-12T09:00:00Z',
        script: 'The stars shone with an unnatural luminescence as the explorer opened the ancient gate.',
        summary: 'Imported manuscript text',
        author: 'Shantanu',
      },
    ],
    tags: ['Sci-Fi', 'Audiobook'],
  },
];

export default function WorkspaceDashboardPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>(INITIAL_FOLDERS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Drawers
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectFolderId, setNewProjectFolderId] = useState<string | null>(null);
  const [activeRevisionProject, setActiveRevisionProject] = useState<Project | null>(null);

  // Folder Counts mapping
  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of projects) {
      if (p.folderId) {
        counts[p.folderId] = (counts[p.folderId] || 0) + 1;
      }
    }
    return counts;
  }, [projects]);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.script.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.voices.some((v) => v.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFolder =
        selectedFolderId === null || p.folderId === selectedFolderId;

      return matchesSearch && matchesFolder;
    });
  }, [projects, searchQuery, selectedFolderId]);

  // Handle Folder Actions
  const handleCreateFolder = (name: string, parentId: string | null) => {
    const newFolder: Folder = {
      id: `f-${Date.now()}`,
      name,
      parentId,
    };
    setFolders((prev) => [...prev, newFolder]);
  };

  const handleDeleteFolder = (folderId: string) => {
    const target = folders.find((f) => f.id === folderId);
    if (!target) return;

    if (
      confirm(
        `Are you sure you want to delete folder "${target.name}"? This will delete all subfolders and project files within it.`
      )
    ) {
      const result = deleteFolderCascade(folders, projects, folderId);
      setFolders(result.updatedFolders);
      setProjects(result.updatedProjects);
      if (selectedFolderId === folderId || result.deletedFolderIds.includes(selectedFolderId || '')) {
        setSelectedFolderId(null);
      }
    }
  };

  // Handle Project Actions
  const handleCreateProject = (title: string, folderId: string | null, defaultScript = '') => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      title: title.trim() || 'Untitled Project',
      folderId,
      duration: '0m 00s',
      lastModified: new Date().toISOString().split('T')[0],
      voices: ['Sarah (Broadcast)'],
      script: defaultScript,
      versions: [
        {
          id: `v1-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: new Date().toISOString(),
          script: defaultScript,
          summary: 'Project initialized',
          author: 'User',
        },
      ],
    };
    setProjects((prev) => [newProject, ...prev]);
    setShowNewProjectModal(false);
    setNewProjectTitle('');
  };

  const handleCreateFromTemplate = (template: Template) => {
    handleCreateProject(template.title, selectedFolderId, template.defaultScript);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  const handleMoveProject = (projectId: string, targetFolderId: string | null) => {
    setProjects((prev) => moveProjectToFolder(prev, projectId, targetFolderId));
  };

  const handleRestoreRevision = (projectId: string, versionId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const updated = rollbackRevision(p, versionId);
          setActiveRevisionProject(updated);
          return updated;
        }
        return p;
      })
    );
  };

  // Overall Usage Stats Calculations
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const totalVoices = new Set(projects.flatMap((p) => p.voices)).size;
    return {
      totalProjects,
      totalVoices: Math.max(totalVoices, 4),
      storageUsedMb: (totalProjects * 18.5).toFixed(1),
      totalRenderedMin: 21.5 + totalProjects * 3.2,
    };
  }, [projects]);

  const currentFolderName = folders.find((f) => f.id === selectedFolderId)?.name;

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-200">
      <NavigationHeader activeTab="dashboard" />

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Workspace Title & Stats Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-light text-slate-100 tracking-tight flex items-center gap-3">
              Workspace & Projects
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Manage non-linear timelines, historical synthesis projects, and team folders
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setNewProjectFolderId(selectedFolderId);
                setShowNewProjectModal(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl transition-all font-medium shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
            >
              <Plus size={18} /> New Project
            </button>
          </div>
        </div>

        {/* Metric Usage Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <FileAudio size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Total Projects</div>
              <div className="text-xl font-bold text-white font-mono">{stats.totalProjects}</div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Audio Rendered</div>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                {stats.totalRenderedMin.toFixed(1)} <span className="text-xs text-slate-400">mins</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-400">
              <Users size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Active Voices</div>
              <div className="text-xl font-bold text-violet-300 font-mono">{stats.totalVoices}</div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
              <HardDrive size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Storage Consumed</div>
              <div className="text-xl font-bold text-amber-300 font-mono">
                {stats.storageUsedMb} <span className="text-xs text-slate-400">MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick-Start Templates Carousel/Grid */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles size={16} className="text-indigo-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider font-mono">
              Quick-Start Templates
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STARTER_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => handleCreateFromTemplate(tpl)}
                className="group p-4 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl cursor-pointer transition-all flex flex-col justify-between shadow-sm hover:shadow-indigo-500/10"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700/50">
                      {tpl.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{tpl.duration}</span>
                  </div>

                  <h3 className="text-sm font-medium text-slate-200 group-hover:text-indigo-300 transition-colors mb-1">
                    {tpl.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{tpl.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between text-xs text-indigo-400 group-hover:text-indigo-300">
                  <span className="text-[11px] font-medium">Use Template</span>
                  <Plus size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Workspace Area (Sidebar Folders + Project Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
          {/* Left Column: Hierarchical Folder Tree */}
          <div className="lg:col-span-4 xl:col-span-3">
            <FolderTree
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onCreateFolder={handleCreateFolder}
              onDeleteFolder={handleDeleteFolder}
              projectCounts={projectCounts}
              totalProjectsCount={projects.length}
            />
          </div>

          {/* Right Column: Search Toolbar & Project Grid */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
            {/* Toolbar */}
            <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Search projects by title, voice, or script..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-xs text-slate-400 font-mono">
                  {currentFolderName ? (
                    <span className="text-indigo-300 font-semibold">{currentFolderName}</span>
                  ) : (
                    'All Projects'
                  )}{' '}
                  ({filteredProjects.length})
                </span>

                {selectedFolderId && (
                  <button
                    onClick={() => setSelectedFolderId(null)}
                    className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <X size={12} /> Clear Filter
                  </button>
                )}
              </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
              <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center text-slate-500 glass-panel rounded-2xl p-8 text-center">
                <FileAudio size={44} className="mb-3 opacity-20 text-indigo-400" />
                <h4 className="text-sm font-medium text-slate-300 mb-1">No synthesis projects found</h4>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  {searchQuery
                    ? 'No projects match your current search query.'
                    : 'Create your first project or start from one of our quick-start templates above.'}
                </p>
                <button
                  onClick={() => {
                    setNewProjectFolderId(selectedFolderId);
                    setShowNewProjectModal(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-colors"
                >
                  Create Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    folders={folders}
                    folderName={folders.find((f) => f.id === project.folderId)?.name}
                    onOpenProject={() => router.push('/')}
                    onViewRevisions={(p) => setActiveRevisionProject(p)}
                    onDeleteProject={handleDeleteProject}
                    onMoveProject={handleMoveProject}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <KeyboardShortcutFooter />

      {/* History / Revisions Drawer */}
      <RevisionsDrawer
        project={activeRevisionProject}
        isOpen={Boolean(activeRevisionProject)}
        onClose={() => setActiveRevisionProject(null)}
        onRestoreRevision={handleRestoreRevision}
      />

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowNewProjectModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
              <Plus className="text-indigo-400" size={18} />
              Create New Synthesis Project
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Initialize a project for multi-track audio storyboarding and neural synthesis.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateProject(newProjectTitle, newProjectFolderId);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. AI Innovations Episode 4"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Folder Destination
                </label>
                <select
                  value={newProjectFolderId || ''}
                  onChange={(e) => setNewProjectFolderId(e.target.value ? e.target.value : null)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Root (No Folder)</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjectTitle.trim()}
                  className="px-5 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
