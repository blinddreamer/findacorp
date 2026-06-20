// Shared timezone helpers. EVE activity is reasoned about as a set of active
// UTC hours; these utilities convert between that set and human-facing labels.

/** Classify a set of active UTC hours into an EVE prime-time bucket. */
export function inferTz(hours: number[]): string {
  if (!hours.length) return '';
  const eu = hours.filter(h => h >= 16 && h <= 23).length;
  const us = hours.filter(h => h >= 0 && h <= 7).length;
  const au = hours.length - eu - us;
  if (eu >= us && eu >= au) return 'EU';
  if (us >= eu && us >= au) return 'US';
  return 'AU';
}

/** "18:00 – 24:00" label for a set of hours (sorted, so order-independent). */
export function hoursRange(hours: number[]): string {
  if (!hours.length) return '';
  const s = [...hours].sort((a, b) => a - b);
  return `${String(s[0]).padStart(2, '0')}:00 – ${String(s[s.length - 1] + 1).padStart(2, '0')}:00`;
}

/** Inclusive list of hours from `from` to `to`, wrapping past midnight (e.g. 22→03). */
export function buildRange(from: number, to: number): number[] {
  const hours: number[] = [];
  let h = from;
  for (let i = 0; i < 25; i++) {
    hours.push(h);
    if (h === to) break;
    h = (h + 1) % 24;
  }
  return hours;
}

/**
 * Recover a [from, to] window from a set of active hours, detecting midnight wrap.
 * The inactive period is the largest gap between consecutive active hours (wrapping
 * around 24h); the active window runs from the hour after that gap to the hour before it.
 */
export function detectRange(hours: number[]): [number, number] {
  if (!hours.length) return [18, 23];
  const sorted = [...new Set(hours)].sort((a, b) => a - b);
  if (sorted.length === 1) return [sorted[0], sorted[0]];

  let gapStart = sorted[sorted.length - 1]; // last active hour before the gap
  let gapEnd = sorted[0];                    // first active hour after the gap
  let maxGap = sorted[0] + 24 - sorted[sorted.length - 1]; // wrap-around gap
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap > maxGap) {
      maxGap = gap;
      gapStart = sorted[i - 1];
      gapEnd = sorted[i];
    }
  }
  return [gapEnd, gapStart];
}
