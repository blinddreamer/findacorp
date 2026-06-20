import { describe, it, expect } from 'vitest';
import { fmtSP, fmtISK } from './format';

describe('fmtSP', () => {
  it('formats millions, dropping a trailing .0', () => {
    expect(fmtSP(25_000_000)).toBe('25M');
    expect(fmtSP(1_500_000)).toBe('1.5M');
    expect(fmtSP(1_000_000)).toBe('1M');
  });

  it('formats thousands and small values', () => {
    expect(fmtSP(5_000)).toBe('5K');
    expect(fmtSP(500)).toBe('500');
  });
});

describe('fmtISK', () => {
  it('scales by magnitude', () => {
    expect(fmtISK(2_500_000_000_000)).toBe('2.5T');
    expect(fmtISK(1_500_000_000)).toBe('1.5B');
    expect(fmtISK(3_000_000)).toBe('3M');
    expect(fmtISK(4_000)).toBe('4K');
    expect(fmtISK(750)).toBe('750');
  });
});
