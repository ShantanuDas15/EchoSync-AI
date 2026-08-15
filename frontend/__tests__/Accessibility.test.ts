import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRelativeLuminance,
  hexToRgb,
  calculateContrastRatio,
  isWcagCompliant,
} from '../src/lib/themeContext';

describe('Milestone 2.5: Deep Customization & WCAG Accessibility Gateway', () => {
  describe('WCAG Relative Luminance Calculations', () => {
    test('Pure black has relative luminance of 0.0', () => {
      const [r, g, b] = hexToRgb('#000000');
      const lum = calculateRelativeLuminance(r, g, b);
      assert.equal(lum, 0);
    });

    test('Pure white has relative luminance of 1.0', () => {
      const [r, g, b] = hexToRgb('#ffffff');
      const lum = calculateRelativeLuminance(r, g, b);
      assert.equal(lum, 1);
    });

    test('RGB conversion accurately handles 3-char and 6-char hex strings', () => {
      assert.deepEqual(hexToRgb('#fff'), [255, 255, 255]);
      assert.deepEqual(hexToRgb('000'), [0, 0, 0]);
      assert.deepEqual(hexToRgb('#6366f1'), [99, 102, 241]);
    });
  });

  describe('WCAG 2.1 Contrast Ratio Verification', () => {
    test('Black on White achieves theoretical maximum contrast ratio of 21:1', () => {
      const ratio = calculateContrastRatio('#ffffff', '#000000');
      assert.equal(ratio, 21.0);
    });

    test('High-Contrast Theme satisfies WCAG AAA standard (>= 7.0:1)', () => {
      const hcBg = '#000000';
      const hcText = '#ffffff';
      const ratio = calculateContrastRatio(hcText, hcBg);

      assert.ok(ratio >= 7.0, `Expected AAA ratio >= 7.0, got ${ratio}`);
      assert.equal(isWcagCompliant(ratio, 'AAA'), true);
      assert.equal(isWcagCompliant(ratio, 'AA'), true);
    });

    test('Dark Theme default tokens satisfy WCAG AA & AAA standard', () => {
      const darkBg = '#030712';
      const darkText = '#f8fafc';
      const ratio = calculateContrastRatio(darkText, darkBg);

      assert.ok(ratio >= 15.0, `Expected dark theme ratio >= 15.0, got ${ratio}`);
      assert.equal(isWcagCompliant(ratio, 'AA'), true);
      assert.equal(isWcagCompliant(ratio, 'AAA'), true);
    });

    test('Light Theme default tokens satisfy WCAG AA & AAA standard', () => {
      const lightBg = '#f8fafc';
      const lightText = '#0f172a';
      const ratio = calculateContrastRatio(lightText, lightBg);

      assert.ok(ratio >= 14.0, `Expected light theme ratio >= 14.0, got ${ratio}`);
      assert.equal(isWcagCompliant(ratio, 'AA'), true);
      assert.equal(isWcagCompliant(ratio, 'AAA'), true);
    });

    test('Identical background and foreground colors fail compliance with 1:1 ratio', () => {
      const ratio = calculateContrastRatio('#1e293b', '#1e293b');
      assert.equal(ratio, 1.0);
      assert.equal(isWcagCompliant(ratio, 'AA'), false);
      assert.equal(isWcagCompliant(ratio, 'AAA'), false);
    });
  });
});
