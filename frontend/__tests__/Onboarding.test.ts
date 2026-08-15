import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNextStep,
  calculatePrevStep,
  validateStepIndex,
  shouldAutoStartTour,
  getTourProgressPercent,
  filterTemplatesByCategory,
  convertTemplateToBlocks,
  DEFAULT_STUDIO_STEPS
} from '../src/lib/onboardingContext';
import { STORYBOARD_TEMPLATES } from '../src/lib/templatesData';
import { StoryboardTemplate } from '../src/types/onboarding';

describe('Milestone 3.1: Frictionless Onboarding & Contextual Help Gateway', () => {

  describe('Step Navigation & Boundary Clamping', () => {
    test('calculateNextStep advances step within valid bounds', () => {
      assert.equal(calculateNextStep(0, 6), 1);
      assert.equal(calculateNextStep(3, 6), 4);
    });

    test('calculateNextStep clamps at totalSteps - 1', () => {
      assert.equal(calculateNextStep(5, 6), 5);
      assert.equal(calculateNextStep(6, 6), 5);
    });

    test('calculateNextStep gracefully handles empty steps', () => {
      assert.equal(calculateNextStep(0, 0), 0);
    });

    test('calculatePrevStep decrements step down to zero', () => {
      assert.equal(calculatePrevStep(3), 2);
      assert.equal(calculatePrevStep(1), 0);
      assert.equal(calculatePrevStep(0), 0);
    });

    test('validateStepIndex clamps negative or excessive indices', () => {
      assert.equal(validateStepIndex(-5, 6), 0);
      assert.equal(validateStepIndex(10, 6), 5);
      assert.equal(validateStepIndex(2, 6), 2);
      assert.equal(validateStepIndex(0, 0), 0);
    });

    test('getTourProgressPercent correctly computes progression percentages', () => {
      assert.equal(getTourProgressPercent(0, 5), 20); // Step 1 of 5
      assert.equal(getTourProgressPercent(2, 5), 60); // Step 3 of 5
      assert.equal(getTourProgressPercent(4, 5), 100); // Step 5 of 5
      assert.equal(getTourProgressPercent(0, 0), 0);
    });

    test('shouldAutoStartTour returns true only for new uncompleted visitors', () => {
      assert.equal(shouldAutoStartTour(false, true), true);
      assert.equal(shouldAutoStartTour(true, true), false);
      assert.equal(shouldAutoStartTour(true, false), false);
      assert.equal(shouldAutoStartTour(false, false), false);
    });
  });

  describe('Default Studio Steps Specification Integrity', () => {
    test('DEFAULT_STUDIO_STEPS contains all 6 required studio milestones', () => {
      assert.ok(DEFAULT_STUDIO_STEPS.length >= 6);
    });

    test('Every tour step has non-empty ID, title, description, and valid CSS selector target', () => {
      for (const step of DEFAULT_STUDIO_STEPS) {
        assert.ok(step.id.trim().length > 0, `Step ${step.id} has empty ID`);
        assert.ok(step.title.trim().length > 0, `Step ${step.id} has empty title`);
        assert.ok(step.description.trim().length > 0, `Step ${step.id} has empty description`);
        assert.ok(step.targetSelector.startsWith('[data-tour=') || step.targetSelector.startsWith('.'), 
          `Step ${step.id} selector must be valid`);
      }
    });

    test('Step IDs are completely unique across the tour suite', () => {
      const ids = DEFAULT_STUDIO_STEPS.map(s => s.id);
      const uniqueIds = new Set(ids);
      assert.equal(ids.length, uniqueIds.size);
    });
  });

  describe('Storyboard Dialogue Templates & Filtering', () => {
    test('STORYBOARD_TEMPLATES contains curated scenarios across multiple categories', () => {
      assert.ok(STORYBOARD_TEMPLATES.length >= 5);
      const categories = new Set(STORYBOARD_TEMPLATES.map(t => t.category));
      assert.ok(categories.has('Podcast'));
      assert.ok(categories.has('Audiobook'));
      assert.ok(categories.has('Gaming'));
      assert.ok(categories.has('Commercial'));
      assert.ok(categories.has('Customer Support'));
    });

    test('filterTemplatesByCategory filters correctly by category pill', () => {
      const podcastTemplates = filterTemplatesByCategory(STORYBOARD_TEMPLATES, 'Podcast');
      assert.ok(podcastTemplates.length > 0);
      assert.ok(podcastTemplates.every(t => t.category === 'Podcast'));

      const allTemplates = filterTemplatesByCategory(STORYBOARD_TEMPLATES, 'All');
      assert.equal(allTemplates.length, STORYBOARD_TEMPLATES.length);
    });

    test('filterTemplatesByCategory filters accurately by search query across title, description, and tags', () => {
      const searchResults = filterTemplatesByCategory(STORYBOARD_TEMPLATES, 'All', 'cyberpunk');
      assert.ok(searchResults.length >= 1);
      assert.equal(searchResults[0].id, 'gaming-cyberpunk-briefing');

      const tagResults = filterTemplatesByCategory(STORYBOARD_TEMPLATES, 'All', 'tech');
      assert.ok(tagResults.length >= 1);
      assert.ok(tagResults.some(t => t.tags.includes('Tech')));
    });

    test('convertTemplateToBlocks produces valid BlockData array ready for Storyboard', () => {
      const sampleTemplate = STORYBOARD_TEMPLATES[0];
      const blocks = convertTemplateToBlocks(sampleTemplate);

      assert.equal(blocks.length, sampleTemplate.blocks.length);
      for (let i = 0; i < blocks.length; i++) {
        assert.ok(blocks[i].id.length > 0, 'Block ID must be generated');
        assert.equal(blocks[i].text, sampleTemplate.blocks[i].text);
        assert.equal(blocks[i].preset, sampleTemplate.blocks[i].preset);
      }
    });

    test('Every template contains valid dialogue blocks with non-empty text and presets', () => {
      for (const tpl of STORYBOARD_TEMPLATES) {
        assert.ok(tpl.blocks.length > 0, `Template ${tpl.id} has no blocks`);
        assert.ok(tpl.speakerCount >= 1, `Template ${tpl.id} must have >= 1 speaker`);
        for (const block of tpl.blocks) {
          assert.ok(block.text.trim().length > 0, `Template ${tpl.id} contains empty text block`);
          assert.ok(block.preset.trim().length > 0, `Template ${tpl.id} contains empty preset`);
        }
      }
    });
  });

});
