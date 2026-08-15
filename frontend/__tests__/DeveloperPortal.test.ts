import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  maskApiKey,
  validateWebhookUrl,
  generateWebhookSecret,
  maskWebhookSecret,
  getTelemetryData,
  generateApiKey,
} from '../src/lib/developerUtils';

describe('Milestone 2.4: Developer API Portal & Telemetry Verification Gateway', () => {
  describe('API Key Generation & Masking Security', () => {
    test('Live key masking maintains echo_live_ prefix and reveals only last 3 characters', () => {
      const liveKey = 'echo_live_9x8a7b6c5d4e3f2g1h0i9j8k7l6m5n4o';
      const masked = maskApiKey(liveKey);

      assert.equal(masked, 'echo_live_***n4o');
      assert.ok(!masked.includes('9x8a7b6c5d4e3f2g'));
    });

    test('Test key masking maintains echo_test_ prefix and reveals only last 3 characters', () => {
      const testKey = 'echo_test_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p';
      const masked = maskApiKey(testKey);

      assert.equal(masked, 'echo_test_***o6p');
      assert.ok(!masked.includes('1a2b3c4d5e6f'));
    });

    test('Generated keys strictly follow echo_live_ and echo_test_ token convention', () => {
      const liveKey = generateApiKey('live');
      assert.ok(liveKey.startsWith('echo_live_'));
      assert.ok(liveKey.length >= 32);

      const testKey = generateApiKey('test');
      assert.ok(testKey.startsWith('echo_test_'));
      assert.ok(testKey.length >= 32);
    });

    test('Edge cases: null, undefined, or empty string return fallback safe mask', () => {
      assert.equal(maskApiKey(''), 'echo_live_***');
      assert.equal(maskApiKey(null as any), 'echo_live_***');
      assert.equal(maskApiKey(undefined as any), 'echo_live_***');
    });
  });

  describe('Webhook Endpoint URL Validation & Security', () => {
    test('Valid production HTTPS URLs pass validation', () => {
      const validUrls = [
        'https://api.acme.corp/webhooks/echosync',
        'https://sub.domain.io:8443/v1/events',
        'https://webhook.site/1234-5678-90ab-cdef',
      ];

      for (const url of validUrls) {
        const res = validateWebhookUrl(url);
        assert.equal(res.isValid, true, `Expected valid for: ${url}`);
        assert.equal(res.error, undefined);
      }
    });

    test('Localhost HTTP endpoints pass validation for local dev', () => {
      const localUrls = [
        'http://localhost:3000/api/webhook',
        'http://localhost:8000/events',
        'http://127.0.0.1:8080/webhook-listener',
      ];

      for (const url of localUrls) {
        const res = validateWebhookUrl(url);
        assert.equal(res.isValid, true, `Expected valid local URL: ${url}`);
      }
    });

    test('Insecure remote HTTP URLs fail validation', () => {
      const res = validateWebhookUrl('http://insecure-api.com/webhooks');
      assert.equal(res.isValid, false);
      assert.ok(res.error?.includes('HTTPS'));
    });

    test('Forbidden schemes (javascript:, data:, ftp:) are rejected immediately', () => {
      assert.equal(validateWebhookUrl('javascript:alert(1)').isValid, false);
      assert.equal(validateWebhookUrl('data:text/html;base64,...').isValid, false);
      assert.equal(validateWebhookUrl('ftp://files.example.com/hook').isValid, false);
    });

    test('Malformed and empty inputs are rejected', () => {
      assert.equal(validateWebhookUrl('').isValid, false);
      assert.equal(validateWebhookUrl('not-a-url').isValid, false);
      assert.equal(validateWebhookUrl('https://').isValid, false);
    });
  });

  describe('Webhook Secret Generation & Masking', () => {
    test('Webhook secret starts with whsec_ and masks securely', () => {
      const secret = generateWebhookSecret();
      assert.ok(secret.startsWith('whsec_'));
      assert.ok(secret.length >= 36);

      const masked = maskWebhookSecret(secret);
      assert.ok(masked.startsWith('whsec_***'));
      assert.equal(masked.length, 'whsec_***'.length + 4);
    });
  });

  describe('Telemetry Reporting Generator Bounds', () => {
    test('Interval 7d returns 7 telemetry records with valid numeric ranges', () => {
      const data = getTelemetryData('7d');
      assert.equal(data.length, 7);

      for (const pt of data) {
        assert.ok(pt.tokens > 0, 'Tokens must be positive');
        assert.ok(pt.rtf > 0 && pt.rtf < 1.0, 'RTF should be in realistic bounds');
        assert.ok(pt.errorRate >= 0, 'Error rate must be >= 0');
        assert.ok(pt.requests > 0, 'Requests must be positive');
        assert.ok(pt.date.length > 0, 'Date label must be present');
      }
    });

    test('Interval 30d returns 30 telemetry records', () => {
      const data = getTelemetryData('30d');
      assert.equal(data.length, 30);
    });
  });
});
