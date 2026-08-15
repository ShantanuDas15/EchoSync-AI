"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PeerPresence, CursorPosition } from '@/types/presence';
import { upsertPeer, removePeer, pruneStalePeers, getRandomColor } from './presenceUtils';

interface PresenceContextType {
  currentUserId: string;
  peers: PeerPresence[];
  activeChannel: string;
  updateCursor: (x: number, y: number) => void;
  setActiveBlock: (blockId: string | null) => void;
  joinChannel: (channelId: string) => void;
  leaveChannel: () => void;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

// Initial demo collaborators for interactive collaborative feel
const INITIAL_DEMO_PEERS: PeerPresence[] = [
  {
    id: 'peer-elena',
    name: 'Elena (Audio Lead)',
    color: '#ec4899',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
    cursor: { x: 420, y: 280 },
    activeBlockId: null,
    lastActive: Date.now()
  },
  {
    id: 'peer-david',
    name: 'David (Producer)',
    color: '#10b981',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    cursor: { x: 740, y: 350 },
    activeBlockId: '2', // Editing block 2
    lastActive: Date.now()
  }
];

export function PresenceProvider({
  children,
  defaultChannel = 'project-main'
}: {
  children: ReactNode;
  defaultChannel?: string;
}) {
  const [currentUserId] = useState<string>(() => `user-${Math.random().toString(36).substring(7)}`);
  const [activeChannel, setActiveChannel] = useState<string>(defaultChannel);
  const [peers, setPeers] = useState<PeerPresence[]>(INITIAL_DEMO_PEERS);

  // Subtle natural movement simulation for demo peers so cursors feel alive
  useEffect(() => {
    const interval = setInterval(() => {
      setPeers((prev) => {
        const now = Date.now();
        return prev.map((p) => {
          if (p.id.startsWith('peer-')) {
            const currentCursor = p.cursor || { x: 500, y: 300 };
            const deltaX = (Math.random() - 0.5) * 30;
            const deltaY = (Math.random() - 0.5) * 20;
            return {
              ...p,
              cursor: {
                x: Math.max(50, Math.min(window.innerWidth - 80, currentCursor.x + deltaX)),
                y: Math.max(100, Math.min(650, currentCursor.y + deltaY))
              },
              lastActive: now
            };
          }
          return p;
        });
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Periodic pruning of stale peers
  useEffect(() => {
    const pruneInterval = setInterval(() => {
      setPeers((prev) => pruneStalePeers(prev, Date.now(), 60000));
    }, 10000);

    return () => clearInterval(pruneInterval);
  }, []);

  const updateCursor = useCallback((x: number, y: number) => {
    // In real app, broadcast to WebSocket channel
  }, []);

  const setActiveBlock = useCallback((blockId: string | null) => {
    // In real app, broadcast lock state
  }, []);

  const joinChannel = useCallback((channelId: string) => {
    setActiveChannel(channelId);
  }, []);

  const leaveChannel = useCallback(() => {
    setActiveChannel('');
    setPeers([]);
  }, []);

  return (
    <PresenceContext.Provider
      value={{
        currentUserId,
        peers,
        activeChannel,
        updateCursor,
        setActiveBlock,
        joinChannel,
        leaveChannel
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
}
