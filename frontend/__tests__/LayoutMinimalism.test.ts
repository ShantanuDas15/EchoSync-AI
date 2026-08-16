import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  createTelemetryState,
  toggleTelemetryState,
  calculateMaxDomDepth,
  validateMinimalNesting
} from '../src/lib/layoutMinimalism';
import fs from 'node:fs';
import path from 'node:path';

describe('Milestone 4.3: Function-Driven Minimalism & Layout De-nesting Gateway', () => {

  describe('Progressive Disclosure State & Telemetry Collapsing', () => {
    test('createTelemetryState defaults to collapsed state (isExpanded: false)', () => {
      const state = createTelemetryState();
      assert.equal(state.isExpanded, false, 'Telemetry should default to collapsed state');
      assert.ok(state.autoCollapseMs && state.autoCollapseMs > 0);
    });

    test('toggleTelemetryState toggles between collapsed and expanded cleanly', () => {
      const initial = createTelemetryState(false);
      const expanded = toggleTelemetryState(initial);
      assert.equal(expanded.isExpanded, true);

      const collapsedAgain = toggleTelemetryState(expanded);
      assert.equal(collapsedAgain.isExpanded, false);
    });
  });

  describe('DOM Nesting Depth Calculation & De-nesting Assertions', () => {
    test('calculateMaxDomDepth computes nested tag levels accurately', () => {
      const sampleFlat = `<div class="root"><header><h1>Title</h1></header><main><p>Content</p></main></div>`;
      assert.equal(calculateMaxDomDepth(sampleFlat), 3);

      const sampleDeep = `<div><div><div><div><div><div><div><span>Deep</span></div></div></div></div></div></div></div>`;
      assert.equal(calculateMaxDomDepth(sampleDeep), 8);
      assert.equal(validateMinimalNesting(calculateMaxDomDepth(sampleDeep), 7), false);
    });

    test('DialogueBlock source code conforms to minimal nesting limits', () => {
      const dialogueBlockPath = path.resolve(__dirname, '../src/components/studio/DialogueBlock.tsx');
      const content = fs.readFileSync(dialogueBlockPath, 'utf8');

      // Verify no over-nested card classes like multiple layers of rounded border cards
      const borderCardsCount = (content.match(/glass-panel|border rounded/g) || []).length;
      assert.ok(borderCardsCount <= 2, 'DialogueBlock must not contain excessive nested border cards');
      
      // Verify presence of aria-labels and semantic tokens
      assert.ok(content.includes('aria-label='), 'Must include accessible labels');
      assert.ok(content.includes('bg-surface-'), 'Must use semantic surface tokens');
    });

    test('VoiceCard source code maintains clean, flattened visual hierarchy', () => {
      const voiceCardPath = path.resolve(__dirname, '../src/components/ui/VoiceCard.tsx');
      const content = fs.readFileSync(voiceCardPath, 'utf8');

      assert.ok(content.includes('data-testid="voice-card-grid"'));
      assert.ok(content.includes('data-testid="voice-card-list"'));
      assert.ok(content.includes('bg-surface-'), 'Must use semantic surface tokens');
    });

    test('TelemetryBar source code supports accessible disclosure toggling', () => {
      const telemetryPath = path.resolve(__dirname, '../src/components/layout/TelemetryBar.tsx');
      const content = fs.readFileSync(telemetryPath, 'utf8');

      assert.ok(content.includes('aria-expanded'), 'Must bind aria-expanded');
      assert.ok(content.includes('data-tour="telemetry-bar"'), 'Must maintain tour hook');
    });
  });

});
