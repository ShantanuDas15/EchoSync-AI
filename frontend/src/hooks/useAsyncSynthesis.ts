import { useState, useCallback } from 'react';
import { useTaskPolling } from './useTaskPolling';
import { useWebSocketStream } from './useWebSocketStream';
import { TaskStatus } from '@/types/api';

export type SynthesisStage = 'idle' | 'dispatching' | 'queued' | 'processing' | 'streaming' | 'completed' | 'failed';

export interface AsyncSynthesisState {
  stage: SynthesisStage;
  taskId: string | null;
  error: string | null;
  isBusy: boolean;
}

export function useAsyncSynthesis() {
  const [stage, setStage] = useState<SynthesisStage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  const { isStreaming, connectAndStream, stopStreaming, error: wsError } = useWebSocketStream();

  const { startPolling, stopPolling, reset: resetPolling } = useTaskPolling({
    onStatusChange: (status: TaskStatus) => {
      if (status === 'queued') setStage('queued');
      if (status === 'processing') setStage('processing');
    },
    onComplete: (result) => {
      setStage('completed');
    },
    onError: (err) => {
      setError(err);
      setStage('failed');
    },
  });

  const dispatchAndStream = useCallback(
    async (
      dispatchFn: () => Promise<{ task_id: string }>,
      options: { directStream?: boolean } = { directStream: true }
    ) => {
      setError(null);
      setStage('dispatching');

      try {
        const response = await dispatchFn();
        const generatedTaskId = response.task_id;
        setTaskId(generatedTaskId);

        if (options.directStream) {
          // Immediately connect to WebSocket stream for real-time chunk playback
          setStage('streaming');
          connectAndStream(generatedTaskId);
        } else {
          // Poll until complete
          setStage('queued');
          startPolling(generatedTaskId);
        }

        return generatedTaskId;
      } catch (err: any) {
        const message = err?.message || 'Failed to dispatch synthesis task';
        setError(message);
        setStage('failed');
        throw err;
      }
    },
    [connectAndStream, startPolling]
  );

  const cancel = useCallback(() => {
    stopPolling();
    stopStreaming();
    resetPolling();
    setStage('idle');
    setError(null);
    setTaskId(null);
  }, [stopPolling, stopStreaming, resetPolling]);

  return {
    stage,
    taskId,
    error: error || wsError,
    isStreaming,
    isBusy: stage !== 'idle' && stage !== 'completed' && stage !== 'failed',
    dispatchAndStream,
    cancel,
  };
}
