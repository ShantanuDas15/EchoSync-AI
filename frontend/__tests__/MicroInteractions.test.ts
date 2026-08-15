import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTiltAngles,
  calculateMagneticOffset,
  addToastToQueue,
  removeToastFromQueue,
  calculateRemainingDuration,
  clamp,
  interpolate,
  ToastItem
} from '../src/lib/microInteractions';

describe('Milestone 3.2: Advanced Micro-Interactions & Skeleton States Gateway', () => {

  describe('3D Tilt Physics & Angles Calculation', () => {
    const width = 300;
    const height = 400;
    const maxAngle = 10;

    test('Center cursor results in exact zero rotation and centered glare (50%, 50%)', () => {
      const result = calculateTiltAngles(width / 2, height / 2, width, height, maxAngle);
      assert.equal(result.rotateX, 0);
      assert.equal(result.rotateY, 0);
      assert.equal(result.glareX, 50);
      assert.equal(result.glareY, 50);
    });

    test('Top-Right corner yields positive rotateX, positive rotateY, and glare at top-right', () => {
      const result = calculateTiltAngles(width, 0, width, height, maxAngle);
      assert.equal(result.rotateY, maxAngle);
      assert.equal(result.rotateX, maxAngle);
      assert.equal(result.glareX, 100);
      assert.equal(result.glareY, 0);
    });

    test('Bottom-Left corner yields negative rotateX, negative rotateY, and glare at bottom-left', () => {
      const result = calculateTiltAngles(0, height, width, height, maxAngle);
      assert.equal(result.rotateY, -maxAngle);
      assert.equal(result.rotateX, -maxAngle);
      assert.equal(result.glareX, 0);
      assert.equal(result.glareY, 100);
    });

    test('Out-of-bounds coordinates clamp strictly to maxAngle and [0, 100]% glare', () => {
      const result = calculateTiltAngles(1000, -500, width, height, maxAngle);
      assert.equal(result.rotateY, maxAngle);
      assert.equal(result.rotateX, maxAngle);
      assert.equal(result.glareX, 100);
      assert.equal(result.glareY, 0);
    });

    test('Invalid or zero dimension fallback returns safe zero rotation without NaN', () => {
      const result = calculateTiltAngles(50, 50, 0, 0, maxAngle);
      assert.equal(result.rotateX, 0);
      assert.equal(result.rotateY, 0);
      assert.equal(result.glareX, 50);
      assert.equal(result.glareY, 50);
    });
  });

  describe('Magnetic Button Cursor Offset Calculation', () => {
    const width = 120;
    const height = 48;
    const maxOffset = 8;

    test('Center cursor results in zero offset', () => {
      const result = calculateMagneticOffset(60, 24, width, height, maxOffset);
      assert.equal(result.offsetX, 0);
      assert.equal(result.offsetY, 0);
    });

    test('Right edge cursor calculates maximum positive X offset', () => {
      const result = calculateMagneticOffset(120, 24, width, height, maxOffset);
      assert.equal(result.offsetX, maxOffset);
      assert.equal(result.offsetY, 0);
    });

    test('Top-Left corner calculates negative offsets bounded by maxOffset', () => {
      const result = calculateMagneticOffset(0, 0, width, height, maxOffset);
      assert.equal(result.offsetX, -maxOffset);
      assert.equal(result.offsetY, -maxOffset);
    });

    test('Zero dimension gracefully returns zero offset without throwing', () => {
      const result = calculateMagneticOffset(10, 10, 0, 0, maxOffset);
      assert.equal(result.offsetX, 0);
      assert.equal(result.offsetY, 0);
    });
  });

  describe('Stacked Toast Queue & State Transitions', () => {
    test('addToastToQueue appends new toast item', () => {
      const queue: ToastItem[] = [];
      const item: ToastItem = { id: '1', message: 'First toast', type: 'Success', createdAt: 1000 };
      const updated = addToastToQueue(queue, item, 4);
      assert.equal(updated.length, 1);
      assert.equal(updated[0].id, '1');
    });

    test('addToastToQueue enforces max capacity by evicting oldest item', () => {
      let queue: ToastItem[] = [
        { id: '1', message: 'Msg 1', type: 'Info', createdAt: 100 },
        { id: '2', message: 'Msg 2', type: 'Info', createdAt: 200 },
        { id: '3', message: 'Msg 3', type: 'Info', createdAt: 300 }
      ];
      const newItem: ToastItem = { id: '4', message: 'Msg 4', type: 'Success', createdAt: 400 };
      const updated = addToastToQueue(queue, newItem, 3);

      assert.equal(updated.length, 3);
      assert.equal(updated.some(t => t.id === '1'), false, 'Oldest item 1 should be evicted');
      assert.equal(updated[2].id, '4');
    });

    test('removeToastFromQueue removes item by ID cleanly', () => {
      const queue: ToastItem[] = [
        { id: '1', message: 'A', type: 'Info', createdAt: 1 },
        { id: '2', message: 'B', type: 'Success', createdAt: 2 }
      ];
      const result = removeToastFromQueue(queue, '1');
      assert.equal(result.length, 1);
      assert.equal(result[0].id, '2');
    });
  });

  describe('Toast Timer & Progress Calculations', () => {
    const startTime = 1000;
    const totalDuration = 4000;

    test('Start of toast has 0% progress and full remaining duration', () => {
      const { remaining, progressPercent } = calculateRemainingDuration(startTime, totalDuration, 1000);
      assert.equal(remaining, 4000);
      assert.equal(progressPercent, 0);
    });

    test('Midway through duration has 50% progress', () => {
      const { remaining, progressPercent } = calculateRemainingDuration(startTime, totalDuration, 3000);
      assert.equal(remaining, 2000);
      assert.equal(progressPercent, 50);
    });

    test('Expiry time has 100% progress and 0 remaining duration', () => {
      const { remaining, progressPercent } = calculateRemainingDuration(startTime, totalDuration, 5500);
      assert.equal(remaining, 0);
      assert.equal(progressPercent, 100);
    });

    test('Paused duration pauses progress calculation accurately', () => {
      // 2000ms elapsed, but 1000ms was paused -> effective elapsed = 1000ms (25% progress)
      const { remaining, progressPercent } = calculateRemainingDuration(startTime, totalDuration, 3000, false, 1000);
      assert.equal(remaining, 3000);
      assert.equal(progressPercent, 25);
    });
  });

  describe('Math Utilities (Clamp & Interpolate)', () => {
    test('clamp bounds numbers between min and max', () => {
      assert.equal(clamp(5, 0, 10), 5);
      assert.equal(clamp(-5, 0, 10), 0);
      assert.equal(clamp(15, 0, 10), 10);
    });

    test('interpolate performs accurate linear lerp step', () => {
      assert.equal(interpolate(0, 100, 0.5), 50);
      assert.equal(interpolate(10, 20, 0.1), 11);
    });
  });

});
