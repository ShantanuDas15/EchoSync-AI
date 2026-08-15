import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isMobileViewport,
  isTouchTargetAccessible,
  shouldDismissBottomSheet,
  calculateBottomSheetHeight,
  canMoveUp,
  canMoveDown,
  reorderArrayItems,
  MOBILE_BREAKPOINT_PX,
  MIN_TOUCH_TARGET_SIZE_PX
} from '../src/lib/mobileUtils';

describe('Milestone 3.3: Mobile-First Responsive Overhaul Gateway', () => {

  describe('Mobile Viewport & Breakpoint Detection', () => {
    test('Identifies standard mobile viewports accurately (< 768px)', () => {
      assert.equal(isMobileViewport(375), true); // iPhone SE / Mini
      assert.equal(isMobileViewport(390), true); // iPhone 14/15
      assert.equal(isMobileViewport(414), true); // iPhone Plus / Max
      assert.equal(isMobileViewport(767), true); // Mobile boundary
    });

    test('Identifies tablet and desktop viewports accurately (>= 768px)', () => {
      assert.equal(isMobileViewport(768), false); // iPad portrait
      assert.equal(isMobileViewport(1024), false); // iPad landscape / laptop
      assert.equal(isMobileViewport(1440), false); // Desktop HD
    });

    test('Custom breakpoint overrides default appropriately', () => {
      assert.equal(isMobileViewport(600, 640), true);
      assert.equal(isMobileViewport(700, 640), false);
    });
  });

  describe('Touch Target Accessibility Standard (44x44px Minimum)', () => {
    test('Standard 44x44px and above touch targets pass accessibility check', () => {
      assert.equal(isTouchTargetAccessible(44, 44), true);
      assert.equal(isTouchTargetAccessible(48, 48), true);
      assert.equal(isTouchTargetAccessible(120, 52), true);
    });

    test('Sub-44px targets fail touch accessibility standard', () => {
      assert.equal(isTouchTargetAccessible(40, 44), false);
      assert.equal(isTouchTargetAccessible(44, 30), false);
      assert.equal(isTouchTargetAccessible(24, 24), false);
    });
  });

  describe('Bottom Sheet Gesture Drag & Dismissal Calculations', () => {
    test('shouldDismissBottomSheet triggers true when dragged past threshold', () => {
      assert.equal(shouldDismissBottomSheet(100, 80), true);
      assert.equal(shouldDismissBottomSheet(81, 80), true);
      assert.equal(shouldDismissBottomSheet(50, 80), false);
      assert.equal(shouldDismissBottomSheet(0, 80), false);
    });

    test('calculateBottomSheetHeight calculates bounded current height', () => {
      const baseHeight = 500;
      const maxHeight = 700;

      assert.equal(calculateBottomSheetHeight(0, baseHeight, maxHeight), 500);
      assert.equal(calculateBottomSheetHeight(100, baseHeight, maxHeight), 400);
      assert.equal(calculateBottomSheetHeight(-100, baseHeight, maxHeight), 600);
      assert.equal(calculateBottomSheetHeight(-300, baseHeight, maxHeight), 700); // Clamped at maxHeight
      assert.equal(calculateBottomSheetHeight(600, baseHeight, maxHeight), 0); // Clamped at 0
    });
  });

  describe('Touch Dialogue Block Reordering Math', () => {
    test('canMoveUp allows moving up only when index > 0', () => {
      assert.equal(canMoveUp(0), false);
      assert.equal(canMoveUp(1), true);
      assert.equal(canMoveUp(3), true);
    });

    test('canMoveDown allows moving down only when index < total - 1', () => {
      assert.equal(canMoveDown(0, 3), true);
      assert.equal(canMoveDown(1, 3), true);
      assert.equal(canMoveDown(2, 3), false);
      assert.equal(canMoveDown(0, 1), false);
    });

    test('reorderArrayItems reorders elements immutably and accurately', () => {
      const initial = ['A', 'B', 'C', 'D'];
      const movedDown = reorderArrayItems(initial, 0, 1);
      assert.deepEqual(movedDown, ['B', 'A', 'C', 'D']);

      const movedUp = reorderArrayItems(movedDown, 1, 0);
      assert.deepEqual(movedUp, ['A', 'B', 'C', 'D']);

      const movedLast = reorderArrayItems(initial, 0, 3);
      assert.deepEqual(movedLast, ['B', 'C', 'D', 'A']);
    });

    test('reorderArrayItems returns unchanged list on invalid out-of-bounds indices', () => {
      const initial = ['A', 'B', 'C'];
      assert.deepEqual(reorderArrayItems(initial, -1, 1), initial);
      assert.deepEqual(reorderArrayItems(initial, 0, 10), initial);
    });
  });

});
