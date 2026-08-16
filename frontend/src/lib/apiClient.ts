/**
 * EchoSync AI API Client
 * Strongly-typed HTTP client for FastAPI backend integration with API key injection and structured error handling.
 */

import {
  TaskStatusResponse,
  VoiceCloneResponse,
  TTSGenerateRequest,
  TTSGenerateResponse,
  AudioStreamUrlResponse,
  ApiKeyValidationResponse,
  ApiErrorResponse,
} from '@/types/api';

export class ApiError extends Error {
  public status: number;
  public statusText: string;
  public data: any;

  constructor(status: number, statusText: string, data: any, customMessage?: string) {
    let message = customMessage;
    if (!message) {
      if (typeof data?.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data?.detail)) {
        message = data.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
      } else {
        message = `API Request failed with status ${status}: ${statusText}`;
      }
    }
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;
  private apiKey: string | null = null;
  private defaultTimeoutMs: number = 15000;

  constructor() {
    this.baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');
    if (typeof window !== 'undefined') {
      this.apiKey = localStorage.getItem('echosync_api_key') || process.env.NEXT_PUBLIC_API_KEY || null;
    } else {
      this.apiKey = process.env.NEXT_PUBLIC_API_KEY || null;
    }
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
    if (typeof window !== 'undefined') {
      localStorage.setItem('echosync_api_key', key);
    }
  }

  public getApiKey(): string | null {
    return this.apiKey;
  }

  public clearApiKey(): void {
    this.apiKey = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('echosync_api_key');
    }
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const prefix = cleanPath.startsWith('/api/v1') ? '' : '/api/v1';
    const fullUrl = `${this.baseUrl}${prefix}${cleanPath}`;

    if (!params) return fullUrl;

    const url = new URL(fullUrl);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        url.searchParams.append(k, String(v));
      }
    });
    return url.toString();
  }

  public async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { timeoutMs = this.defaultTimeoutMs, params, headers = {}, ...restOptions } = options;
    const url = this.buildUrl(path, params);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const requestHeaders: Record<string, string> = {
      ...(headers as Record<string, string>),
    };

    // Attach API key if available
    if (this.apiKey && !requestHeaders['X-API-Key']) {
      requestHeaders['X-API-Key'] = this.apiKey;
    }

    // Attach Content-Type for non-FormData JSON payloads
    if (restOptions.body && !(restOptions.body instanceof FormData) && !requestHeaders['Content-Type']) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...restOptions,
        headers: requestHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        throw new ApiError(response.status, response.statusText, data);
      }

      return data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new ApiError(408, 'Request Timeout', null, `Request timed out after ${timeoutMs}ms`);
      }
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Network Error', null, error.message || 'Unknown network error occurred');
    }
  }

  public async get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  public async post<T>(path: string, body?: any, options: RequestOptions = {}): Promise<T> {
    const payload = body instanceof FormData ? body : body ? JSON.stringify(body) : undefined;
    return this.request<T>(path, { ...options, method: 'POST', body: payload });
  }

  public async put<T>(path: string, body?: any, options: RequestOptions = {}): Promise<T> {
    const payload = body instanceof FormData ? body : body ? JSON.stringify(body) : undefined;
    return this.request<T>(path, { ...options, method: 'PUT', body: payload });
  }

  public async delete<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  // Domain-specific helper methods

  /**
   * Dispatch zero-shot voice cloning task with reference audio and script
   */
  public async cloneVoice(formData: FormData): Promise<VoiceCloneResponse> {
    return this.post<VoiceCloneResponse>('/voice/clone', formData);
  }

  /**
   * Dispatch direct text-to-speech synthesis task
   */
  public async generateTTS(payload: TTSGenerateRequest): Promise<TTSGenerateResponse> {
    return this.post<TTSGenerateResponse>('/tts/generate', payload);
  }

  /**
   * Query status of an asynchronous voice cloning or TTS task
   */
  public async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    return this.get<TaskStatusResponse>(`/voice/tasks/${taskId}`);
  }

  /**
   * Fetch temporary presigned URL for secure R2 audio playback
   */
  public async getAudioStreamUrl(assetId: string, expiresIn: number = 3600): Promise<AudioStreamUrlResponse> {
    return this.get<AudioStreamUrlResponse>(`/audio/${assetId}/stream-url`, {
      params: { expires_in: expiresIn },
    });
  }
}

export const apiClient = new ApiClient();
