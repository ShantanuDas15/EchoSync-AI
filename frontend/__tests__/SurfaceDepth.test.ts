import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  SURFACE_ELEVATIONS,
  DEFAULT_NOISE_CONFIG,
  validateNoiseConfig,
  generateNoiseSvgXml,
  isMonochromaticFocusRing,
  validateLuminanceProgression
} from '../src/lib/surfaceDepth';
import fs from 'node:fs';
import path from 'node:path';

describe('Milestone 4.2: Texture, Depth & Surface Refinement Gateway', () => {

  describe('Procedural Noise Texture Configuration & Bounds', () => {
    test('DEFAULT_NOISE_CONFIG passes validation with subtle organic bounds', () => {
      assert.equal(validateNoiseConfig(DEFAULT_NOISE_CONFIG), true);
      assert.ok(DEFAULT_NOISE_CONFIG.opacity <= 0.05, 'Noise opacity should be subtle (< 5%)');
      assert.ok(DEFAULT_NOISE_CONFIG.numOctaves >= 2, 'Noise octaves should be >= 2 for smooth distribution');
    });

    test('Excessive opacity (> 8%) fails validation to prevent visual noise pollution', () => {
      assert.equal(validateNoiseConfig({ ...DEFAULT_NOISE_CONFIG, opacity: 0.15 }), false);
      assert.equal(validateNoiseConfig({ ...DEFAULT_NOISE_CONFIG, opacity: -0.01 }), false);
    });

    test('Out-of-bounds frequencies fail validation', () => {
      assert.equal(validateNoiseConfig({ ...DEFAULT_NOISE_CONFIG, baseFrequency: 0.05 }), false);
      assert.equal(validateNoiseConfig({ ...DEFAULT_NOISE_CONFIG, baseFrequency: 2.5 }), false);
    });

    test('generateNoiseSvgXml produces valid XML markup with noise filter', () => {
      const xml = generateNoiseSvgXml(DEFAULT_NOISE_CONFIG);
      assert.ok(xml.includes('<filter id="noiseFilter">'), 'XML must contain noise filter element');
      assert.ok(xml.includes('feTurbulence'), 'XML must contain feTurbulence node');
      assert.ok(xml.includes(`opacity="${DEFAULT_NOISE_CONFIG.opacity}"`), 'XML must apply configured opacity');
    });
  });

  describe('Surface Elevations & Multi-Tier Shadow Depth', () => {
    test('SURFACE_ELEVATIONS defines complete 5-tier elevation stack', () => {
      const requiredKeys = ['level0', 'level1', 'level2', 'level3', 'inset'] as const;
      requiredKeys.forEach((k) => {
        assert.ok(SURFACE_ELEVATIONS[k], `Missing elevation key: ${k}`);
        assert.ok(typeof SURFACE_ELEVATIONS[k].level === 'number');
        assert.ok(SURFACE_ELEVATIONS[k].name);
      });
    });

    test('Elevated panels include dual inner-shadows for tactile edge beveling', () => {
      assert.ok(SURFACE_ELEVATIONS.level1.innerShadow.includes('inset'), 'Level 1 must include inset shadow');
      assert.ok(SURFACE_ELEVATIONS.level2.innerShadow.includes('inset'), 'Level 2 must include inset shadow');
      assert.ok(SURFACE_ELEVATIONS.inset.innerShadow.includes('inset 0 2px'), 'Inset level must have recessed shadow');
    });

    test('Elevation progression maintains monotonic backdrop blur hierarchy', () => {
      const levels = [
        SURFACE_ELEVATIONS.level0,
        SURFACE_ELEVATIONS.level1,
        SURFACE_ELEVATIONS.level2,
        SURFACE_ELEVATIONS.level3
      ];
      assert.equal(validateLuminanceProgression(levels), true);
    });
  });

  describe('Monochromatic Focus Ring & Neutral State Enforcement', () => {
    test('isMonochromaticFocusRing approves neutral and white rings', () => {
      assert.equal(isMonochromaticFocusRing('focus-visible:ring-white/80'), true);
      assert.equal(isMonochromaticFocusRing('focus-visible:ring-neutral-200'), true);
      assert.equal(isMonochromaticFocusRing('focus-visible:ring-zinc-400'), true);
    });

    test('isMonochromaticFocusRing rejects colored or purple/indigo focus rings', () => {
      assert.equal(isMonochromaticFocusRing('focus-visible:ring-indigo-500'), false);
      assert.equal(isMonochromaticFocusRing('focus-visible:ring-purple-400'), false);
      assert.equal(isMonochromaticFocusRing('focus-visible:ring-violet-600'), false);
      assert.equal(isMonochromaticFocusRing('focus-visible:ring-emerald-500'), false);
    });

    test('globals.css applies monochromatic neutral focus-ring without colored outlines', () => {
      const globalsPath = path.resolve(__dirname, '../src/app/globals.css');
      const content = fs.readFileSync(globalsPath, 'utf8');

      assert.ok(content.includes('.focus-ring'), 'globals.css must define .focus-ring');
      assert.ok(
        content.includes('focus-visible:ring-white') || content.includes('focus-visible:ring-neutral'),
        'globals.css .focus-ring must use neutral/white ring'
      );
      assert.equal(
        content.includes('focus-visible:ring-indigo') || content.includes('focus-visible:ring-purple'),
        false,
        'globals.css .focus-ring must not use colored/indigo/purple rings'
      );
    });
  });

});
