import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  upsertPeer,
  removePeer,
  pruneStalePeers,
  isBlockLocked,
  interpolateCursor,
  getRandomColor,
  COLLABORATOR_COLORS,
  PEER_INACTIVITY_TIMEOUT_MS
} from '../src/lib/presenceUtils';
import { PeerPresence } from '../src/types/presence';

describe('Milestone 3.4: Real-Time Multiplayer Presence Gateway', () => {

  describe('Peer State Upsert & Removal', () => {
    test('upsertPeer adds new collaborator to empty state', () => {
      const initial: PeerPresence[] = [];
      const newPeer: PeerPresence = {
        id: 'peer-1',
        name: 'Alice',
        color: '#6366f1',
        lastActive: 1000
      };

      const updated = upsertPeer(initial, newPeer);
      assert.equal(updated.length, 1);
      assert.equal(updated[0].id, 'peer-1');
      assert.equal(updated[0].name, 'Alice');
    });

    test('upsertPeer updates existing peer properties in place without duplicating', () => {
      const initial: PeerPresence[] = [
        { id: 'peer-1', name: 'Alice', color: '#6366f1', cursor: { x: 100, y: 100 }, lastActive: 1000 }
      ];

      const updated = upsertPeer(initial, {
        id: 'peer-1',
        name: 'Alice',
        color: '#6366f1',
        cursor: { x: 250, y: 300 },
        activeBlockId: 'block-9',
        lastActive: 2000
      });

      assert.equal(updated.length, 1);
      assert.deepEqual(updated[0].cursor, { x: 250, y: 300 });
      assert.equal(updated[0].activeBlockId, 'block-9');
      assert.equal(updated[0].lastActive, 2000);
    });

    test('removePeer removes designated collaborator by ID', () => {
      const peers: PeerPresence[] = [
        { id: 'p1', name: 'Alice', color: '#6366f1', lastActive: 1000 },
        { id: 'p2', name: 'Bob', color: '#ec4899', lastActive: 1000 }
      ];

      const result = removePeer(peers, 'p1');
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'p2');
    });
  });

  describe('Stale Peer Pruning & Inactivity Handling', () => {
    test('pruneStalePeers purges peers inactive longer than timeout', () => {
      const now = 20000;
      const peers: PeerPresence[] = [
        { id: 'active', name: 'Active User', color: '#10b981', lastActive: now - 5000 },
        { id: 'stale', name: 'Stale User', color: '#f59e0b', lastActive: now - 25000 }
      ];

      const activeOnly = pruneStalePeers(peers, now, PEER_INACTIVITY_TIMEOUT_MS);
      assert.equal(activeOnly.length, 1);
      assert.equal(activeOnly[0].id, 'active');
    });

    test('pruneStalePeers retains all active peers within timeout threshold', () => {
      const now = 10000;
      const peers: PeerPresence[] = [
        { id: 'p1', name: 'User 1', color: '#10b981', lastActive: now - 2000 },
        { id: 'p2', name: 'User 2', color: '#8b5cf6', lastActive: now - 8000 }
      ];

      const result = pruneStalePeers(peers, now, PEER_INACTIVITY_TIMEOUT_MS);
      assert.equal(result.length, 2);
    });
  });

  describe('Collaborative Block Locking Logic', () => {
    const currentUserId = 'my-user-id';
    const remotePeer: PeerPresence = {
      id: 'remote-user',
      name: 'Elena',
      color: '#ec4899',
      activeBlockId: 'block-2',
      lastActive: 1000
    };

    test('isBlockLocked reports locked: true with peer details when edited by another user', () => {
      const status = isBlockLocked([remotePeer], 'block-2', currentUserId);
      assert.equal(status.locked, true);
      assert.equal(status.lockedBy?.id, 'remote-user');
      assert.equal(status.lockedBy?.name, 'Elena');
    });

    test('isBlockLocked reports locked: false when block is being edited by the current user', () => {
      const selfPeer: PeerPresence = {
        id: currentUserId,
        name: 'Me',
        color: '#6366f1',
        activeBlockId: 'block-2',
        lastActive: 1000
      };

      const status = isBlockLocked([selfPeer], 'block-2', currentUserId);
      assert.equal(status.locked, false);
      assert.equal(status.lockedBy, undefined);
    });

    test('isBlockLocked reports locked: false when block is unassigned', () => {
      const status = isBlockLocked([remotePeer], 'block-unlocked', currentUserId);
      assert.equal(status.locked, false);
      assert.equal(status.lockedBy, undefined);
    });
  });

  describe('Cursor Interpolation & Coordinate Clamping', () => {
    test('interpolateCursor calculates fractional lerp between coordinates', () => {
      const from = { x: 100, y: 100 };
      const to = { x: 200, y: 300 };

      const step = interpolateCursor(from, to, 0.5);
      assert.equal(step.x, 150);
      assert.equal(step.y, 200);
    });

    test('interpolateCursor factor 1.0 jumps directly to target position', () => {
      const from = { x: 100, y: 100 };
      const to = { x: 500, y: 400 };

      const result = interpolateCursor(from, to, 1.0);
      assert.equal(result.x, 500);
      assert.equal(result.y, 400);
    });
  });

  describe('Color Utility Determinism', () => {
    test('getRandomColor returns deterministic color for identical seed', () => {
      const color1 = getRandomColor('user-alpha');
      const color2 = getRandomColor('user-alpha');
      assert.equal(color1, color2);
      assert.equal(COLLABORATOR_COLORS.includes(color1), true);
    });
  });

});
