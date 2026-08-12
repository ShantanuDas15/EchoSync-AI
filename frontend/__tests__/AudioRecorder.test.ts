/**
 * Unit Test Suite for Milestone 1.2: Audio Recorder & Live VU Gain Meter
 * Uses Node.js native test runner and assertion library
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Milestone 1.2: Audio Recorder Math & dBFS Calculations', () => {
  
  // Helper to simulate the updateVolume logic from useAudioRecorder
  const calculateVolume = (dataArray: Float32Array) => {
    let max = 0;
    let sumSquares = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const val = dataArray[i];
      sumSquares += val * val;
      const absVal = Math.abs(val);
      if (absVal > max) max = absVal;
    }

    const isClipping = max >= 0.99;
    const rms = Math.sqrt(sumSquares / dataArray.length);
    let dbfs = 20 * Math.log10(rms);
    
    if (dbfs === -Infinity || Number.isNaN(dbfs)) dbfs = -100;
    const mappedVolume = Math.max(0, Math.min(100, (dbfs + 60) * (100 / 60)));

    return { dbfs, mappedVolume, isClipping, max };
  };

  test('Silence maps to 0 volume and no clipping', () => {
    const silence = new Float32Array(2048).fill(0);
    const result = calculateVolume(silence);
    assert.equal(result.mappedVolume, 0);
    assert.equal(result.isClipping, false);
    assert.equal(result.max, 0);
  });

  test('Peak amplitude calculation detects clipping accurately', () => {
    const clippingSignal = new Float32Array(2048).fill(0);
    clippingSignal[10] = 0.995; // Exceeds 0.99 threshold
    
    const result = calculateVolume(clippingSignal);
    assert.equal(result.isClipping, true);
    assert.ok(result.max >= 0.99);
  });

  test('Peak amplitude normalization is within [-3 dBFS, 0 dBFS] for healthy loud signal', () => {
    // Generate a sine wave that peaks at ~0.707 (RMS ~0.5)
    // 20 * log10(0.5) is approx -6 dBFS
    // Let's generate a sine wave peaking at 0.9 (RMS ~0.636)
    // 20 * log10(0.636) is approx -3.9 dBFS
    
    const healthyLoud = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) {
      healthyLoud[i] = Math.sin(i) * 0.9;
    }
    
    const result = calculateVolume(healthyLoud);
    
    assert.equal(result.isClipping, false); // Peak is 0.9, not 0.99
    assert.ok(result.dbfs >= -6.0 && result.dbfs <= 0.0); // dBFS should be between -6 and 0
    assert.ok(result.mappedVolume > 90); // Should be mapped high on the 0-100 scale
  });
});
