/**
 * EchoSync AI Layout Minimalism & Progressive Disclosure Engine
 * Milestone 4.3: De-nesting Hierarchy & Contextual Metric Disclosure
 */

export interface TelemetryDisclosureState {
  isExpanded: boolean;
  autoCollapseMs?: number;
}

/**
 * Creates initial telemetry progressive disclosure state (defaults to compact/collapsed)
 */
export function createTelemetryState(initialExpanded: boolean = false): TelemetryDisclosureState {
  return {
    isExpanded: initialExpanded,
    autoCollapseMs: 5000,
  };
}

/**
 * Toggles progressive disclosure state
 */
export function toggleTelemetryState(state: TelemetryDisclosureState): TelemetryDisclosureState {
  return {
    ...state,
    isExpanded: !state.isExpanded,
  };
}

/**
 * Calculates DOM nesting depth of a serialized HTML/JSX template structure
 */
export function calculateMaxDomDepth(htmlString: string): number {
  const openTags = htmlString.match(/<([a-zA-Z0-9-]+)(?:\s+[^>]*)?(?<!\/)>/g) || [];
  let currentDepth = 0;
  let maxDepth = 0;

  const tagRegex = /<\/?([a-zA-Z0-9-]+)(?:\s+[^>]*)?(\/?)>/g;
  let match;

  while ((match = tagRegex.exec(htmlString)) !== null) {
    const isClosing = match[0].startsWith('</');
    const isSelfClosing = match[2] === '/' || match[0].endsWith('/>') || ['img', 'input', 'br', 'hr'].includes(match[1].toLowerCase());

    if (isClosing) {
      currentDepth = Math.max(0, currentDepth - 1);
    } else if (!isSelfClosing) {
      currentDepth += 1;
      maxDepth = Math.max(maxDepth, currentDepth);
    }
  }

  return maxDepth;
}

/**
 * Validates that a component's JSX structure adheres to minimal nesting limits (< 8 levels max)
 */
export function validateMinimalNesting(maxDepth: number, maxAllowed: number = 7): boolean {
  return maxDepth <= maxAllowed;
}
