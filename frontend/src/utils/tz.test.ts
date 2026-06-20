import { describe, it, expect } from 'vitest';
import { inferTz, hoursRange, buildRange, detectRange } from './tz';

describe('inferTz', () => {
  it('buckets active hours into a prime-time TZ', () => {
    expect(inferTz([18, 19, 20, 21])).toBe('EU');
    expect(inferTz([0, 1, 2, 3])).toBe('US');
    expect(inferTz([9, 10, 11, 12])).toBe('AU');
  });

  it('returns empty string when no hours are set', () => {
    expect(inferTz([])).toBe('');
  });
});

describe('buildRange', () => {
  it('builds an inclusive contiguous range', () => {
    expect(buildRange(18, 21)).toEqual([18, 19, 20, 21]);
  });

  it('wraps past midnight', () => {
    expect(buildRange(22, 2)).toEqual([22, 23, 0, 1, 2]);
  });
});

describe('detectRange', () => {
  it('recovers a simple range', () => {
    expect(detectRange([18, 19, 20, 21])).toEqual([18, 21]);
  });

  it('recovers a wrapping range (round-trips with buildRange)', () => {
    expect(detectRange([22, 23, 0, 1, 2])).toEqual([22, 2]);
    expect(detectRange(buildRange(22, 3))).toEqual([22, 3]);
  });

  it('defaults to 18–23 when empty', () => {
    expect(detectRange([])).toEqual([18, 23]);
  });
});

describe('hoursRange', () => {
  it('formats sorted first to last+1, order-independent', () => {
    expect(hoursRange([20, 18, 19])).toBe('18:00 – 21:00');
  });

  it('is empty when no hours are set', () => {
    expect(hoursRange([])).toBe('');
  });
});
