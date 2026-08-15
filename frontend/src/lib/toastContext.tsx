"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastItem, addToastToQueue, removeToastFromQueue } from './microInteractions';
import { ToastStack } from '@/components/ui/ToastNotification';

export type ToastType = 'Success' | 'Processing' | 'Error' | 'Warning' | 'Info';

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType, duration?: number) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  processing: (message: string) => string;
  info: (message: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => removeToastFromQueue(prev, id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'Info', duration: number = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const newToast: ToastItem = {
      id,
      message,
      type,
      duration: type === 'Processing' ? 0 : duration,
      createdAt: Date.now()
    };

    setToasts((prev) => addToastToQueue(prev, newToast, 4));
    return id;
  }, []);

  const success = useCallback((msg: string, dur?: number) => addToast(msg, 'Success', dur), [addToast]);
  const error = useCallback((msg: string, dur?: number) => addToast(msg, 'Error', dur), [addToast]);
  const warning = useCallback((msg: string, dur?: number) => addToast(msg, 'Warning', dur), [addToast]);
  const processing = useCallback((msg: string) => addToast(msg, 'Processing', 0), [addToast]);
  const info = useCallback((msg: string, dur?: number) => addToast(msg, 'Info', dur), [addToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        clearAllToasts,
        success,
        error,
        warning,
        processing,
        info
      }}
    >
      {children}
      <ToastStack toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
