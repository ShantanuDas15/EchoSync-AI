import { useState, useRef, useCallback, useEffect } from 'react';
import { apiClient, ApiError } from '@/lib/apiClient';
import { TaskStatus, TaskStatusResponse } from '@/types/api';

export interface TaskPollingOptions {
  initialIntervalMs?: number;
  maxIntervalMs?: number;
  backoffFactor?: number;
  maxAttempts?: number;
  onStatusChange?: (status: TaskStatus) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export interface TaskPollingState {
  taskId: string | null;
  status: TaskStatus | 'idle';
  result: Record<string, any> | null;
  error: string | null;
  isPolling: boolean;
  pollCount: number;
}

export function useTaskPolling(options: TaskPollingOptions = {}) {
  const {
    initialIntervalMs = 1000,
    maxIntervalMs = 8000,
    backoffFactor = 1.5,
    maxAttempts = 30,
    onStatusChange,
    onComplete,
    onError,
  } = options;

  const [state, setState] = useState<TaskPollingState>({
    taskId: null,
    status: 'idle',
    result: null,
    error: null,
    isPolling: false,
    pollCount: 0,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const callbacksRef = useRef({ onStatusChange, onComplete, onError });

  useEffect(() => {
    callbacksRef.current = { onStatusChange, onComplete, onError };
  }, [onStatusChange, onComplete, onError]);

  const stopPolling = useCallback(() => {
    isCancelledRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setState(prev => ({ ...prev, isPolling: false }));
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setState({
      taskId: null,
      status: 'idle',
      result: null,
      error: null,
      isPolling: false,
      pollCount: 0,
    });
  }, [stopPolling]);

  const startPolling = useCallback(
    (
      taskId: string,
      customComplete?: (result: any) => void,
      customError?: (err: string) => void
    ) => {
      stopPolling();
      isCancelledRef.current = false;

      setState({
        taskId,
        status: 'queued',
        result: null,
        error: null,
        isPolling: true,
        pollCount: 0,
      });

      let attempts = 0;
      let currentInterval = initialIntervalMs;

      const poll = async () => {
        if (isCancelledRef.current) return;

        attempts += 1;

        try {
          const taskData: TaskStatusResponse = await apiClient.getTaskStatus(taskId);

          if (isCancelledRef.current) return;

          setState(prev => ({
            ...prev,
            status: taskData.status,
            result: taskData.result || null,
            error: taskData.error || null,
            pollCount: attempts,
          }));

          callbacksRef.current.onStatusChange?.(taskData.status);

          if (taskData.status === 'completed') {
            setState(prev => ({ ...prev, isPolling: false }));
            if (customComplete) customComplete(taskData.result);
            callbacksRef.current.onComplete?.(taskData.result);
            return;
          }

          if (taskData.status === 'failed') {
            const errorMsg = taskData.error || 'Synthesis task failed during execution';
            setState(prev => ({ ...prev, isPolling: false, error: errorMsg }));
            if (customError) customError(errorMsg);
            callbacksRef.current.onError?.(errorMsg);
            return;
          }

          if (attempts >= maxAttempts) {
            const timeoutMsg = `Task polling exceeded maximum limit of ${maxAttempts} attempts`;
            setState(prev => ({ ...prev, isPolling: false, error: timeoutMsg, status: 'failed' }));
            if (customError) customError(timeoutMsg);
            callbacksRef.current.onError?.(timeoutMsg);
            return;
          }

          // Schedule next poll with exponential backoff
          currentInterval = Math.min(currentInterval * backoffFactor, maxIntervalMs);
          timerRef.current = setTimeout(poll, currentInterval);
        } catch (err: any) {
          if (isCancelledRef.current) return;

          const errorMsg = err instanceof ApiError ? err.message : err?.message || 'Polling request failed';

          if (attempts >= maxAttempts) {
            setState(prev => ({ ...prev, isPolling: false, error: errorMsg, status: 'failed' }));
            if (customError) customError(errorMsg);
            callbacksRef.current.onError?.(errorMsg);
            return;
          }

          // Continue polling on transient errors with backoff
          currentInterval = Math.min(currentInterval * backoffFactor, maxIntervalMs);
          timerRef.current = setTimeout(poll, currentInterval);
        }
      };

      // Initial execution
      timerRef.current = setTimeout(poll, initialIntervalMs);
    },
    [initialIntervalMs, maxIntervalMs, backoffFactor, maxAttempts, stopPolling]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startPolling,
    stopPolling,
    reset,
  };
}
