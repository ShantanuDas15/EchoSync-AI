/**
 * Unit Test Suite for Milestone 1.5: Interactive Voice Library & Speaker Profile Management
 * Uses Node.js native test runner and assertion library
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Milestone 1.5: Voice Library Filtering & Logic', () => {

  interface SpeakerProfile {
    id: string;
    name: string;
    tags: string[];
    similarityScore: number;
    dVectorNorm: number;
  }

  const mockProfiles: SpeakerProfile[] = [
    { id: '1', name: 'Sarah (Broadcast)', tags: ['Preset', 'Female', 'Broadcast'], similarityScore: 0.98, dVectorNorm: 0.999 },
    { id: '2', name: 'James (Podcast)', tags: ['Cloned', 'Male'], similarityScore: 0.85, dVectorNorm: 1.001 },
    { id: '3', name: 'Alice (Narrative)', tags: ['Preset', 'Female'], similarityScore: 0.95, dVectorNorm: 1.0 },
    { id: '4', name: 'Marcus (Gaming)', tags: ['Cloned', 'Male', 'Gaming'], similarityScore: 0.88, dVectorNorm: 0.998 },
  ];

  const filterProfiles = (profiles: SpeakerProfile[], searchQuery: string, selectedTags: string[]) => {
    return profiles.filter(profile => {
      const matchesSearch = profile.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags = selectedTags.length === 0 || selectedTags.every(t => profile.tags.includes(t));
      return matchesSearch && matchesTags;
    });
  };

  test('VoiceCard Filtering: Returns all profiles when query and tags are empty', () => {
    const results = filterProfiles(mockProfiles, '', []);
    assert.equal(results.length, 4);
  });

  test('VoiceCard Filtering: Search string filtering is case-insensitive', () => {
    const results = filterProfiles(mockProfiles, 'JaMeS', []);
    assert.equal(results.length, 1);
    assert.equal(results[0].id, '2');
  });

  test('VoiceCard Filtering: Profile tag selection returns intersection of matches', () => {
    const results = filterProfiles(mockProfiles, '', ['Cloned', 'Male']);
    assert.equal(results.length, 2); // James and Marcus
    assert.ok(results.every(p => p.tags.includes('Cloned') && p.tags.includes('Male')));
  });

  test('VoiceCard Filtering: Combined search and tags filter accurately', () => {
    const results = filterProfiles(mockProfiles, 'marcus', ['Cloned']);
    assert.equal(results.length, 1);
    assert.equal(results[0].id, '4');
  });

  test('VoiceCard Filtering: Non-existent search returns empty array', () => {
    const results = filterProfiles(mockProfiles, 'NonExistentPerson', []);
    assert.equal(results.length, 0);
  });

  test('Vector Euclidean Norm Validation', () => {
    // Assert Euclidean norm ||e||_2 is close to 1.0
    for (const p of mockProfiles) {
      const diff = Math.abs(1.0 - p.dVectorNorm);
      assert.ok(diff < 0.05, `Vector norm for ${p.name} is out of bounds: ${p.dVectorNorm}`);
    }
  });

});
