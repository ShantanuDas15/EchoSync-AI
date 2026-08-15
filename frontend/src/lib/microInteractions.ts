/**
 * Pure helper functions for Physics-based Micro-Interactions & Toast Queues
 */

export interface TiltResult {
  rotateX: number; // degrees
  rotateY: number; // degrees
  glareX: number;  // percent (0 - 100)
  glareY: number;  // percent (0 - 100)
}

export interface MagneticResult {
  offsetX: number; // px
  offsetY: number; // px
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'Success' | 'Processing' | 'Error' | 'Warning' | 'Info';
  duration?: number; // ms, default 4000
  createdAt: number; // timestamp
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function interpolate(current: number, target: number, factor: number = 0.1): number {
  return current + (target - current) * factor;
}

/**
 * Computes 3D tilt angles based on mouse position within an element bounding box.
 * Standard perspective:
 * - Mouse at top causes positive tilt around X-axis (tilts backward)
 * - Mouse at right causes positive tilt around Y-axis
 */
export function calculateTiltAngles(
  mouseX: number,
  mouseY: number,
  width: number,
  height: number,
  maxAngle: number = 10
): TiltResult {
  if (width <= 0 || height <= 0) {
    return { rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 };
  }

  // Normalize coordinates from -1 to 1 relative to center
  const normX = clamp((mouseX - width / 2) / (width / 2), -1, 1);
  const normY = clamp((mouseY - height / 2) / (height / 2), -1, 1);

  // Invert Y for natural card tilt
  const rotateX = Number((-normY * maxAngle).toFixed(2));
  const rotateY = Number((normX * maxAngle).toFixed(2));

  // Glare position in percentage (0 to 100%)
  const glareX = Number((((normX + 1) / 2) * 100).toFixed(1));
  const glareY = Number((((normY + 1) / 2) * 100).toFixed(1));

  return { rotateX, rotateY, glareX, glareY };
}

/**
 * Computes magnetic pull offset for interactive buttons.
 */
export function calculateMagneticOffset(
  mouseX: number,
  mouseY: number,
  width: number,
  height: number,
  maxOffset: number = 8
): MagneticResult {
  if (width <= 0 || height <= 0) {
    return { offsetX: 0, offsetY: 0 };
  }

  const normX = clamp((mouseX - width / 2) / (width / 2), -1, 1);
  const normY = clamp((mouseY - height / 2) / (height / 2), -1, 1);

  const offsetX = Number((normX * maxOffset).toFixed(2));
  const offsetY = Number((normY * maxOffset).toFixed(2));

  return { offsetX, offsetY };
}

/**
 * Pure queue manipulation for Toast Notification Stacks
 */
export function addToastToQueue(
  queue: ToastItem[],
  newToast: ToastItem,
  maxCapacity: number = 4
): ToastItem[] {
  // Check for duplicate recent message to avoid spam
  const isDuplicate = queue.some(
    (t) => t.message === newToast.message && t.type === newToast.type && Date.now() - t.createdAt < 1500
  );
  if (isDuplicate) return queue;

  const next = [...queue, newToast];
  if (next.length > maxCapacity) {
    // Evict oldest toast that is not currently processing
    const firstNonProcessingIdx = next.findIndex((t) => t.type !== 'Processing');
    if (firstNonProcessingIdx !== -1) {
      next.splice(firstNonProcessingIdx, 1);
    } else {
      next.shift();
    }
  }
  return next;
}

export function removeToastFromQueue(queue: ToastItem[], id: string): ToastItem[] {
  return queue.filter((t) => t.id !== id);
}

/**
 * Calculates remaining progress percentage for toast progress bars
 */
export function calculateRemainingDuration(
  startTime: number,
  totalDuration: number,
  currentTime: number,
  isPaused: boolean = false,
  pausedDuration: number = 0
): { remaining: number; progressPercent: number } {
  if (totalDuration <= 0) return { remaining: 0, progressPercent: 0 };

  const effectiveElapsed = (isPaused ? currentTime : currentTime) - startTime - pausedDuration;
  const clampedElapsed = clamp(effectiveElapsed, 0, totalDuration);
  const remaining = Math.max(0, totalDuration - clampedElapsed);
  const progressPercent = Number((((totalDuration - remaining) / totalDuration) * 100).toFixed(1));

  return { remaining, progressPercent };
}
