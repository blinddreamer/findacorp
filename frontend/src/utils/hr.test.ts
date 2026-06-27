import { describe, it, expect } from 'vitest';
import { toggleId, resolveMemberName, hrCandidates, orphanedHrIds, currentCorpId, isCeoOrHr } from './hr';
import type { CorpMemberEntry, CorpProfile } from '../types/corp';
import type { PilotProfile } from '../types/pilot';

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

function histEntry(corpId: number | undefined, fromDate: string, toDate: string | null) {
  return { corpId, fromDate, toDate, corpName: `corp-${corpId}`, alliance: null, durationLabel: '' };
}

describe('currentCorpId', () => {
  it('returns the corp of the open (toDate null) history entry', () => {
    const pilot = { corpHistory: [
      histEntry(100, '2020-01-01', '2021-01-01'),
      histEntry(200, '2021-01-01', null),
    ] } as PilotProfile;
    expect(currentCorpId(pilot)).toBe(200);
  });
  it('falls back to the most recent dated entry when none are open', () => {
    const pilot = { corpHistory: [
      histEntry(100, '2020-01-01', '2021-01-01'),
      histEntry(200, '2021-06-01', '2022-01-01'),
    ] } as PilotProfile;
    expect(currentCorpId(pilot)).toBe(200);
  });
  it('returns null when history is missing or empty', () => {
    expect(currentCorpId(undefined)).toBeNull();
    expect(currentCorpId({ corpHistory: [] } as unknown as PilotProfile)).toBeNull();
  });
  it('ignores entries without a corpId', () => {
    const pilot = { corpHistory: [histEntry(undefined, '2021-01-01', null)] } as PilotProfile;
    expect(currentCorpId(pilot)).toBeNull();
  });
});

describe('isCeoOrHr', () => {
  const corp = { ceoId: 1, hrIds: [2, 3] } as CorpProfile;
  it('is true for the CEO', () => expect(isCeoOrHr(corp, 1)).toBe(true));
  it('is true for an appointed HR', () => expect(isCeoOrHr(corp, 2)).toBe(true));
  it('is false for a regular member', () => expect(isCeoOrHr(corp, 9)).toBe(false));
  it('is false when corp or character is missing', () => {
    expect(isCeoOrHr(null, 1)).toBe(false);
    expect(isCeoOrHr(corp, null)).toBe(false);
  });
  it('handles a corp with no hrIds', () => {
    expect(isCeoOrHr({ ceoId: 1 } as CorpProfile, 2)).toBe(false);
  });
});
