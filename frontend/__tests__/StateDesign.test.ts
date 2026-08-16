import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Milestone 4.4: Meticulous Micro-Interactions & State Design Gateway', () => {

  describe('ErrorState Component Specification & Accessibility', () => {
    test('ErrorState source code defines role="alert" and aria-live="assertive"', () => {
      const filePath = path.resolve(__dirname, '../src/components/ui/ErrorState.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      assert.ok(content.includes('role="alert"'), 'ErrorState must include role="alert"');
      assert.ok(content.includes('aria-live="assertive"'), 'ErrorState must include aria-live="assertive"');
      assert.ok(content.includes('ERR_'), 'ErrorState must format error codes');
      assert.ok(content.includes('onRetry'), 'ErrorState must support onRetry action');
    });

    test('ErrorState utilizes semantic status tokens rather than hardcoded colors', () => {
      const filePath = path.resolve(__dirname, '../src/components/ui/ErrorState.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      assert.ok(content.includes('status-error'), 'Must use status-error token');
      assert.ok(content.includes('bg-surface-'), 'Must use semantic surface token');
    });
  });

  describe('EmptyState Component Specification & Visual Hierarchy', () => {
    test('EmptyState source code defines accessible data-testid and structured typography', () => {
      const filePath = path.resolve(__dirname, '../src/components/ui/EmptyState.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      assert.ok(content.includes('data-testid="empty-state"'), 'Must have data-testid');
      assert.ok(content.includes('text-text-primary'), 'Must use semantic text tokens');
      assert.ok(content.includes('onAction'), 'Must support primary action CTA');
    });
  });

  describe('Micro-Interactions & Button State Transitions', () => {
    test('MagneticButton enforces cubic-bezier easing and physical scaling on hover', () => {
      const filePath = path.resolve(__dirname, '../src/components/ui/MagneticButton.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      assert.ok(content.includes('cubic-bezier'), 'Must use cubic-bezier transition curves');
      assert.ok(content.includes('scale(1.02)'), 'Must apply subtle 1.02 scale on hover');
      assert.ok(content.includes('will-change-transform'), 'Must optimize GPU rendering layer');
    });

    test('AudioRecorder uses semantic sky/surface tokens and smooth active scaling', () => {
      const filePath = path.resolve(__dirname, '../src/components/ui/AudioRecorder.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      assert.ok(content.includes('bg-sky-600'), 'Must use refined sky button token');
      assert.ok(content.includes('active:scale-95'), 'Must use tactile active press scaling');
      assert.ok(content.includes('focus-ring'), 'Must enforce focus-ring standard');
    });
  });

});
