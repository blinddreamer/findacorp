import type { CorpMemberEntry, CorpProfile } from '../types/corp';
import type { PilotProfile } from '../types/pilot';

/** Maximum number of HR managers a CEO may appoint — mirrors CorpService.MAX_HR on the backend. */
export const MAX_HR = 2;

/**
 * The pilot's current corp id, taken from their corp history: the open entry
 * (toDate === null). Falls back to the most recent dated entry when none are
 * open, and ignores entries without a corpId (e.g. unresolved NPC corps).
 */
export function currentCorpId(pilot?: PilotProfile | null): number | null {
  const history = pilot?.corpHistory;
  if (!history?.length) return null;
  const open = history.find(h => h.toDate == null && h.corpId != null);
  if (open?.corpId != null) return open.corpId;
  const dated = history.filter(h => h.corpId != null);
  if (!dated.length) return null;
  const latest = dated.reduce((a, b) => (a.fromDate >= b.fromDate ? a : b));
  return latest.corpId ?? null;
}

/** True when the character is the corp's CEO or one of its appointed HR. */
export function isCeoOrHr(corp: CorpProfile | null | undefined, characterId: number | null): boolean {
  if (!corp || characterId == null) return false;
  return corp.ceoId === characterId || (corp.hrIds ?? []).includes(characterId);
}

/**
 * True once a corp has a published recruitment listing — i.e. a recruiter has entered
 * any listing content. A bare, auto-synced corp (no recruiter input) is not "listed".
 */
export function hasCorpListing(corp: CorpProfile | null | undefined): boolean {
  if (!corp) return false;
  return Boolean(
    corp.tagline?.trim()
    || corp.pitch?.trim()
    || corp.rolesLooking?.length
    || corp.requirements?.length
    || corp.content?.length
    || corp.tzHours?.length,
  );
}

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
