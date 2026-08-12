export interface VoiceProfile {
  id: string;
  name: string;
  category: 'Cloned' | 'Preset' | 'Custom';
  gender?: 'Male' | 'Female' | 'Neutral';
  description?: string;
  createdAt: string;
  embeddingVector?: number[]; // 256-d vector array
  cosineSimilarity?: number;  // 0.0 to 1.0
  sampleAudioUrl?: string;
  tags: string[];
}

export interface AudioTelemetry {
  rtf: number;               // Real-Time Factor (e.g. 0.28)
  ttfbMs: number;            // Time-To-First-Byte in ms (e.g. 380)
  sampleRateHz: number;      // e.g. 22050
  channelCount: number;      // e.g. 1 (mono)
  bufferStatus: 'Healthy' | 'Buffering' | 'Underrun';
  activeConnections: number;
  isStreaming: boolean;
  pingMs: number;
}

export interface SynthesizerPayload {
  text: string;
  preset: string;
  voiceProfileId?: string;
  speed: number;       // 0.5 to 2.0
  pitch: number;       // pitch shift value
  volume?: number;     // 0.0 to 1.0
  emotion?: 'neutral' | 'expressive' | 'calm' | 'dramatic';
  exportFormat?: 'wav' | 'mp3' | 'pcm';
}

export type HotkeyKey = 'Cmd+Enter' | 'Space' | 'R' | 'Esc';

export interface HotkeyDefinition {
  key: HotkeyKey;
  label: string;
  description: string;
}
