import type { ThreadResponse } from '../api/applicationApi';

/** Compact "3m ago" / "2h ago" / "5d ago" relative time. */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** Pill colour for each application status (keys of the Pill `kind` variants). */
export const STATUS_KIND: Record<string, string> = {
  SENT: 'accent',
  READ: '',
  UNDER_REVIEW: 'accent',
  ACCEPTED: 'good',
  REJECTED: 'danger',
  WITHDRAWN: 'danger',
};

/** Human label for each status — recruiter-facing vocabulary (ACCEPTED shows as "Approved"). */
export const STATUS_LABEL: Record<string, string> = {
  SENT: 'New',
  READ: 'Seen',
  UNDER_REVIEW: 'Under review',
  ACCEPTED: 'Approved',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

/** Terminal statuses — no further messages or transitions allowed. */
export const CLOSED_STATUSES = ['ACCEPTED', 'REJECTED', 'WITHDRAWN'];

export function isClosed(t: ThreadResponse): boolean {
  return CLOSED_STATUSES.includes(t.status ?? '');
}

export function isApplication(t: ThreadResponse): boolean {
  return t.type === 'APPLICATION';
}

/** The other party's display name from the viewer's perspective. */
export function counterpartName(t: ThreadResponse): string {
  return t.mySide === 'PILOT'
    ? (t.corpName ?? `Corp #${t.corpId}`)
    : (t.pilotName ?? `Pilot #${t.pilotId}`);
}
