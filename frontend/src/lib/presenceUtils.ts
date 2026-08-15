import { PeerPresence, CursorPosition } from '@/types/presence';

export const COLLABORATOR_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

export const PEER_INACTIVITY_TIMEOUT_MS = 15000;

export function getRandomColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLLABORATOR_COLORS.length;
  return COLLABORATOR_COLORS[index];
}

export function upsertPeer(peers: PeerPresence[], updatedPeer: PeerPresence): PeerPresence[] {
  const index = peers.findIndex((p) => p.id === updatedPeer.id);
  if (index === -1) {
    return [...peers, updatedPeer];
  }
  const next = [...peers];
  next[index] = { ...next[index], ...updatedPeer };
  return next;
}

export function removePeer(peers: PeerPresence[], peerId: string): PeerPresence[] {
  return peers.filter((p) => p.id !== peerId);
}

export function pruneStalePeers(
  peers: PeerPresence[],
  currentTime: number,
  maxInactivityMs: number = PEER_INACTIVITY_TIMEOUT_MS
): PeerPresence[] {
  return peers.filter((p) => currentTime - p.lastActive <= maxInactivityMs);
}

export function isBlockLocked(
  peers: PeerPresence[],
  blockId: string,
  currentUserId: string
): { locked: boolean; lockedBy?: PeerPresence } {
  const lockingPeer = peers.find(
    (p) => p.id !== currentUserId && p.activeBlockId === blockId
  );

  if (lockingPeer) {
    return { locked: true, lockedBy: lockingPeer };
  }
  return { locked: false };
}

export function interpolateCursor(
  from: CursorPosition,
  to: CursorPosition,
  factor: number = 0.2
): CursorPosition {
  return {
    x: Number((from.x + (to.x - from.x) * factor).toFixed(2)),
    y: Number((from.y + (to.y - from.y) * factor).toFixed(2)),
  };
}
