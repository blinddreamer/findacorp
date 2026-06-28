import { useQuery } from '@tanstack/react-query';
import { getPilot, getCorp } from '../api/profileApi';
import { useAuth } from './useAuth';
import { currentCorpId, isCeoOrHr, hasCorpListing } from '../utils/hr';
import { CORP_EDIT_RESTRICTED } from '../config';

export interface RecruiterStatus {
  /** True when the user is the CEO or an appointed HR of their current corp. */
  isRecruiter: boolean;
  /** False while the underlying profile/corp lookups are still in flight. */
  isResolved: boolean;
  /** The user's current corp id, when known. */
  corpId: number | null;
  /** True once the user's corp has a published recruitment listing. */
  hasListing: boolean;
}

/**
 * Resolves whether the logged-in user may use recruiter (HR) tools. In dev mode
 * (CORP_EDIT_RESTRICTED === false) any logged-in user qualifies, mirroring the
 * listing-edit permission in CorpListingScreen.
 *
 * Reuses the ['pilot', id] / ['corp', id] query caches, so when the user is
 * already viewing their own profile or corp these resolve without extra fetches.
 */
export function useRecruiterStatus(): RecruiterStatus {
  const auth = useAuth();

  const pilotQuery = useQuery({
    queryKey: ['pilot', auth.characterId],
    queryFn: () => getPilot(auth.characterId!),
    enabled: !!auth.characterId,
    staleTime: 5 * 60 * 1000,
  });

  const corpId = currentCorpId(pilotQuery.data);

  const corpQuery = useQuery({
    queryKey: ['corp', corpId],
    queryFn: () => getCorp(corpId!),
    enabled: !!corpId,
    staleTime: 5 * 60 * 1000,
  });

  const corpId_ = corpId ?? null;
  const hasListing = hasCorpListing(corpQuery.data);

  if (!auth.characterId) return { isRecruiter: false, isResolved: true, corpId: null, hasListing: false };
  if (!CORP_EDIT_RESTRICTED) return { isRecruiter: true, isResolved: true, corpId: corpId_, hasListing }; // dev mode

  if (pilotQuery.isPending) return { isRecruiter: false, isResolved: false, corpId: corpId_, hasListing };
  if (!corpId) return { isRecruiter: false, isResolved: true, corpId: null, hasListing: false }; // no corp ⇒ not a recruiter
  if (corpQuery.isPending) return { isRecruiter: false, isResolved: false, corpId: corpId_, hasListing };

  return { isRecruiter: isCeoOrHr(corpQuery.data, auth.characterId), isResolved: true, corpId: corpId_, hasListing };
}

/** Convenience boolean for places that don't need the loading state (e.g. nav). */
export function useIsRecruiter(): boolean {
  return useRecruiterStatus().isRecruiter;
}
