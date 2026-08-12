"use client";

import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Loader2, X } from 'lucide-react';

export type ToastType = 'Success' | 'Processing' | 'Error' | 'Warning';

interface ToastNotificationProps {
  message: string;
  type: ToastType;
  duration?: number; // ms
  onDismiss: () => void;
}

export function ToastNotification({ message, type, duration = 3000, onDismiss }: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (type === 'Processing') return; // Processing doesn't auto-dismiss

    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, type]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Allow fade out animation
  };

  const getStyles = () => {
    switch (type) {
      case 'Success': return 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400';
      case 'Error': return 'bg-red-500/10 border-red-500/50 text-red-400';
      case 'Warning': return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400';
      case 'Processing': return 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'Success': return <CheckCircle size={18} />;
      case 'Error': return <AlertCircle size={18} />;
      case 'Warning': return <AlertTriangle size={18} />;
      case 'Processing': return <Loader2 size={18} className="animate-spin" />;
    }
  };

  return (
    <div 
      className={`fixed bottom-16 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl transition-all duration-300 ${getStyles()} ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      role="alert"
    >
      {getIcon()}
      <span className="text-sm font-medium">{message}</span>
      <button 
        onClick={handleDismiss} 
        className="ml-4 opacity-50 hover:opacity-100 transition-opacity"
      >
        <X size={16} />
      </button>
    </div>
  );
}
