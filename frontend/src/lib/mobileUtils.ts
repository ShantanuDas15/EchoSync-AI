/**
 * Pure helper functions for Mobile-First Responsiveness & Touch Interactions
 */

export const MOBILE_BREAKPOINT_PX = 768;
export const MIN_TOUCH_TARGET_SIZE_PX = 44;

export function isMobileViewport(width: number, breakpoint: number = MOBILE_BREAKPOINT_PX): boolean {
  return width < breakpoint;
}

export function isTouchTargetAccessible(
  widthPx: number,
  heightPx: number,
  minSize: number = MIN_TOUCH_TARGET_SIZE_PX
): boolean {
  return widthPx >= minSize && heightPx >= minSize;
}

export function shouldDismissBottomSheet(dragDistanceY: number, thresholdPx: number = 100): boolean {
  return dragDistanceY > thresholdPx;
}

export function calculateBottomSheetHeight(
  dragOffset: number,
  baseHeight: number,
  maxHeight: number
): number {
  if (baseHeight <= 0) return 0;
  const current = baseHeight - dragOffset;
  return Math.min(Math.max(0, current), maxHeight);
}

export function canMoveUp(index: number): boolean {
  return index > 0;
}

export function canMoveDown(index: number, totalLength: number): boolean {
  return index >= 0 && index < totalLength - 1;
}

export function reorderArrayItems<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) {
    return list;
  }
  const result = [...list];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}
