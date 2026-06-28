import { describe, it, expect } from 'vitest';
import { parseRequirement, formatRequirement, splitRequirement } from './requirements';

describe('parseRequirement', () => {
  it('treats a plain requirement as mandatory', () => {
    expect(parseRequirement('SP: 10,000,000')).toEqual({ text: 'SP: 10,000,000', optional: false });
  });
  it('detects a trailing (optional) marker', () => {
    expect(parseRequirement('Voice: Mandatory (optional)')).toEqual({ text: 'Voice: Mandatory', optional: true });
  });
  it('is case-insensitive and tolerant of spacing around the marker', () => {
    expect(parseRequirement('ESI: Required   (Optional)  ')).toEqual({ text: 'ESI: Required', optional: true });
  });
  it('preserves text as typed when there is no marker (no trimming)', () => {
    expect(parseRequirement('SP: ')).toEqual({ text: 'SP: ', optional: false });
  });
});

describe('formatRequirement', () => {
  it('leaves a mandatory requirement unchanged', () => {
    expect(formatRequirement('SP: 10M', false)).toBe('SP: 10M');
  });
  it('appends the marker for an optional requirement', () => {
    expect(formatRequirement('SP: 10M', true)).toBe('SP: 10M (optional)');
  });
  it('round-trips through parseRequirement', () => {
    for (const [text, optional] of [['SP: 10M', false], ['Voice', true]] as const) {
      expect(parseRequirement(formatRequirement(text, optional))).toEqual({ text, optional });
    }
  });
});

describe('splitRequirement', () => {
  it('splits on the first colon', () => {
    expect(splitRequirement('SP: 10,000,000')).toEqual({ label: 'SP', value: '10,000,000' });
  });
  it('returns an empty value when there is no colon', () => {
    expect(splitRequirement('Active daily')).toEqual({ label: 'Active daily', value: '' });
  });
});
