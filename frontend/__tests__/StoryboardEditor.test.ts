import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { moveBlock } from '../src/lib/dndUtils';

describe('Milestone 2.2: Storyboard Editor Reordering', () => {
  test('Moving a block from index 0 to index 2 correctly updates sequence payload', () => {
    const blocks = [
      { id: 'b0', text: 'Block 0' },
      { id: 'b1', text: 'Block 1' },
      { id: 'b2', text: 'Block 2' },
      { id: 'b3', text: 'Block 3' }
    ];
    
    // Move block 0 to index 2
    const updatedBlocks = moveBlock(blocks, 0, 2);
    
    // Expected sequence: b1, b2, b0, b3
    assert.equal(updatedBlocks.length, 4);
    assert.equal(updatedBlocks[0].id, 'b1');
    assert.equal(updatedBlocks[1].id, 'b2');
    assert.equal(updatedBlocks[2].id, 'b0'); // The moved block
    assert.equal(updatedBlocks[3].id, 'b3');
  });

  test('Moving a block down the list', () => {
    const blocks = ['A', 'B', 'C', 'D'];
    const updated = moveBlock(blocks, 1, 3); // Move B to D's position
    // new array: A, C, D, B
    assert.deepEqual(updated, ['A', 'C', 'D', 'B']);
  });

  test('Moving a block up the list', () => {
    const blocks = ['A', 'B', 'C', 'D'];
    const updated = moveBlock(blocks, 3, 1); // Move D to B's position
    // new array: A, D, B, C
    assert.deepEqual(updated, ['A', 'D', 'B', 'C']);
  });
});
