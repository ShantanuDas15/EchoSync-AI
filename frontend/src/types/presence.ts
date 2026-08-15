export interface CursorPosition {
  x: number; // percentage (0 - 100) or pixels
  y: number; // percentage (0 - 100) or pixels
}

export interface PeerPresence {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string;
  cursor?: CursorPosition;
  activeBlockId?: string | null;
  lastActive: number;
}

export interface PresenceState {
  currentUserId: string;
  peers: PeerPresence[];
  activeChannel: string;
}
