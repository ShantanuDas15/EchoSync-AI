"use client";

import React from 'react';
import { AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  code?: string | number;
  onRetry?: () => void;
  onDismiss?: () => void;
  supportLink?: string;
  className?: string;
}

export function ErrorState({
  title = "Synthesis Processing Exception",
  message,
  code,
  onRetry,
  onDismiss,
  supportLink,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid="error-state"
      className={`p-5 rounded-2xl bg-surface-panel border border-status-error/30 shadow-lg shadow-status-error/5 flex flex-col gap-4 text-text-primary ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-status-error/10 border border-status-error/20 text-status-error shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-text-primary tracking-tight">
                {title}
              </h4>
              {code && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-surface-elevated text-status-error border border-status-error/20">
                  ERR_{code}
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
      </div>

      {(onRetry || supportLink || onDismiss) && (
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border-subtle gap-2 text-xs">
          {supportLink ? (
            <a
              href={supportLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-sky-400 flex items-center gap-1 transition-colors"
            >
              <span>View diagnostics spec</span>
              <ChevronRight size={12} />
            </a>
          ) : <span />}

          <div className="flex items-center gap-2 ml-auto">
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary bg-surface-elevated hover:bg-surface-panel border border-border-subtle rounded-lg transition-colors focus-ring"
              >
                Dismiss
              </button>
            )}

            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm flex items-center gap-1.5 transition-all active:scale-95 focus-ring"
              >
                <RefreshCw size={12} />
                <span>Retry Operation</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
