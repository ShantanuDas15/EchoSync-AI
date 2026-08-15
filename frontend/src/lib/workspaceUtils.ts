export interface ProjectVersion {
  id: string;
  timestamp: string;
  script: string;
  summary: string;
  author?: string;
}

export interface Project {
  id: string;
  title: string;
  folderId: string | null;
  duration: string;
  lastModified: string;
  voices: string[];
  script: string;
  versions: ProjectVersion[];
  tags?: string[];
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  duration: string;
  voices: string[];
  category: string;
  defaultScript: string;
}

/**
 * Recursively find all descendant folder IDs for a given folder ID.
 */
export function findChildFolderIds(folders: Folder[], folderId: string): string[] {
  const directChildren = folders.filter((f) => f.parentId === folderId);
  const descendantIds: string[] = [];

  for (const child of directChildren) {
    descendantIds.push(child.id);
    const subDescendants = findChildFolderIds(folders, child.id);
    descendantIds.push(...subDescendants);
  }

  return descendantIds;
}

/**
 * Cascading folder deletion: Deletes the target folder, all its nested subfolders,
 * and all projects housed in any of those folders to prevent memory leaks and orphaned states.
 */
export function deleteFolderCascade(
  folders: Folder[],
  projects: Project[],
  folderId: string
): {
  updatedFolders: Folder[];
  updatedProjects: Project[];
  deletedFolderIds: string[];
  deletedProjectIds: string[];
} {
  const targetFolder = folders.find((f) => f.id === folderId);
  if (!targetFolder) {
    return {
      updatedFolders: [...folders],
      updatedProjects: [...projects],
      deletedFolderIds: [],
      deletedProjectIds: [],
    };
  }

  const childFolderIds = findChildFolderIds(folders, folderId);
  const allDeletedFolderIds = [folderId, ...childFolderIds];

  const updatedFolders = folders.filter((f) => !allDeletedFolderIds.includes(f.id));

  const deletedProjects = projects.filter(
    (p) => p.folderId !== null && allDeletedFolderIds.includes(p.folderId)
  );
  const deletedProjectIds = deletedProjects.map((p) => p.id);

  const updatedProjects = projects.filter(
    (p) => p.folderId === null || !allDeletedFolderIds.includes(p.folderId)
  );

  return {
    updatedFolders,
    updatedProjects,
    deletedFolderIds: allDeletedFolderIds,
    deletedProjectIds,
  };
}

/**
 * Move a project to a new target folder (or root if null).
 */
export function moveProjectToFolder(
  projects: Project[],
  projectId: string,
  targetFolderId: string | null
): Project[] {
  return projects.map((p) => {
    if (p.id === projectId) {
      return {
        ...p,
        folderId: targetFolderId,
        lastModified: new Date().toISOString().split('T')[0],
      };
    }
    return p;
  });
}

/**
 * Create a new revision checkpoint for a project.
 */
export function createRevision(
  project: Project,
  newScript: string,
  summary: string,
  author: string = 'User'
): Project {
  const newVersion: ProjectVersion = {
    id: `v${project.versions.length + 1}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    script: newScript,
    summary,
    author,
  };

  return {
    ...project,
    script: newScript,
    lastModified: new Date().toISOString().split('T')[0],
    versions: [newVersion, ...project.versions],
  };
}

/**
 * Rollback a project to a specific historical revision.
 */
export function rollbackRevision(project: Project, versionId: string): Project {
  const targetVersion = project.versions.find((v) => v.id === versionId);
  if (!targetVersion) {
    return project;
  }

  const rollbackRecord: ProjectVersion = {
    id: `v${project.versions.length + 1}-rollback`,
    timestamp: new Date().toISOString(),
    script: targetVersion.script,
    summary: `Restored to revision ${targetVersion.id} (${targetVersion.summary})`,
    author: 'System Rollback',
  };

  return {
    ...project,
    script: targetVersion.script,
    lastModified: new Date().toISOString().split('T')[0],
    versions: [rollbackRecord, ...project.versions],
  };
}
