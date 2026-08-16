"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  List,
  Filter,
  X,
  Play,
  ArrowUpDown,
  History,
  Trash2,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers
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

// Curated Quick-Start Production Templates
const STARTER_TEMPLATES: Template[] = [
  {
    id: 'tpl-1',
    title: 'Two-Host Dialogue Podcast',
    description: 'Dynamic conversational banter template with alternating host and guest voices and natural cadence pacing.',
    duration: '2m 15s',
    voices: ['Sarah (Broadcast)', 'James (Podcast)'],
    category: 'Podcast',
    defaultScript: 'Host: Welcome back to Deep Dive AI!\nGuest: Great to be here. What are we exploring today?',
  },
  {
    id: 'tpl-2',
    title: 'Documentary Nature Narration',
    description: 'Deep, cinematic voice styling with SSML soft pauses and atmospheric cadence.',
    duration: '1m 40s',
    voices: ['Marcus (Gaming)'],
    category: 'Narrative',
    defaultScript: 'Deep within the ancient rainforest, silence is not an absence of sound, but a symphony of life.',
  },
  {
    id: 'tpl-3',
    title: 'High-Energy Commercial Ad Spot',
    description: 'Fast-paced, high dynamic range pitch modulation tailored for consumer audio promos.',
    duration: '30s',
    voices: ['Sarah (Broadcast)'],
    category: 'Commercial',
    defaultScript: 'Unleash your true creative potential with EchoSync AI. Next-generation neural voice streaming.',
  },
  {
    id: 'tpl-4',
    title: 'Audiobook Chapter Intro',
    description: 'Warm character voice profiles with expressive chapter transitions and emotional timbre.',
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'duration'>('recent');
  
  // Modals & Drawers
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectFolderId, setNewProjectFolderId] = useState<string | null>(null);
  const [selectedStarterTemplateId, setSelectedStarterTemplateId] = useState<string | null>(null);
  const [activeRevisionProject, setActiveRevisionProject] = useState<Project | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcut for Search ('/' key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Filtered and Sorted Projects
  const filteredProjects = useMemo(() => {
    const matched = projects.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.script.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.voices.some((v) => v.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFolder =
        selectedFolderId === null || p.folderId === selectedFolderId;

      return matchesSearch && matchesFolder;
    });

    return matched.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'duration') {
        return a.duration.localeCompare(b.duration);
      }
      return 0;
    });
  }, [projects, searchQuery, selectedFolderId, sortBy]);

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
      tags: ['New'],
    };
    setProjects((prev) => [newProject, ...prev]);
    setShowNewProjectModal(false);
    setNewProjectTitle('');
    setSelectedStarterTemplateId(null);
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
      totalRenderedMin: (21.5 + totalProjects * 3.2).toFixed(1),
    };
  }, [projects]);

  const currentFolderName = folders.find((f) => f.id === selectedFolderId)?.name;

  return (
    <main className="min-h-screen bg-surface-root flex flex-col font-sans text-text-primary selection:bg-sky-500/30">
      <NavigationHeader activeTab="dashboard" />

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
        
        {/* Top Header & Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary flex items-center gap-3">
              Workspace & Projects
            </h1>
            <p className="text-text-secondary mt-1 text-sm">
              Manage multi-track storyboards, neural voice assets, and historical project revisions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setNewProjectFolderId(selectedFolderId);
                setShowNewProjectModal(true);
              }}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 px-5 py-2.5 rounded-xl transition-all font-semibold shadow-lg shadow-sky-500/20 active:scale-[0.98] focus-ring cursor-pointer"
            >
              <Plus size={18} /> 
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Projects */}
          <div className="bg-surface-panel border border-border-subtle hover:border-border-elevated rounded-2xl p-4.5 flex flex-col justify-between transition-all backdrop-blur-xl shadow-sm group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-text-muted font-medium uppercase font-mono tracking-wider">
                Total Projects
              </span>
              <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
                <FileAudio size={18} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold font-mono text-text-primary tracking-tight">
                {stats.totalProjects}
              </div>
              <span className="text-[11px] font-mono text-text-muted">
                {folders.length} folders
              </span>
            </div>
          </div>

          {/* Audio Rendered */}
          <div className="bg-surface-panel border border-border-subtle hover:border-border-elevated rounded-2xl p-4.5 flex flex-col justify-between transition-all backdrop-blur-xl shadow-sm group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-text-muted font-medium uppercase font-mono tracking-wider">
                Audio Rendered
              </span>
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                <Clock size={18} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
                {stats.totalRenderedMin} <span className="text-xs font-normal text-text-muted">mins</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400/80 flex items-center gap-1">
                <TrendingUp size={12} /> Live RTF
              </span>
            </div>
          </div>

          {/* Active Voice Profiles */}
          <div className="bg-surface-panel border border-border-subtle hover:border-border-elevated rounded-2xl p-4.5 flex flex-col justify-between transition-all backdrop-blur-xl shadow-sm group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-text-muted font-medium uppercase font-mono tracking-wider">
                Active Voices
              </span>
              <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
                <Users size={18} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold font-mono text-text-primary tracking-tight">
                {stats.totalVoices}
              </div>
              <span className="text-[11px] font-mono text-text-muted">
                256-d embeddings
              </span>
            </div>
          </div>

          {/* Storage & Cloud Cache */}
          <div className="bg-surface-panel border border-border-subtle hover:border-border-elevated rounded-2xl p-4.5 flex flex-col justify-between transition-all backdrop-blur-xl shadow-sm group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-text-muted font-medium uppercase font-mono tracking-wider">
                Edge Cache Storage
              </span>
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                <HardDrive size={18} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold font-mono text-amber-300 tracking-tight">
                {stats.storageUsedMb} <span className="text-xs font-normal text-text-muted">MB</span>
              </div>
              <span className="text-[11px] font-mono text-text-muted">
                Edge Synced
              </span>
            </div>
          </div>
        </div>

        {/* Quick-Start Templates Showcase */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-secondary">
              <Sparkles size={16} className="text-sky-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider font-mono">
                Curated Starter Templates
              </h2>
            </div>
            <span className="text-xs text-text-muted">Click to instant-clone into workspace</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STARTER_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => handleCreateFromTemplate(tpl)}
                className="group p-4.5 bg-surface-panel hover:bg-surface-panel/90 border border-border-subtle hover:border-sky-500/40 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md backdrop-blur-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-surface-elevated text-sky-300 border border-border-subtle">
                      {tpl.category}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted flex items-center gap-1">
                      <Clock size={10} />
                      {tpl.duration}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-text-primary group-hover:text-sky-300 transition-colors mb-1 tracking-tight">
                    {tpl.title}
                  </h3>
                  <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">{tpl.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-sky-400 group-hover:text-sky-300">
                  <span className="text-[11px] font-medium">Clone Template</span>
                  <Plus size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Main Workspace Area: Sidebar Folders + Project Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Hierarchical Folder Tree */}
          <div className="lg:col-span-4 xl:col-span-3 sticky top-20">
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

          {/* Right Column: Search Toolbar & Project Explorer */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
            
            {/* Unified Explorer Toolbar */}
            <div className="bg-surface-panel border border-border-subtle p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center backdrop-blur-xl shadow-sm">
              
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search projects by title, voice, or script... (Press '/' to focus)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-elevated border border-border-subtle focus:border-sky-500/60 rounded-xl pl-9.5 pr-8 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 transition-colors focus-ring rounded"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* View Toggles & Sort */}
              <div className="flex items-center gap-2 justify-between sm:justify-end flex-wrap">
                
                {/* Active Folder Filter Tag */}
                <div className="flex items-center gap-1.5 text-xs text-text-muted font-mono">
                  <span className="text-text-primary font-semibold">
                    {currentFolderName || 'All Projects'}
                  </span>
                  <span>({filteredProjects.length})</span>
                  {selectedFolderId && (
                    <button
                      onClick={() => setSelectedFolderId(null)}
                      className="ml-1 text-[10px] text-sky-400 hover:text-sky-300 underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="h-4 w-px bg-border-subtle hidden sm:block mx-1" />

                {/* Sort Selector */}
                <div className="flex items-center gap-1.5 bg-surface-elevated px-2.5 py-1.5 rounded-xl border border-border-subtle text-xs text-text-secondary">
                  <ArrowUpDown size={13} className="text-text-muted" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-text-secondary text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="title">Title (A-Z)</option>
                    <option value="duration">Duration</option>
                  </select>
                </div>

                {/* View Mode Toggle (Grid vs List) */}
                <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-xl border border-border-subtle">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors focus-ring ${
                      viewMode === 'grid'
                        ? 'bg-sky-500/20 text-sky-300 shadow-sm'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                    title="Grid View"
                  >
                    <Grid size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors focus-ring ${
                      viewMode === 'list'
                        ? 'bg-sky-500/20 text-sky-300 shadow-sm'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                    title="List View"
                  >
                    <List size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Projects Explorer Display */}
            {filteredProjects.length === 0 ? (
              <div className="flex-1 min-h-[320px] flex flex-col items-center justify-center text-text-muted bg-surface-panel border border-border-subtle rounded-2xl p-8 text-center backdrop-blur-xl">
                <FileAudio size={44} className="mb-3 opacity-30 text-sky-400" />
                <h4 className="text-sm font-semibold text-text-primary mb-1">No synthesis projects found</h4>
                <p className="text-xs text-text-secondary max-w-sm mb-5 leading-relaxed">
                  {searchQuery
                    ? 'No projects match your current search query. Try searching with different keywords.'
                    : 'Create your first project or clone one of the curated starter templates above.'}
                </p>
                <button
                  onClick={() => {
                    setNewProjectFolderId(selectedFolderId);
                    setShowNewProjectModal(true);
                  }}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-semibold shadow-lg shadow-sky-500/20 transition-colors focus-ring cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid View */
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
            ) : (
              /* List / Table View */
              <div className="bg-surface-panel border border-border-subtle rounded-2xl overflow-hidden backdrop-blur-xl shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border-subtle bg-surface-elevated/50 text-[11px] font-mono uppercase tracking-wider text-text-muted">
                        <th className="py-3 px-4 font-medium">Project</th>
                        <th className="py-3 px-4 font-medium">Folder</th>
                        <th className="py-3 px-4 font-medium">Duration</th>
                        <th className="py-3 px-4 font-medium">Voices</th>
                        <th className="py-3 px-4 font-medium">Revisions</th>
                        <th className="py-3 px-4 font-medium">Modified</th>
                        <th className="py-3 px-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {filteredProjects.map((p) => {
                        const folder = folders.find((f) => f.id === p.folderId);
                        return (
                          <tr
                            key={p.id}
                            className="group hover:bg-surface-elevated/40 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="font-semibold text-text-primary hover:text-sky-300 cursor-pointer" onClick={() => router.push('/')}>
                                {p.title}
                              </div>
                              <div className="text-[11px] text-text-muted truncate max-w-xs mt-0.5">
                                {p.script}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-text-muted font-mono">
                              {folder ? (
                                <span className="inline-flex items-center gap-1 bg-surface-elevated px-2 py-0.5 rounded text-[10px] text-text-secondary border border-border-subtle">
                                  <FolderIcon size={10} className="text-sky-400" />
                                  {folder.name}
                                </span>
                              ) : (
                                <span className="text-[10px] text-text-muted">Root</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-text-secondary font-mono">
                              {p.duration}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1 flex-wrap">
                                {p.voices.map((v) => (
                                  <span key={v} className="text-[10px] bg-surface-elevated text-text-secondary px-1.5 py-0.5 rounded border border-border-subtle">
                                    {v}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => setActiveRevisionProject(p)}
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-text-muted hover:text-sky-300 bg-surface-elevated px-2 py-0.5 rounded border border-border-subtle transition-colors focus-ring"
                              >
                                <History size={11} className="text-sky-400" />
                                v{p.versions.length}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-text-muted font-mono text-[11px]">
                              {p.lastModified}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => router.push('/')}
                                  className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 rounded-lg border border-sky-500/30 transition-all focus-ring"
                                  title="Open in Studio"
                                >
                                  <Play size={12} className="fill-sky-400 text-sky-400" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProject(p.id)}
                                  className="p-1.5 text-text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors focus-ring"
                                  title="Delete Project"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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

      {/* Production-Grade New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-surface-panel border border-border-elevated rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => {
                setShowNewProjectModal(false);
                setSelectedStarterTemplateId(null);
              }}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors focus-ring rounded-lg p-1"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
                <Plus size={18} />
              </div>
              <h3 className="text-base font-semibold text-text-primary">
                Create New Project
              </h3>
            </div>
            
            <p className="text-xs text-text-muted mb-4 pl-0.5">
              Initialize a project for multi-track dialogue storyboarding and neural synthesis.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const template = STARTER_TEMPLATES.find((t) => t.id === selectedStarterTemplateId);
                handleCreateProject(
                  newProjectTitle,
                  newProjectFolderId,
                  template ? template.defaultScript : ''
                );
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Project Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. AI Innovations Episode 4"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  autoFocus
                  className="w-full bg-surface-elevated border border-border-subtle focus:border-sky-500/60 rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Target Workspace Folder
                </label>
                <select
                  value={newProjectFolderId || ''}
                  onChange={(e) => setNewProjectFolderId(e.target.value ? e.target.value : null)}
                  className="w-full bg-surface-elevated border border-border-subtle focus:border-sky-500/60 rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="">Root (No Folder)</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Starter Template Pre-select Chips */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Starter Template (Optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STARTER_TEMPLATES.map((tpl) => {
                    const isSelected = selectedStarterTemplateId === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedStarterTemplateId(null);
                          } else {
                            setSelectedStarterTemplateId(tpl.id);
                            if (!newProjectTitle) setNewProjectTitle(tpl.title);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-sky-500/15 border-sky-500/40 text-text-primary font-medium shadow-sm'
                            : 'bg-surface-elevated/40 border-border-subtle text-text-muted hover:border-border-elevated hover:text-text-secondary'
                        }`}
                      >
                        <div className="font-medium truncate">{tpl.category}</div>
                        <div className="text-[10px] text-text-muted truncate">{tpl.duration}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-xl transition-colors focus-ring"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjectTitle.trim()}
                  className="px-5 py-2 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl shadow-lg shadow-sky-500/20 disabled:opacity-50 transition-colors focus-ring cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
