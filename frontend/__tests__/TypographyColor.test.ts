import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  HSL_THEMES,
  TYPOGRAPHY_SYSTEM,
  parseHslString,
  hslToRgb,
  hslStringToHex,
  calculateHslContrastRatio,
  validateTypographyScale,
  TypographyToken
} from '../src/lib/designSystem';

describe('Milestone 4.1: Curated HSL Color System & Typographic Precision Gateway', () => {

  describe('HSL Parsing & Conversions', () => {
    test('parseHslString parses standard hsl correctly', () => {
      const parsed = parseHslString('hsl(220, 18%, 6%)');
      assert.equal(parsed.h, 220);
      assert.equal(parsed.s, 18);
      assert.equal(parsed.l, 6);
      assert.equal(parsed.a, 1.0);
    });

    test('parseHslString parses hsla with fractional alpha correctly', () => {
      const parsed = parseHslString('hsla(220, 16%, 10%, 0.85)');
      assert.equal(parsed.h, 220);
      assert.equal(parsed.s, 16);
      assert.equal(parsed.l, 10);
      assert.equal(parsed.a, 0.85);
    });

    test('hslStringToHex accurately translates HSL to Hex code', () => {
      const hexBlack = hslStringToHex('hsl(0, 0%, 0%)');
      assert.equal(hexBlack.toLowerCase(), '#000000');

      const hexWhite = hslStringToHex('hsl(0, 0%, 100%)');
      assert.equal(hexWhite.toLowerCase(), '#ffffff');
    });

    test('Invalid HSL strings throw descriptive error', () => {
      assert.throws(() => parseHslString('invalid-color'), /Invalid HSL format/);
    });
  });

  describe('Curated HSL Palette & Purple-on-Dark Elimination', () => {
    test('Dark theme background uses neutral charcoal base without purple/indigo bias', () => {
      const darkRoot = parseHslString(HSL_THEMES.dark.bgRoot);
      // Neutral charcoal is around hue 210-230 with low saturation <= 25%
      assert.ok(darkRoot.h >= 200 && darkRoot.h <= 240, `Expected hue in [200, 240], got ${darkRoot.h}`);
      assert.ok(darkRoot.s <= 25, `Expected low saturation <= 25%, got ${darkRoot.s}%`);
      assert.ok(darkRoot.l <= 10, `Expected deep luminance <= 10%, got ${darkRoot.l}%`);
    });

    test('Brand primary and accent tokens strictly avoid purple/violet hue spectrum (260deg-310deg)', () => {
      (['dark', 'light', 'high-contrast'] as const).forEach((themeName) => {
        const theme = HSL_THEMES[themeName];
        const primary = parseHslString(theme.brandPrimary);
        const accent = parseHslString(theme.brandAccent);

        // Assert hue is NOT in purple/violet zone [260, 310]
        const isPrimaryPurple = primary.h >= 260 && primary.h <= 310;
        const isAccentPurple = accent.h >= 260 && accent.h <= 310;

        assert.equal(isPrimaryPurple, false, `${themeName} brandPrimary (${primary.h}deg) is purple/violet!`);
        assert.equal(isAccentPurple, false, `${themeName} brandAccent (${accent.h}deg) is purple/violet!`);
      });
    });

    test('All theme palettes define complete token sets without missing variables', () => {
      const requiredTokens = [
        'bgRoot', 'bgPanel', 'bgElevated',
        'textPrimary', 'textSecondary', 'textMuted',
        'borderSubtle', 'borderElevated',
        'brandPrimary', 'brandHover', 'brandAccent',
        'statusOnline', 'statusWarning', 'statusError'
      ] as const;

      (['dark', 'light', 'high-contrast'] as const).forEach((themeName) => {
        const theme = HSL_THEMES[themeName];
        requiredTokens.forEach((token) => {
          assert.ok(theme[token], `Missing token ${token} in theme ${themeName}`);
          assert.doesNotThrow(() => parseHslString(theme[token]));
        });
      });
    });
  });

  describe('WCAG 2.1 Contrast Ratio Verification', () => {
    test('Dark theme primary text on bgRoot satisfies WCAG AAA (>= 7.0:1)', () => {
      const ratio = calculateHslContrastRatio(HSL_THEMES.dark.textPrimary, HSL_THEMES.dark.bgRoot);
      assert.ok(ratio >= 7.0, `Expected Dark textPrimary/bgRoot >= 7.0, got ${ratio}`);
    });

    test('Dark theme secondary text on bgPanel satisfies WCAG AA (>= 4.5:1)', () => {
      const ratio = calculateHslContrastRatio(HSL_THEMES.dark.textSecondary, HSL_THEMES.dark.bgPanel);
      assert.ok(ratio >= 4.5, `Expected Dark textSecondary/bgPanel >= 4.5, got ${ratio}`);
    });

    test('Light theme primary text on bgRoot satisfies WCAG AAA (>= 7.0:1)', () => {
      const ratio = calculateHslContrastRatio(HSL_THEMES.light.textPrimary, HSL_THEMES.light.bgRoot);
      assert.ok(ratio >= 7.0, `Expected Light textPrimary/bgRoot >= 7.0, got ${ratio}`);
    });

    test('Light theme secondary text on bgPanel satisfies WCAG AA (>= 4.5:1)', () => {
      const ratio = calculateHslContrastRatio(HSL_THEMES.light.textSecondary, HSL_THEMES.light.bgPanel);
      assert.ok(ratio >= 4.5, `Expected Light textSecondary/bgPanel >= 4.5, got ${ratio}`);
    });

    test('High-contrast theme achieves maximum accessibility (>= 15:1)', () => {
      const ratio = calculateHslContrastRatio(HSL_THEMES['high-contrast'].textPrimary, HSL_THEMES['high-contrast'].bgRoot);
      assert.ok(ratio >= 15.0, `Expected High-contrast textPrimary/bgRoot >= 15.0, got ${ratio}`);
    });
  });

  describe('Typographic Precision & Tracking Validation', () => {
    test('Display and headline typography enforce negative letter spacing to avoid untracked typefaces', () => {
      assert.equal(validateTypographyScale(TYPOGRAPHY_SYSTEM.display, 'display'), true);
      assert.equal(validateTypographyScale(TYPOGRAPHY_SYSTEM.headlineXl, 'headline'), true);
      assert.equal(validateTypographyScale(TYPOGRAPHY_SYSTEM.headlineLg, 'headline'), true);
      assert.equal(validateTypographyScale(TYPOGRAPHY_SYSTEM.headlineMd, 'headline'), true);

      // Verify specific numerical tracking
      const displayTracking = parseFloat(TYPOGRAPHY_SYSTEM.display.letterSpacing.replace('em', ''));
      assert.ok(displayTracking <= -0.025, `Display tracking must be <= -0.025em, got ${displayTracking}`);
    });

    test('Micro telemetry typography enforces positive letter spacing for uppercase legibility', () => {
      assert.equal(validateTypographyScale(TYPOGRAPHY_SYSTEM.monoTelemetry, 'telemetry'), true);

      const telemetryTracking = parseFloat(TYPOGRAPHY_SYSTEM.monoTelemetry.letterSpacing.replace('em', ''));
      assert.ok(telemetryTracking >= 0.04, `Telemetry tracking must be >= 0.04em, got ${telemetryTracking}`);
      assert.equal(TYPOGRAPHY_SYSTEM.monoTelemetry.textTransform, 'uppercase');
    });

    test('Typography tokens include font-weight and line-height definitions for zero layout shift', () => {
      Object.entries(TYPOGRAPHY_SYSTEM).forEach(([key, token]) => {
        assert.ok(token.fontSize, `Token ${key} missing fontSize`);
        assert.ok(token.lineHeight, `Token ${key} missing lineHeight`);
        assert.ok(token.letterSpacing, `Token ${key} missing letterSpacing`);
        assert.ok(token.fontWeight, `Token ${key} missing fontWeight`);
      });
    });
  });

});
