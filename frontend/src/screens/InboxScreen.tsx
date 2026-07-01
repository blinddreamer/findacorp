import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getThreads, type ThreadResponse } from '../api/applicationApi';
import { useAuth } from '../auth/useAuth';
import { isApplication } from '../utils/inbox';
import ThreadRow from './inbox/ThreadRow';
import ThreadConversation from './inbox/ThreadConversation';

/**
 * Messages: direct conversations and system notifications, as a single conversation
 * list (no sent/received split). Applications live on their own screen. Unread rows
 * are colour-highlighted; the open chat and the list refresh live via the SSE stream
 * (mounted app-wide in App), which invalidates these queries on any change.
 */
export default function InboxScreen() {
  const [selected, setSelected] = useState<ThreadResponse | null>(null);
  const auth = useAuth();

  const { data: threads = [] } = useQuery({
    queryKey: ['threads'],
    queryFn: getThreads,
    enabled: !!auth.token,
  });

  // Messages = everything that isn't an application (direct messages + system notices).
  const messages = threads.filter(t => !isApplication(t));

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow">// MESSAGES · {auth.characterName ?? 'pilot'}</div>
        <h2 style={{ marginTop: 6 }}>Messages</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Conversation list */}
        <div className="card" style={{ padding: 0 }}>
          {messages.length === 0 && (
            <div className="empty" style={{ padding: 24 }}>No messages yet.</div>
          )}
          {messages.map(t => (
            <ThreadRow
              key={t.id}
              thread={t}
              active={selected?.id === t.id}
              onClick={() => setSelected(t)}
            />
          ))}
        </div>

        {/* Conversation panel */}
        <div>
          {selected
            ? <ThreadConversation thread={selected} callerId={auth.characterId} onUpdate={setSelected} />
            : (
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--text-dim)' }}>
                <div style={{ textAlign: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }}>
                    <path d="M3 8 L12 13 L21 8 V18 H3 Z" /><path d="M3 8 L12 3 L21 8" />
                  </svg>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>select a conversation</div>
                </div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}
