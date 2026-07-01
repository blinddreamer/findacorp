import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { refreshAccessToken } from '../auth/useAuth';

const STREAM_URL = '/api/inbox/stream';
const FATAL = 'inbox-stream-fatal';

/**
 * Subscribes to the inbox Server-Sent Events stream while `token` is set. Each pushed
 * event carries only a thread id; we react by invalidating the relevant React Query
 * caches so the UI refetches and stays live (threads list, unread badge, open chat).
 *
 * Keyed on the token: a refreshed access token re-runs the effect and reconnects with
 * the new bearer. Native EventSource can't send an Authorization header, so we use
 * fetch-event-source, which also handles reconnection with backoff on transient drops.
 */
export function useInboxStream(token: string | null) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!token) return;
    const ctrl = new AbortController();

    fetchEventSource(STREAM_URL, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
      async onopen(res) {
        if (res.ok) return;
        // Token expired mid-stream: refresh it (which updates the token and re-runs
        // this effect with a fresh bearer), then abort this attempt.
        if (res.status === 401) await refreshAccessToken();
        throw new Error(FATAL);
      },
      onmessage(ev) {
        if (ev.event !== 'inbox') return;
        qc.invalidateQueries({ queryKey: ['threads'] });
        qc.invalidateQueries({ queryKey: ['unread-count'] });
        try {
          const { threadId } = JSON.parse(ev.data) as { threadId?: number };
          if (threadId != null) qc.invalidateQueries({ queryKey: ['thread-messages', threadId] });
        } catch {
          /* ignore a malformed event — the list/badge invalidations above still ran */
        }
      },
      onerror(err) {
        // Re-throw our fatal (auth) error to stop; return for transient network errors
        // so the library reconnects with its built-in backoff.
        if (err instanceof Error && err.message === FATAL) throw err;
      },
    }).catch(() => {
      /* aborted on unmount, or a fatal error already handled above */
    });

    return () => ctrl.abort();
  }, [token, qc]);
}
