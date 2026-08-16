import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { apiClient, ApiError } from '../src/lib/apiClient';
import {
  fetchPresignedAudioUrl,
  isPresignedUrlExpired,
  clearPresignedUrlCache,
} from '../src/lib/secureAudioUtils';

describe('Milestone 5.4: Cloud Storage & Secure Media Playback Gateway', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    apiClient.setBaseUrl('http://localhost:8000');
    apiClient.clearApiKey();
    clearPresignedUrlCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    clearPresignedUrlCache();
  });

  describe('Pre-signed Cloudflare R2 Audio URL Caching & Retrieval', () => {
    test('fetchPresignedAudioUrl queries endpoint and returns ephemeral signed URL', async () => {
      let callCount = 0;
      global.fetch = (async (input: RequestInfo | URL) => {
        callCount += 1;
        return new Response(
          JSON.stringify({
            url: 'https://r2.echosync.ai/audio/asset_001.wav?signature=abc123xyz',
            expires_in: 3600,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }) as any;

      const url1 = await fetchPresignedAudioUrl('asset_001');
      assert.equal(url1, 'https://r2.echosync.ai/audio/asset_001.wav?signature=abc123xyz');
      assert.equal(callCount, 1);

      // Second call should return cached URL without additional network fetch
      const url2 = await fetchPresignedAudioUrl('asset_001');
      assert.equal(url2, url1);
      assert.equal(callCount, 1, 'Expected cached URL without redundant network call');
    });

    test('fetchPresignedAudioUrl with forceRefresh: true triggers fresh network fetch', async () => {
      let callCount = 0;
      global.fetch = (async () => {
        callCount += 1;
        return new Response(
          JSON.stringify({
            url: `https://r2.echosync.ai/audio/asset_002.wav?sig=${callCount}`,
            expires_in: 3600,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }) as any;

      const url1 = await fetchPresignedAudioUrl('asset_002');
      assert.ok(url1.includes('sig=1'));

      const url2 = await fetchPresignedAudioUrl('asset_002', { forceRefresh: true });
      assert.ok(url2.includes('sig=2'));
      assert.equal(callCount, 2);
    });

    test('isPresignedUrlExpired detects expired or nearly expired tokens with buffer', () => {
      const now = Date.now();
      assert.equal(isPresignedUrlExpired(now - 1000), true, 'Past timestamp is expired');
      assert.equal(isPresignedUrlExpired(now + 30000, 60000), true, 'Timestamp within 60s buffer is treated as expired');
      assert.equal(isPresignedUrlExpired(now + 300000, 60000), false, 'Future timestamp > buffer is valid');
    });

    test('fetchPresignedAudioUrl handles 404 Not Found error gracefully', async () => {
      global.fetch = (async () => {
        return new Response(
          JSON.stringify({
            detail: 'Audio asset not found.',
          }),
          {
            status: 404,
            statusText: 'Not Found',
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }) as any;

      await assert.rejects(
        async () => {
          await fetchPresignedAudioUrl('non_existent_asset');
        },
        (err: any) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 404);
          assert.equal(err.message, 'Audio asset not found.');
          return true;
        }
      );
    });
  });

});
