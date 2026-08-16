"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-surface-panel/60 border border-border-subtle ${className}`}
    >
      <div className="p-3.5 bg-surface-elevated rounded-2xl border border-border-subtle text-text-muted mb-4 shadow-inner">
        <Icon size={28} className="text-sky-400" />
      </div>

      <h3 className="text-base font-semibold text-text-primary tracking-tight mb-1.5">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-text-secondary max-w-md leading-relaxed mb-6">
        {description}
      </p>

      {(actionText || secondaryActionText) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionText && onAction && (
            <button
              onClick={onAction}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md shadow-sky-600/20 transition-all active:scale-95 focus-ring"
            >
              {actionText}
            </button>
          )}

          {secondaryActionText && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-surface-elevated hover:bg-surface-panel border border-border-subtle rounded-xl transition-all focus-ring"
            >
              {secondaryActionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
