import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { fuzzyMatch } from '../src/lib/fuzzy';

describe('Milestone 2.1: Command Palette Fuzzy Search', () => {
  test('Exact match has higher score than partial match', () => {
    const exact = fuzzyMatch('synth', 'synth');
    const partial = fuzzyMatch('synth', 'synthesize clipboard');
    
    assert.equal(exact.match, true);
    assert.equal(partial.match, true);
    assert.ok(exact.score > partial.score, 'Exact match should score higher');
  });

  test('Fuzzy matching matches scattered characters in order', () => {
    const result = fuzzyMatch('exla', 'Export Last Audio');
    assert.equal(result.match, true);
  });

  test('Fuzzy matching fails when characters are out of order', () => {
    const result = fuzzyMatch('lx', 'Export Last Audio');
    assert.equal(result.match, false);
  });

  test('Matches starting at word boundaries score higher', () => {
    const boundary = fuzzyMatch('clip', 'Synthesize Clipboard'); // 'c' is at word boundary
    const nonBoundary = fuzzyMatch('clip', 'Eclipse'); // 'c' is not at word boundary
    
    assert.equal(boundary.match, true);
    assert.equal(nonBoundary.match, true);
    assert.ok(boundary.score > nonBoundary.score, 'Word boundary match should score higher');
  });

  test('Empty query matches anything with 0 score', () => {
    const result = fuzzyMatch('', 'Studio');
    assert.equal(result.match, true);
    assert.equal(result.score, 0);
  });
});
