import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getThreads, type ThreadResponse } from '../api/applicationApi';
import { useAuth } from '../auth/useAuth';
import { isApplication } from '../utils/inbox';
import ThreadRow from './inbox/ThreadRow';
import ThreadConversation from './inbox/ThreadConversation';

type View = 'incoming' | 'mine';

/**
 * Applications, split from Messages. Uses the viewer's side on each application thread:
 *   - CORP side  → "Incoming": applications to the viewer's corp (CEO/HR review + status)
 *   - PILOT side → "Mine": applications the viewer submitted, with their statuses
 * The Incoming/Mine toggle only appears when the viewer actually has incoming applications
 * (i.e. is a recruiter). Live-refreshed by the app-wide SSE stream.
 */
export default function ApplicationsScreen() {
  const auth = useAuth();
  const [selected, setSelected] = useState<ThreadResponse | null>(null);
  const [view, setView] = useState<View>('incoming');

  const { data: threads = [] } = useQuery({
    queryKey: ['threads'],
    queryFn: getThreads,
    enabled: !!auth.token,
  });

  const applications = threads.filter(isApplication);
  const incoming = applications.filter(t => t.mySide === 'CORP');
  const mine = applications.filter(t => t.mySide === 'PILOT');

  const hasIncoming = incoming.length > 0;
  // Force "mine" when there are no incoming apps, so non-recruiters never see an empty toggle.
  const effectiveView: View = hasIncoming ? view : 'mine';
  const list = effectiveView === 'incoming' ? incoming : mine;
  const incomingUnread = incoming.filter(t => t.unread).length;

  function switchView(v: View) {
    setView(v);
    setSelected(null);
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow">// APPLICATIONS · {auth.characterName ?? 'pilot'}</div>
        <h2 style={{ marginTop: 6 }}>Applications</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>
        {/* List + optional Incoming/Mine toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {hasIncoming && (
            <div className="tabs" style={{ marginBottom: 0 }}>
              <div className={`tab ${effectiveView === 'incoming' ? 'active' : ''}`} onClick={() => switchView('incoming')}>
                INCOMING
                {incomingUnread > 0 && (
                  <span className="mono" style={{ color: 'var(--accent-text)', marginLeft: 6, fontSize: 11 }}>
                    {incomingUnread}
                  </span>
                )}
              </div>
              <div className={`tab ${effectiveView === 'mine' ? 'active' : ''}`} onClick={() => switchView('mine')}>
                MINE
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 0, borderRadius: hasIncoming ? '0 0 var(--radius) var(--radius)' : undefined }}>
            {list.length === 0 && (
              <div className="empty" style={{ padding: 24 }}>
                {effectiveView === 'incoming'
                  ? 'No incoming applications.'
                  : "You haven't applied to any corps yet."}
              </div>
            )}
            {list.map(t => (
              <ThreadRow
                key={t.id}
                thread={t}
                active={selected?.id === t.id}
                onClick={() => setSelected(t)}
                showStatus
              />
            ))}
          </div>
        </div>

        {/* Application detail + status actions */}
        <div>
          {selected
            ? <ThreadConversation thread={selected} callerId={auth.characterId} onUpdate={setSelected} />
            : (
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--text-dim)' }}>
                <div style={{ textAlign: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }}>
                    <path d="M14 2 H6 a2 2 0 0 0 -2 2 V20 a2 2 0 0 0 2 2 H18 a2 2 0 0 0 2 -2 V8 Z" /><path d="M14 2 V8 H20" />
                  </svg>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>select an application</div>
                </div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}
