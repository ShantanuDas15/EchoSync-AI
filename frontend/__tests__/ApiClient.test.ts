import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { apiClient, ApiError } from '../src/lib/apiClient';

describe('Milestone 5.1: Core API Client & Authentication Layer Gateway', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    apiClient.setBaseUrl('http://localhost:8000');
    apiClient.clearApiKey();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('API Key Authentication & Interception', () => {
    test('apiClient sets, gets, and clears API key correctly', () => {
      apiClient.setApiKey('test_key_12345');
      assert.equal(apiClient.getApiKey(), 'test_key_12345');

      apiClient.clearApiKey();
      assert.equal(apiClient.getApiKey(), null);
    });

    test('apiClient automatically injects X-API-Key header when key is configured', async () => {
      apiClient.setApiKey('echosync_secret_key');
      let capturedHeaders: Record<string, string> = {};

      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedHeaders = (init?.headers as Record<string, string>) || {};
        return new Response(JSON.stringify({ status: 'ok' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as any;

      await apiClient.get('/health');
      assert.equal(capturedHeaders['X-API-Key'], 'echosync_secret_key');
    });

    test('apiClient does not override manually supplied X-API-Key header', async () => {
      apiClient.setApiKey('default_key');
      let capturedHeaders: Record<string, string> = {};

      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedHeaders = (init?.headers as Record<string, string>) || {};
        return new Response(JSON.stringify({ status: 'ok' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as any;

      await apiClient.get('/health', { headers: { 'X-API-Key': 'override_key' } });
      assert.equal(capturedHeaders['X-API-Key'], 'override_key');
    });
  });

  describe('HTTP Methods & Payload Formatting', () => {
    test('post serializes JSON objects and attaches application/json Content-Type', async () => {
      let capturedBody = '';
      let capturedContentType = '';

      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedBody = init?.body as string;
        capturedContentType = (init?.headers as Record<string, string>)['Content-Type'];
        return new Response(JSON.stringify({ task_id: 'task_123' }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as any;

      const payload = { voice_id: 'sarah', text: 'Hello world', speed: 1.0, pitch: 1.0 };
      const res = await apiClient.generateTTS(payload);

      assert.equal(res.task_id, 'task_123');
      assert.equal(capturedContentType, 'application/json');
      assert.equal(JSON.parse(capturedBody).text, 'Hello world');
    });

    test('getTaskStatus formats correct endpoint path /api/v1/voice/tasks/{id}', async () => {
      let capturedUrl = '';

      global.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = String(input);
        return new Response(JSON.stringify({ task_id: 'task_abc', status: 'processing' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as any;

      const res = await apiClient.getTaskStatus('task_abc');
      assert.equal(res.status, 'processing');
      assert.ok(capturedUrl.includes('/api/v1/voice/tasks/task_abc'));
    });

    test('getAudioStreamUrl encodes query parameter expires_in', async () => {
      let capturedUrl = '';

      global.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = String(input);
        return new Response(JSON.stringify({ url: 'https://r2.cloudflarestorage.com/sample.wav', expires_in: 7200 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as any;

      const res = await apiClient.getAudioStreamUrl('asset_99', 7200);
      assert.equal(res.expires_in, 7200);
      assert.ok(capturedUrl.includes('/api/v1/audio/asset_99/stream-url'));
      assert.ok(capturedUrl.includes('expires_in=7200'));
    });
  });

  describe('Error Handling & ApiError Serialization', () => {
    test('handles 401 Unauthorized with descriptive message', async () => {
      global.fetch = (async () => {
        return new Response(JSON.stringify({ detail: 'Invalid or missing API key.' }), {
          status: 401,
          statusText: 'Unauthorized',
          headers: { 'Content-Type': 'application/json' },
        });
      }) as any;

      await assert.rejects(
        async () => {
          await apiClient.get('/voice/tasks/123');
        },
        (err: any) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 401);
          assert.equal(err.message, 'Invalid or missing API key.');
          return true;
        }
      );
    });

    test('parses FastAPI 422 validation error arrays cleanly', async () => {
      global.fetch = (async () => {
        return new Response(
          JSON.stringify({
            detail: [
              { loc: ['body', 'text'], msg: 'field required', type: 'value_error.missing' },
              { loc: ['body', 'speed'], msg: 'ensure this value is greater than 0.5', type: 'value_error.number.not_ge' }
            ],
          }),
          {
            status: 422,
            statusText: 'Unprocessable Entity',
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }) as any;

      await assert.rejects(
        async () => {
          await apiClient.generateTTS({ voice_id: '', text: '' });
        },
        (err: any) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 422);
          assert.ok(err.message.includes('field required'));
          assert.ok(err.message.includes('ensure this value is greater than 0.5'));
          return true;
        }
      );
    });

    test('handles network failure with custom ApiError code 0', async () => {
      global.fetch = (async () => {
        throw new Error('Failed to fetch');
      }) as any;

      await assert.rejects(
        async () => {
          await apiClient.get('/health');
        },
        (err: any) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 0);
          assert.equal(err.message, 'Failed to fetch');
          return true;
        }
      );
    });
  });

});
