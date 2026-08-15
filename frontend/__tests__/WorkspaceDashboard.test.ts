import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  Folder,
  Project,
  findChildFolderIds,
  deleteFolderCascade,
  moveProjectToFolder,
  createRevision,
  rollbackRevision,
} from '../src/lib/workspaceUtils';

describe('Milestone 2.3: Workspace Dashboard & Hierarchical Project State Gateway', () => {
  // Sample Folder Structure:
  // Root A (f1) -> Sub A1 (f2) -> Sub A1-Deep (f3)
  // Root B (f4)
  const mockFolders: Folder[] = [
    { id: 'f1', name: 'Root A', parentId: null },
    { id: 'f2', name: 'Sub A1', parentId: 'f1' },
    { id: 'f3', name: 'Sub A1-Deep', parentId: 'f2' },
    { id: 'f4', name: 'Root B', parentId: null },
  ];

  const mockProjects: Project[] = [
    {
      id: 'p1',
      title: 'Project in Root A',
      folderId: 'f1',
      duration: '1m',
      lastModified: '2026-08-01',
      voices: ['Sarah'],
      script: 'Initial script A',
      versions: [],
    },
    {
      id: 'p2',
      title: 'Project in Sub A1',
      folderId: 'f2',
      duration: '2m',
      lastModified: '2026-08-02',
      voices: ['James'],
      script: 'Initial script A1',
      versions: [],
    },
    {
      id: 'p3',
      title: 'Project in Deep Sub A1-Deep',
      folderId: 'f3',
      duration: '3m',
      lastModified: '2026-08-03',
      voices: ['Marcus'],
      script: 'Initial script deep',
      versions: [],
    },
    {
      id: 'p4',
      title: 'Project in Root B',
      folderId: 'f4',
      duration: '4m',
      lastModified: '2026-08-04',
      voices: ['Alice'],
      script: 'Initial script B',
      versions: [],
    },
    {
      id: 'p5',
      title: 'Project in Root (No Folder)',
      folderId: null,
      duration: '5m',
      lastModified: '2026-08-05',
      voices: ['Sarah'],
      script: 'Initial script root',
      versions: [],
    },
  ];

  test('Tree Traversal: Recursively finds all descendant folder IDs in multi-tier hierarchy', () => {
    // Descendants of Root A (f1) should be f2 and f3
    const descendantsF1 = findChildFolderIds(mockFolders, 'f1');
    assert.equal(descendantsF1.length, 2);
    assert.ok(descendantsF1.includes('f2'));
    assert.ok(descendantsF1.includes('f3'));

    // Descendants of Sub A1 (f2) should be f3
    const descendantsF2 = findChildFolderIds(mockFolders, 'f2');
    assert.equal(descendantsF2.length, 1);
    assert.equal(descendantsF2[0], 'f3');

    // Leaf folder has 0 descendants
    const descendantsF3 = findChildFolderIds(mockFolders, 'f3');
    assert.equal(descendantsF3.length, 0);

    // Root B (f4) has 0 descendants
    const descendantsF4 = findChildFolderIds(mockFolders, 'f4');
    assert.equal(descendantsF4.length, 0);
  });

  test('Cascading Deletion: Deleting parent folder cascades to child folders and descendant projects', () => {
    // Delete f1 (Root A)
    const result = deleteFolderCascade(mockFolders, mockProjects, 'f1');

    // Check Deleted Folders
    assert.equal(result.deletedFolderIds.length, 3);
    assert.ok(result.deletedFolderIds.includes('f1'));
    assert.ok(result.deletedFolderIds.includes('f2'));
    assert.ok(result.deletedFolderIds.includes('f3'));

    // Check Updated Folders remaining
    assert.equal(result.updatedFolders.length, 1);
    assert.equal(result.updatedFolders[0].id, 'f4');

    // Check Deleted Projects (p1, p2, p3 were in f1, f2, f3)
    assert.equal(result.deletedProjectIds.length, 3);
    assert.ok(result.deletedProjectIds.includes('p1'));
    assert.ok(result.deletedProjectIds.includes('p2'));
    assert.ok(result.deletedProjectIds.includes('p3'));

    // Remaining projects should be p4 (in f4) and p5 (in root null)
    assert.equal(result.updatedProjects.length, 2);
    assert.ok(result.updatedProjects.some((p) => p.id === 'p4'));
    assert.ok(result.updatedProjects.some((p) => p.id === 'p5'));
  });

  test('Cascading Deletion: Gracefully handles non-existent folder ID with no mutations', () => {
    const result = deleteFolderCascade(mockFolders, mockProjects, 'non-existent-id');
    assert.equal(result.deletedFolderIds.length, 0);
    assert.equal(result.deletedProjectIds.length, 0);
    assert.equal(result.updatedFolders.length, mockFolders.length);
    assert.equal(result.updatedProjects.length, mockProjects.length);
  });

  test('Project Relocation: Moving project between folders updates folderId cleanly', () => {
    // Move p1 from f1 to f4
    const updated = moveProjectToFolder(mockProjects, 'p1', 'f4');
    const p1 = updated.find((p) => p.id === 'p1');
    assert.equal(p1?.folderId, 'f4');

    // Move p1 to root (null)
    const movedToRoot = moveProjectToFolder(mockProjects, 'p1', null);
    const p1Root = movedToRoot.find((p) => p.id === 'p1');
    assert.equal(p1Root?.folderId, null);
  });

  test('Revisions Management: Creating revision snapshot updates script and adds version record', () => {
    const baseProject = mockProjects[0];
    const updated = createRevision(
      baseProject,
      'Updated script content v2',
      'Added dramatic intro',
      'Lead Editor'
    );

    assert.equal(updated.script, 'Updated script content v2');
    assert.equal(updated.versions.length, 1);
    assert.equal(updated.versions[0].summary, 'Added dramatic intro');
    assert.equal(updated.versions[0].author, 'Lead Editor');
    assert.equal(updated.versions[0].script, 'Updated script content v2');
  });

  test('Revisions Rollback: Restoring previous revision recovers historical script state', () => {
    const projectWithHistory: Project = {
      ...mockProjects[0],
      script: 'Current modified script v3',
      versions: [
        {
          id: 'v3-test',
          timestamp: '2026-08-03T10:00:00Z',
          script: 'Current modified script v3',
          summary: 'Latest draft',
          author: 'Editor',
        },
        {
          id: 'v2-test',
          timestamp: '2026-08-02T10:00:00Z',
          script: 'Stable approved script v2',
          summary: 'Client approved draft',
          author: 'Producer',
        },
        {
          id: 'v1-test',
          timestamp: '2026-08-01T10:00:00Z',
          script: 'First rough draft v1',
          summary: 'First draft',
          author: 'Writer',
        },
      ],
    };

    // Rollback to v2
    const restored = rollbackRevision(projectWithHistory, 'v2-test');

    assert.equal(restored.script, 'Stable approved script v2');
    assert.equal(restored.versions.length, 4); // Added rollback event checkpoint
    assert.ok(restored.versions[0].summary.includes('Restored to revision v2-test'));
    assert.equal(restored.versions[0].script, 'Stable approved script v2');
  });
});
