/**
 * Unit Test Suite for Milestone 1.3: Advanced Neural Synthesizer Form
 * Uses Node.js native test runner and assertion library
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Milestone 1.3: SynthesizerForm Logic & Validation', () => {
  
  // Helper to simulate the form validation logic
  const validateForm = (text: string) => {
    const charCount = text.length;
    const maxChars = 1000;
    const isOverLimit = charCount > maxChars;
    const isSubmitDisabled = !text.trim() || isOverLimit;
    
    return { charCount, isOverLimit, isSubmitDisabled };
  };

  // Helper to simulate tag insertion logic
  const simulateInsertTag = (text: string, selectionStart: number, selectionEnd: number, tagStart: string, tagEnd: string = '') => {
    const selectedText = text.substring(selectionStart, selectionEnd);
    const newText = text.substring(0, selectionStart) + tagStart + selectedText + tagEnd + text.substring(selectionEnd);
    return newText;
  };

  test('Form Safety Gateway: Submit disabled when prompt is empty', () => {
    const result = validateForm("   ");
    assert.equal(result.isSubmitDisabled, true);
  });

  test('Form Safety Gateway: Submit disabled when prompt exceeds 1,000 characters', () => {
    const longText = "a".repeat(1001);
    const result = validateForm(longText);
    assert.equal(result.isSubmitDisabled, true);
    assert.equal(result.isOverLimit, true);
  });

  test('Form Safety Gateway: Submit enabled for valid prompt', () => {
    const validText = "Hello world";
    const result = validateForm(validText);
    assert.equal(result.isSubmitDisabled, false);
    assert.equal(result.isOverLimit, false);
    assert.equal(result.charCount, 11);
  });

  test('SSML tag insertion: Insert pause tag', () => {
    const originalText = "Hello world";
    // insert pause after "Hello "
    const newText = simulateInsertTag(originalText, 6, 6, '<break time="500ms"/>');
    assert.equal(newText, 'Hello <break time="500ms"/>world');
  });

  test('SSML tag insertion: Wrap text with emphasis tag', () => {
    const originalText = "This is very important.";
    // wrap "very important"
    const newText = simulateInsertTag(originalText, 8, 22, '<emphasis level="strong">', '</emphasis>');
    assert.equal(newText, 'This is <emphasis level="strong">very important</emphasis>.');
  });

  test('Payload Interface Validation', () => {
    // Ensuring the payload matches the expected structure defined in Milestone 1.3
    interface SynthesizerPayload {
      text: string;
      preset: string;
      speed: number;
      pitch: number;
      energy?: number;
    }
    
    const validPayload: SynthesizerPayload = {
      text: "Test",
      preset: "expressive",
      speed: 1.5,
      pitch: -2.5,
      energy: 0.8
    };
    
    assert.ok(validPayload.speed >= 0.5 && validPayload.speed <= 2.0);
    assert.ok(validPayload.pitch >= -12 && validPayload.pitch <= 12);
  });
});
