export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string;
  environment: 'live' | 'test';
  permissions: string[];
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  createdAt: string;
  lastDeliveryStatus?: 'Success' | 'Failed' | 'Pending';
}

export interface TelemetryPoint {
  date: string;
  tokens: number;       // In thousands
  rtf: number;          // Real-time factor (e.g. 0.28)
  errorRate: number;    // In percent (e.g. 0.05%)
  requests: number;     // Total calls
}

/**
 * Generates a random realistic EchoSync API Key.
 */
export function generateApiKey(environment: 'live' | 'test' = 'live'): string {
  const prefix = environment === 'live' ? 'echo_live_' : 'echo_test_';
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 28; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${randomPart}`;
}

/**
 * Generates a random HMAC webhook signing secret.
 */
export function generateWebhookSecret(): string {
  const chars = 'abcdef0123456789';
  let randomPart = '';
  for (let i = 0; i < 32; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `whsec_${randomPart}`;
}

/**
 * Mask API key for secure display: e.g., "echo_live_***8x9"
 */
export function maskApiKey(key: string): string {
  if (!key || typeof key !== 'string') return 'echo_live_***';

  const isLive = key.startsWith('echo_live_');
  const isTest = key.startsWith('echo_test_');

  let prefix = 'echo_live_';
  let suffix = '';

  if (isLive) {
    prefix = 'echo_live_';
    suffix = key.substring(10).slice(-3);
  } else if (isTest) {
    prefix = 'echo_test_';
    suffix = key.substring(10).slice(-3);
  } else {
    // Generic fallback for custom format
    if (key.length <= 8) return '***';
    suffix = key.slice(-3);
    prefix = key.slice(0, 4) + '_';
  }

  return `${prefix}***${suffix}`;
}

/**
 * Mask Webhook signing secret: e.g., "whsec_***ab12"
 */
export function maskWebhookSecret(secret: string): string {
  if (!secret || typeof secret !== 'string') return 'whsec_***';
  if (!secret.startsWith('whsec_')) return 'whsec_***';
  const suffix = secret.substring(6).slice(-4);
  return `whsec_***${suffix}`;
}

/**
 * Strict regex validation for Webhook Endpoint URLs.
 * Requires valid HTTPS (or HTTP for localhost development) with valid hostname and path.
 */
export function validateWebhookUrl(url: string): { isValid: boolean; error?: string } {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { isValid: false, error: 'Webhook URL cannot be empty.' };
  }

  const trimmed = url.trim();

  // Disallow forbidden schemes or scripts
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('file:')) {
    return { isValid: false, error: 'Insecure URL scheme is not permitted.' };
  }

  // Regex pattern supporting:
  // - https://[domain or ip]:[port]/[path]
  // - http://localhost:[port]/[path] or http://127.0.0.1:[port]/[path] (for dev)
  const webhookRegex = /^(https:\/\/(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|https?:\/\/(?:localhost|127\.0\.0\.1))(?::\d{1,5})?(?:\/[^\s]*)?$/i;

  if (!webhookRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'URL must be a valid HTTPS endpoint (or http://localhost for local testing).',
    };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      return { isValid: false, error: 'Production webhooks must use HTTPS protocol.' };
    }
  } catch {
    return { isValid: false, error: 'Malformed URL format.' };
  }

  return { isValid: true };
}

/**
 * Mock telemetry data generator for 7-day or 30-day reporting windows.
 */
export function getTelemetryData(interval: '7d' | '30d' = '7d'): TelemetryPoint[] {
  const count = interval === '7d' ? 7 : 30;
  const points: TelemetryPoint[] = [];

  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Deterministic sine curve + variance
    const progress = (count - i) / count;
    const baseTokens = 120 + Math.sin(progress * Math.PI * 2) * 35 + (i % 3) * 12;
    const baseRtf = 0.28 + Math.sin(progress * Math.PI) * 0.06 - (i % 2) * 0.02;
    const baseError = 0.04 + Math.max(0, Math.sin(progress * 4) * 0.15);
    const requests = Math.round(baseTokens * 8.4);

    points.push({
      date: dateStr,
      tokens: Math.round(baseTokens),
      rtf: Number(baseRtf.toFixed(3)),
      errorRate: Number(baseError.toFixed(2)),
      requests,
    });
  }

  return points;
}
