/**
 * EchoSync AI API Type Definitions
 * Exact mirrors of FastAPI backend Pydantic models and REST response schemas
 */

export type TaskStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface TaskStatusResponse {
  task_id: string;
  status: TaskStatus;
  result?: Record<string, any> | null;
  error?: string | null;
}

export interface VoiceCloneRequest {
  voice_id?: string;
  text: string;
  description?: string;
}

export interface VoiceCloneResponse {
  task_id: string;
  status: string;
  voice_id: string;
  message: string;
  created_at: string;
}

export interface TTSGenerateRequest {
  voice_id: string;
  text: string;
  speed?: number; // 0.5 to 2.0
  pitch?: number; // 0.5 to 2.0
}

export interface TTSGenerateResponse {
  task_id: string;
  status: string;
  message: string;
  created_at: string;
}

export interface AudioStreamUrlResponse {
  url: string;
  expires_in: number;
}

export interface AudioUploadResponse {
  file_id: string;
  duration_s: float;
  sample_rate: number;
  channels: number;
  file_size_bytes: number;
}

export interface SpeakerProfileResponse {
  id: string;
  user_id?: string | null;
  speaker_name: string;
  description?: string | null;
  gender?: string;
  language_code?: string;
  visibility?: string;
  reference_audio_url?: string | null;
  reference_audio_id?: string | null;
  is_active?: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyValidationResponse {
  is_valid: boolean;
  user_id?: string | null;
  scopes: string[];
  rate_limit_per_minute: number;
  error_detail?: string | null;
}

export interface ApiErrorDetail {
  loc?: (string | number)[];
  msg: string;
  type: string;
}

export interface ApiErrorResponse {
  detail: string | ApiErrorDetail[];
}

type float = number;
