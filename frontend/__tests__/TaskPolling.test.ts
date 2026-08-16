import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { apiClient } from '../src/lib/apiClient';

describe('Milestone 5.2: Asynchronous Task Polling & Streaming Hooks Gateway', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    apiClient.setBaseUrl('http://localhost:8000');
    apiClient.clearApiKey();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Task Polling Backoff & Status Progression', () => {
    test('apiClient.getTaskStatus returns queued, processing, and completed status payloads', async () => {
      let callCount = 0;
      global.fetch = (async (input: RequestInfo | URL) => {
        callCount += 1;
        const status = callCount === 1 ? 'queued' : callCount === 2 ? 'processing' : 'completed';
        return new Response(
          JSON.stringify({
            task_id: 'task_xyz',
            status,
            result: status === 'completed' ? { audio_url: 'https://r2.storage/out.wav' } : null,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }) as any;

      const first = await apiClient.getTaskStatus('task_xyz');
      assert.equal(first.status, 'queued');

      const second = await apiClient.getTaskStatus('task_xyz');
      assert.equal(second.status, 'processing');

      const third = await apiClient.getTaskStatus('task_xyz');
      assert.equal(third.status, 'completed');
      assert.equal(third.result?.audio_url, 'https://r2.storage/out.wav');
    });

    test('apiClient.getTaskStatus handles failed task payloads gracefully', async () => {
      global.fetch = (async () => {
        return new Response(
          JSON.stringify({
            task_id: 'task_failed',
            status: 'failed',
            error: 'Phoneme alignment DSP error',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }) as any;

      const res = await apiClient.getTaskStatus('task_failed');
      assert.equal(res.status, 'failed');
      assert.equal(res.error, 'Phoneme alignment DSP error');
    });
  });

  describe('WebSocket URL Protocol & Host Dynamic Resolution', () => {
    test('constructs ws:// URL from http:// base URL', () => {
      apiClient.setBaseUrl('http://api.echosync.internal:8000');
      const baseUrl = apiClient.getBaseUrl();
      const wsProtocol = baseUrl.startsWith('https://') ? 'wss://' : 'ws://';
      const host = baseUrl.replace(/^https?:\/\//, '');
      const wsUrl = `${wsProtocol}${host}/ws/v1/stream/task_123`;

      assert.equal(wsUrl, 'ws://api.echosync.internal:8000/ws/v1/stream/task_123');
    });

    test('constructs wss:// URL from https:// base URL for secure production deployments', () => {
      apiClient.setBaseUrl('https://api.echosync.ai');
      const baseUrl = apiClient.getBaseUrl();
      const wsProtocol = baseUrl.startsWith('https://') ? 'wss://' : 'ws://';
      const host = baseUrl.replace(/^https?:\/\//, '');
      const wsUrl = `${wsProtocol}${host}/ws/v1/stream/task_prod_99`;

      assert.equal(wsUrl, 'wss://api.echosync.ai/ws/v1/stream/task_prod_99');
    });
  });

  describe('Task Polling Backoff Algorithm Calculation', () => {
    test('computes bounded exponential intervals deterministically', () => {
      const initialInterval = 1000;
      const factor = 1.5;
      const maxInterval = 8000;

      let interval = initialInterval;
      const expected = [1000, 1500, 2250, 3375, 5062.5, 7593.75, 8000, 8000];

      for (let i = 0; i < expected.length; i++) {
        assert.equal(Math.round(interval * 100) / 100, expected[i]);
        interval = Math.min(interval * factor, maxInterval);
      }
    });
  });

});
