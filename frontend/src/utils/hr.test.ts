import { describe, it, expect } from 'vitest';
import { toggleId, resolveMemberName, hrCandidates, orphanedHrIds } from './hr';
import type { CorpMemberEntry } from '../types/corp';

const roster: CorpMemberEntry[] = [
  { characterId: 1, characterName: 'CEO Bob' },
  { characterId: 2, characterName: 'Alice' },
  { characterId: 3, characterName: 'Carol' },
];

describe('toggleId', () => {
  it('adds an id when absent', () => {
    expect(toggleId([2], 3)).toEqual([2, 3]);
  });
  it('removes an id when present', () => {
    expect(toggleId([2, 3], 3)).toEqual([2]);
  });
  it('does not mutate the input array', () => {
    const input = [2];
    toggleId(input, 3);
    expect(input).toEqual([2]);
  });
});

describe('resolveMemberName', () => {
  it('resolves a known roster member', () => {
    expect(resolveMemberName(roster, 2)).toBe('Alice');
  });
  it('falls back to #id for unknown members', () => {
    expect(resolveMemberName(roster, 99)).toBe('#99');
  });
});

describe('hrCandidates', () => {
  it('excludes the CEO from candidates', () => {
    expect(hrCandidates(roster, 1).map(m => m.characterId)).toEqual([2, 3]);
  });
  it('returns the full roster when no CEO is known', () => {
    expect(hrCandidates(roster).map(m => m.characterId)).toEqual([1, 2, 3]);
  });
});

describe('orphanedHrIds', () => {
  it('flags appointed HR no longer in the roster', () => {
    expect(orphanedHrIds([2, 50], roster, 1)).toEqual([50]);
  });
  it('never flags the CEO', () => {
    expect(orphanedHrIds([1], roster, 1)).toEqual([]);
  });
  it('returns empty when all HR are present', () => {
    expect(orphanedHrIds([2, 3], roster, 1)).toEqual([]);
  });
});
