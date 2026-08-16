import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { apiClient, ApiError } from '../src/lib/apiClient';

describe('Milestone 5.3: Zero-Shot Voice Cloning Dispatch Gateway', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    apiClient.setBaseUrl('http://localhost:8000');
    apiClient.clearApiKey();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Zero-Shot Voice Cloning API Dispatch', () => {
    test('cloneVoice sends FormData and parses VoiceCloneResponse', async () => {
      let capturedMethod = '';
      let capturedUrl = '';

      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedMethod = init?.method || 'GET';

        return new Response(
          JSON.stringify({
            task_id: 'task_clone_987',
            status: 'queued',
            voice_id: 'sarah-custom',
            message: 'Voice cloning synthesis task queued successfully.',
            created_at: new Date().toISOString(),
          }),
          {
            status: 202,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }) as any;

      const formData = new FormData();
      formData.append('text', 'Zero-shot cloned voice speech prompt.');
      formData.append('voice_name', 'sarah-custom');

      const res = await apiClient.cloneVoice(formData);

      assert.equal(capturedMethod, 'POST');
      assert.ok(capturedUrl.includes('/api/v1/voice/clone'));
      assert.equal(res.task_id, 'task_clone_987');
      assert.equal(res.status, 'queued');
      assert.equal(res.voice_id, 'sarah-custom');
    });

    test('cloneVoice gracefully propagates HTTP 413 Payload Too Large error', async () => {
      global.fetch = (async () => {
        return new Response(
          JSON.stringify({
            detail: 'Uploaded file exceeds maximum limit of 10 MB.',
          }),
          {
            status: 413,
            statusText: 'Payload Too Large',
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }) as any;

      const formData = new FormData();
      formData.append('text', 'Test');

      await assert.rejects(
        async () => {
          await apiClient.cloneVoice(formData);
        },
        (err: any) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 413);
          assert.equal(err.message, 'Uploaded file exceeds maximum limit of 10 MB.');
          return true;
        }
      );
    });

    test('cloneVoice gracefully propagates HTTP 422 Unsupported File Format error', async () => {
      global.fetch = (async () => {
        return new Response(
          JSON.stringify({
            detail: "Unsupported file format '.exe'. Allowed formats: .flac, .mp3, .ogg, .wav",
          }),
          {
            status: 422,
            statusText: 'Unprocessable Entity',
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }) as any;

      const formData = new FormData();
      formData.append('text', 'Test');

      await assert.rejects(
        async () => {
          await apiClient.cloneVoice(formData);
        },
        (err: any) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 422);
          assert.ok(err.message.includes('Unsupported file format'));
          return true;
        }
      );
    });
  });

  describe('Direct Text-to-Speech Synthesis Fallback Dispatch', () => {
    test('generateTTS dispatches valid JSON payload when no reference audio is attached', async () => {
      let capturedBody: any = null;

      global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedBody = JSON.parse(init?.body as string);
        return new Response(
          JSON.stringify({
            task_id: 'task_tts_555',
            status: 'queued',
            message: 'Text-to-speech synthesis task queued successfully.',
            created_at: new Date().toISOString(),
          }),
          {
            status: 202,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }) as any;

      const res = await apiClient.generateTTS({
        voice_id: 'michael',
        text: 'Direct synthesis without custom cloning sample.',
        speed: 1.2,
        pitch: 0.9,
      });

      assert.equal(res.task_id, 'task_tts_555');
      assert.equal(capturedBody.voice_id, 'michael');
      assert.equal(capturedBody.speed, 1.2);
      assert.equal(capturedBody.pitch, 0.9);
    });
  });

});
