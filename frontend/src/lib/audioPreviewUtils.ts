/**
 * Utilities for Audio Previews, Waveform Generation, and Volume Normalization
 */

export function estimateSyllables(text: string): number {
  if (!text || !text.trim()) return 0;
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;

  let totalSyllables = 0;
  for (const word of words) {
    if (word.length <= 3) {
      totalSyllables += 1;
      continue;
    }
    // Count vowel groupings
    const cleaned = word.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
    const syllables = cleaned.match(/[aeiouy]{1,2}/g);
    totalSyllables += syllables ? Math.max(1, syllables.length) : 1;
  }
  return totalSyllables;
}

export function estimateDurationSeconds(text: string, wordsPerMinute: number = 150): number {
  if (!text || !text.trim()) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean);
  const baseMinutes = words.length / wordsPerMinute;
  let baseSeconds = baseMinutes * 60;

  // Add cadence pauses for punctuation
  const commaCount = (text.match(/[,;:]/g) || []).length;
  const periodCount = (text.match(/[.!?—]/g) || []).length;
  baseSeconds += (commaCount * 0.25) + (periodCount * 0.5);

  return Number(baseSeconds.toFixed(1));
}

export function generatePseudoWaveform(text: string, barCount: number = 24): number[] {
  if (!text || !text.trim() || barCount <= 0) {
    return Array.from({ length: barCount }, () => 0.15);
  }

  const bars: number[] = [];
  const words = text.split(/\s+/).filter(Boolean);
  const totalLength = text.length;

  for (let i = 0; i < barCount; i++) {
    const progress = i / barCount;
    const charIndex = Math.floor(progress * totalLength);
    const char = text[charIndex] || 'a';
    const charCode = char.charCodeAt(0);

    // Wave calculation based on position, char frequency, and harmonic resonance
    const sineMod = Math.sin((i / barCount) * Math.PI) * 0.4;
    const charMod = ((charCode % 17) / 17) * 0.4;
    const wordMod = ((words.length % 5) / 5) * 0.2;

    const rawHeight = 0.2 + sineMod + charMod + wordMod;
    const normalized = Math.min(1.0, Math.max(0.15, Number(rawHeight.toFixed(2))));
    bars.push(normalized);
  }

  return bars;
}

export interface NormalizationReport {
  risk: 'safe' | 'warning' | 'critical';
  estimatedDb: number;
  message: string;
}

export function evaluateClippingRisk(
  dVectorNorm: number,
  targetGainDb: number = 0
): NormalizationReport {
  // Reference unit norm is 1.0 (approx -1.0 dBFS headroom)
  // Higher norm indicates boosted spectral energy
  const baseDb = (dVectorNorm - 1.0) * 12.0 - 1.0;
  const totalDb = Number((baseDb + targetGainDb).toFixed(1));

  if (totalDb > 0.0) {
    return {
      risk: 'critical',
      estimatedDb: totalDb,
      message: `High clipping risk (+${totalDb} dBFS). Voice signal exceeds digital peak.`
    };
  } else if (totalDb > -0.5) {
    return {
      risk: 'warning',
      estimatedDb: totalDb,
      message: `Moderate headroom warning (${totalDb} dBFS). Transient peaks may saturate.`
    };
  }

  return {
    risk: 'safe',
    estimatedDb: totalDb,
    message: `Optimal headroom (${totalDb} dBFS). Clean zero-shot synthesis.`
  };
}
