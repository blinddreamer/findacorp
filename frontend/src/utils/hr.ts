import type { CorpMemberEntry } from '../types/corp';

/** Add id if absent, remove if present — toggle semantics for HR appointment. */
export function toggleId(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
}

/** Resolve a character id to its roster name, falling back to "#<id>" when unknown. */
export function resolveMemberName(roster: CorpMemberEntry[], id: number): string {
  return roster.find(m => m.characterId === id)?.characterName ?? `#${id}`;
}

/**
 * Roster members eligible to be appointed HR — everyone except the CEO,
 * who can always edit the listing and so is never listed as a candidate.
 */
export function hrCandidates(roster: CorpMemberEntry[], ceoId?: number): CorpMemberEntry[] {
  return roster.filter(m => m.characterId !== ceoId);
}

/**
 * Appointed HR ids that are no longer present in the roster (e.g. the member
 * left the corp). Surfaced so a CEO can still see and revoke them.
 */
export function orphanedHrIds(hrIds: number[], roster: CorpMemberEntry[], ceoId?: number): number[] {
  return hrIds.filter(id => id !== ceoId && !roster.some(m => m.characterId === id));
}
