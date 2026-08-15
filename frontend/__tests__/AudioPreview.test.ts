import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateSyllables,
  estimateDurationSeconds,
  generatePseudoWaveform,
  evaluateClippingRisk
} from '../src/lib/audioPreviewUtils';

describe('Milestone 3.5: Inline Audio Previews & Generative Feedback Gateway', () => {

  describe('Syllable & Cadence Duration Estimation', () => {
    test('estimateSyllables counts syllables accurately for standard phrases', () => {
      assert.equal(estimateSyllables('Hello world'), 3);
      assert.equal(estimateSyllables('AI zero-shot voice synthesis'), 8);
    });

    test('estimateSyllables handles empty, punctuation-only, or whitespace strings', () => {
      assert.equal(estimateSyllables(''), 0);
      assert.equal(estimateSyllables('   '), 0);
      assert.equal(estimateSyllables('... !!! ???'), 0);
    });

    test('estimateDurationSeconds calculates duration with cadence pauses', () => {
      const plainText = 'This is a test of the emergency broadcast system';
      const durationPlain = estimateDurationSeconds(plainText, 120);

      const punctuatedText = 'This is a test, of the emergency broadcast system. Please stand by.';
      const durationPunctuated = estimateDurationSeconds(punctuatedText, 120);

      assert.equal(durationPlain > 0, true);
      assert.equal(durationPunctuated > durationPlain, true, 'Punctuated text should add cadence duration');
    });

    test('estimateDurationSeconds returns 0 for empty string', () => {
      assert.equal(estimateDurationSeconds(''), 0);
    });
  });

  describe('Pseudo-Waveform Amplitude Generation', () => {
    test('generatePseudoWaveform produces specified number of bars', () => {
      const bars24 = generatePseudoWaveform('EchoSync synthesis', 24);
      assert.equal(bars24.length, 24);

      const bars40 = generatePseudoWaveform('EchoSync synthesis', 40);
      assert.equal(bars40.length, 40);
    });

    test('All generated waveform amplitude values are strictly bounded between 0.15 and 1.0', () => {
      const bars = generatePseudoWaveform('The quick brown fox jumps over the lazy dog! Real-time TTS engine.', 32);
      for (const bar of bars) {
        assert.equal(bar >= 0.15, true, `Bar ${bar} must be >= 0.15`);
        assert.equal(bar <= 1.0, true, `Bar ${bar} must be <= 1.0`);
      }
    });

    test('Empty text produces uniform low amplitude ambient bars without crashing', () => {
      const bars = generatePseudoWaveform('', 16);
      assert.equal(bars.length, 16);
      assert.equal(bars.every(b => b === 0.15), true);
    });
  });

  describe('Volume Normalization & Clipping Risk Analysis', () => {
    test('Standard d-vector norm (1.0) reports safe headroom (-1.0 dBFS)', () => {
      const report = evaluateClippingRisk(1.0);
      assert.equal(report.risk, 'safe');
      assert.equal(report.estimatedDb, -1.0);
      assert.equal(report.message.includes('Optimal headroom'), true);
    });

    test('Slightly boosted norm (1.06) triggers moderate near-peak warning', () => {
      const report = evaluateClippingRisk(1.06);
      assert.equal(report.risk, 'warning');
      assert.equal(report.estimatedDb > -0.5, true);
    });

    test('High energy d-vector norm (1.15) reports critical clipping risk', () => {
      const report = evaluateClippingRisk(1.15);
      assert.equal(report.risk, 'critical');
      assert.equal(report.estimatedDb > 0.0, true);
      assert.equal(report.message.includes('High clipping risk'), true);
    });

    test('Target gain boost propagates into total estimated dBFS accurately', () => {
      const report = evaluateClippingRisk(1.0, 3.0); // +3 dB gain added
      assert.equal(report.estimatedDb, 2.0);
      assert.equal(report.risk, 'critical');
    });
  });

});
