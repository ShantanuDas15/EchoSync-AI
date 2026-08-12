"use client";

import { useEffect } from 'react';

export interface ShortcutHandlers {
  onSynthesize?: () => void;
  onPlayPause?: () => void;
  onRecordToggle?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // Cmd+Enter or Ctrl+Enter for Synthesize (allowed inside text fields)
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        if (handlers.onSynthesize) {
          event.preventDefault();
          handlers.onSynthesize();
        }
        return;
      }

      // Escape key to close modals or cancel active recording
      if (event.key === 'Escape') {
        if (handlers.onEscape) {
          event.preventDefault();
          handlers.onEscape();
        }
        return;
      }

      // Do not capture single keys if user is typing in an input
      if (isInputFocused) return;

      // Space key to toggle play/pause
      if (event.code === 'Space' || event.key === ' ') {
        if (handlers.onPlayPause) {
          event.preventDefault();
          handlers.onPlayPause();
        }
        return;
      }

      // 'R' key to toggle microphone recording
      if (event.key === 'r' || event.key === 'R') {
        if (handlers.onRecordToggle) {
          event.preventDefault();
          handlers.onRecordToggle();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers]);
}
