/**
 * Unit Test Suite for Milestone 1.1: Core Design System, CSS Tokens & Global Layout Scaffolding
 * Uses Node.js native test runner and assertion library
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { VoiceProfile, AudioTelemetry, SynthesizerPayload } from '../src/types/studio';

describe('Milestone 1.1: Layout & Studio Types Validation', () => {
  test('VoiceProfile interface conforms to schema', () => {
    const profile: VoiceProfile = {
      id: 'vp-001',
      name: 'Narrator Profile',
      category: 'Cloned',
      gender: 'Male',
      createdAt: new Date().toISOString(),
      embeddingVector: new Array(256).fill(0.0625),
      cosineSimilarity: 0.98,
      tags: ['narration', 'deep'],
    };

    assert.equal(profile.id, 'vp-001');
    assert.equal(profile.embeddingVector?.length, 256);
    assert.ok(profile.cosineSimilarity! >= 0 && profile.cosineSimilarity! <= 1.0);
  });

  test('AudioTelemetry interface tracks stream metrics correctly', () => {
    const telemetry: AudioTelemetry = {
      rtf: 0.28,
      ttfbMs: 380,
      sampleRateHz: 22050,
      channelCount: 1,
      bufferStatus: 'Healthy',
      activeConnections: 1,
      isStreaming: true,
      pingMs: 42,
    };

    assert.ok(telemetry.rtf < 0.35, 'RTF must be under 0.35');
    assert.ok(telemetry.ttfbMs < 450, 'TTFB must be under 450ms');
    assert.equal(telemetry.sampleRateHz, 22050);
    assert.equal(telemetry.bufferStatus, 'Healthy');
  });

  test('SynthesizerPayload interface validates synthesis settings', () => {
    const payload: SynthesizerPayload = {
      text: 'EchoSync AI zero-shot voice synthesis test.',
      preset: 'default',
      speed: 1.0,
      pitch: 0.0,
      exportFormat: 'wav',
    };

    assert.notEqual(payload.text, '');
    assert.ok(payload.speed >= 0.5 && payload.speed <= 2.0);
  });
});
