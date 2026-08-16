/**
 * EchoSync AI Secure Media Playback & Pre-signed URL Manager
 * Milestone 5.4: Ephemeral R2 Object URL caching, expiration checks, and automatic re-authentication
 */

import { apiClient, ApiError } from './apiClient';

interface CachedPresignedUrl {
  url: string;
  expiresAt: number; // Unix timestamp in ms
}

const urlCache = new Map<string, CachedPresignedUrl>();

/**
 * Checks if a cached pre-signed URL has expired or is nearing expiration (within 60s buffer)
 */
export function isPresignedUrlExpired(expiresAt: number, bufferMs: number = 60000): boolean {
  return Date.now() >= expiresAt - bufferMs;
}

/**
 * Retrieves a secure ephemeral Cloudflare R2 pre-signed URL for an audio asset with automatic caching
 */
export async function fetchPresignedAudioUrl(
  assetId: string,
  options: { expiresInSeconds?: number; forceRefresh?: boolean } = {}
): Promise<string> {
  const { expiresInSeconds = 3600, forceRefresh = false } = options;

  if (!assetId) {
    throw new Error('assetId is required to fetch presigned audio URL');
  }

  // Return cached URL if valid
  if (!forceRefresh && urlCache.has(assetId)) {
    const cached = urlCache.get(assetId)!;
    if (!isPresignedUrlExpired(cached.expiresAt)) {
      return cached.url;
    }
  }

  try {
    const response = await apiClient.getAudioStreamUrl(assetId, expiresInSeconds);
    const expiresAt = Date.now() + response.expires_in * 1000;

    urlCache.set(assetId, {
      url: response.url,
      expiresAt,
    });

    return response.url;
  } catch (err: any) {
    urlCache.delete(assetId);
    if (err instanceof ApiError) {
      throw err;
    }
    throw new Error(`Failed to resolve secure playback URL for asset ${assetId}: ${err?.message || err}`);
  }
}

/**
 * Clears the pre-signed URL cache
 */
export function clearPresignedUrlCache(): void {
  urlCache.clear();
}
