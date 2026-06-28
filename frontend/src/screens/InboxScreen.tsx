import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getThreads,
  getThreadMessages,
  sendThreadMessage,
  updateThreadStatus,
  type ThreadResponse,
  type MessageResponse,
} from '../api/applicationApi';
import { useAuth } from '../auth/useAuth';
import Avatar from '../components/Avatar';
import CorpLogo from '../components/CorpLogo';
import Pill from '../components/Pill';
import Btn from '../components/Btn';

type Tab = 'received' | 'sent';

const STATUS_KIND: Record<string, string> = {
  SENT: 'accent',
  READ: '',
  ACCEPTED: 'good',
  REJECTED: 'danger',
  WITHDRAWN: 'danger',
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** A thread is "sent" if the viewer initiated it; everything else is "received". */
function isSent(t: ThreadResponse): boolean {
  if (t.direction === 'PILOT_TO_CORP') return t.mySide === 'PILOT';
  if (t.direction === 'CORP_TO_PILOT') return t.mySide === 'CORP';
  return false; // DIRECT / SYSTEM land in the received inbox
}

export default function InboxScreen() {
  const [tab, setTab] = useState<Tab>('received');
  const [selected, setSelected] = useState<ThreadResponse | null>(null);
  const auth = useAuth();

  const { data: threads = [] } = useQuery({
    queryKey: ['threads'],
    queryFn: getThreads,
    enabled: !!auth.token,
  });

  const received = threads.filter(t => !isSent(t));
  const sent = threads.filter(isSent);
  const list = tab === 'received' ? received : sent;
  const receivedUnread = received.filter(t => t.unread).length;

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow">// INBOX · {auth.characterName ?? 'pilot'}</div>
        <h2 style={{ marginTop: 6 }}>Messages</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            <div
              className={`tab ${tab === 'received' ? 'active' : ''}`}
              onClick={() => setTab('received')}
            >
              RECEIVED
              {receivedUnread > 0 && (
                <span className="mono" style={{ color: 'var(--accent-text)', marginLeft: 6, fontSize: 11 }}>
                  {receivedUnread}
                </span>
              )}
            </div>
            <div
              className={`tab ${tab === 'sent' ? 'active' : ''}`}
              onClick={() => setTab('sent')}
            >
              SENT
            </div>
          </div>

          <div className="card" style={{ padding: 0, borderRadius: '0 0 var(--radius) var(--radius)' }}>
            {list.length === 0 && (
              <div className="empty" style={{ padding: 24 }}>
                {tab === 'received' ? 'No incoming messages.' : 'No sent applications.'}
              </div>
            )}
            {list.map(t => (
              <ThreadRow
                key={t.id}
                thread={t}
                active={selected?.id === t.id}
                onClick={() => setSelected(t)}
              />
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div>
          {selected
            ? <ThreadPanel thread={selected} callerId={auth.characterId} onUpdate={setSelected} />
            : (
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--text-dim)' }}>
                <div style={{ textAlign: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }}>
                    <path d="M3 8 L12 13 L21 8 V18 H3 Z" /><path d="M3 8 L12 3 L21 8" />
                  </svg>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>select a message</div>
                </div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}

function counterpartName(t: ThreadResponse): string {
  return t.mySide === 'PILOT'
    ? (t.corpName ?? `Corp #${t.corpId}`)
    : (t.pilotName ?? `Pilot #${t.pilotId}`);
}

function ThreadRow({
  thread, active, onClick,
}: {
  thread: ThreadResponse; active: boolean; onClick: () => void;
}) {
  const isSystem = thread.type === 'SYSTEM';
  const name = isSystem
    ? (thread.subject ?? thread.corpName ?? 'FINDACORP')
    : counterpartName(thread);
  // Show the counterpart's avatar: if I'm the corp side, the counterpart is a pilot.
  // System notifications use the corp glyph rather than a pilot portrait.
  const counterpartIsPilot = !isSystem && thread.mySide === 'CORP';

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr auto',
        gap: 10,
        padding: '12px 14px',
        cursor: 'pointer',
        borderBottom: '1px solid var(--border-soft)',
        background: active ? 'var(--accent-soft)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      {counterpartIsPilot
        ? <Avatar seed={name} size={40} />
        : <CorpLogo corpId={thread.corpId} seed={name} size={40} />
      }
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: thread.unread ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {thread.unread && <span style={{ color: 'var(--accent-text)', marginRight: 6 }}>●</span>}
          {name}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {thread.lastMessage ?? thread.subject ?? ''}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, minWidth: 56 }}>
        {thread.status && <Pill kind={STATUS_KIND[thread.status] as any}>{thread.status}</Pill>}
        <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>
          {relativeTime(thread.lastMessageAt ?? thread.updatedAt)}
        </div>
      </div>
    </div>
  );
}

function ThreadPanel({
  thread, callerId, onUpdate,
}: {
  thread: ThreadResponse;
  callerId: number | null;
  onUpdate: (t: ThreadResponse) => void;
}) {
  const qc = useQueryClient();
  const [reply, setReply] = useState('');

  const { data: messages = [], isLoading, isSuccess } = useQuery({
    queryKey: ['thread-messages', thread.id],
    queryFn: () => getThreadMessages(thread.id),
  });

  // Opening a thread marks it read server-side; refresh inbox badges once loaded.
  useEffect(() => {
    if (isSuccess) {
      qc.invalidateQueries({ queryKey: ['threads'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    }
  }, [isSuccess, thread.id, qc]);

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendThreadMessage(thread.id, body),
    onSuccess: () => {
      setReply('');
      qc.invalidateQueries({ queryKey: ['thread-messages', thread.id] });
      qc.invalidateQueries({ queryKey: ['threads'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'READ') =>
      updateThreadStatus(thread.id, status),
    onSuccess: (updated) => {
      onUpdate(updated);
      qc.invalidateQueries({ queryKey: ['threads'] });
    },
  });

  const isPilot = thread.mySide === 'PILOT';
  const isCorp = thread.mySide === 'CORP';
  const isApplication = thread.type === 'APPLICATION';
  const isSystem = thread.type === 'SYSTEM';
  const closed = ['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(thread.status ?? '');

  // Link the counterpart name to their profile where we can resolve it.
  const profileTo = isSystem ? null
    : isCorp && thread.pilotId ? `/pilots/${thread.pilotId}`
    : isPilot && thread.corpId ? `/corps/${thread.corpId}`
    : null;
  const headerName = isSystem ? (thread.subject ?? 'FINDACORP') : counterpartName(thread);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0 }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 2 }}>
            {isSystem ? '// notification'
              : thread.direction === 'PILOT_TO_CORP' ? '// pilot application'
              : '// corp contact'}
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 500 }}>
            {profileTo
              ? <Link to={profileTo} style={{ color: 'var(--accent-text)', textDecoration: 'none' }}>{headerName}</Link>
              : headerName}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {thread.status && <Pill kind={STATUS_KIND[thread.status] as any}>{thread.status}</Pill>}
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{relativeTime(thread.updatedAt)}</div>
        </div>
      </div>

      {/* Thread messages */}
      <div style={{ flex: 1, maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {isLoading && (
          <div className="mono" style={{ padding: 16, fontSize: 11, color: 'var(--text-dim)' }}>loading thread…</div>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="mono" style={{ padding: 16, fontSize: 11, color: 'var(--text-dim)' }}>no messages yet</div>
        )}
        {messages.map(m => (
          <MessageBubble key={m.id} msg={m} isMine={callerId === m.senderId} />
        ))}
      </div>

      {/* Reply box */}
      {!closed && !isSystem && (
        <div style={{ padding: 14, borderTop: '1px solid var(--border-soft)' }}>
          <textarea
            className="input"
            placeholder="Write a reply…"
            style={{ minHeight: 72, resize: 'vertical', marginBottom: 10 }}
            value={reply}
            onChange={e => setReply(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {isApplication && isCorp && thread.status !== 'ACCEPTED' && (
                <Btn sm primary onClick={() => statusMutation.mutate('ACCEPTED')}>Accept</Btn>
              )}
              {isApplication && isCorp && thread.status !== 'REJECTED' && (
                <Btn sm onClick={() => statusMutation.mutate('REJECTED')}>Reject</Btn>
              )}
              {isApplication && isPilot && thread.status !== 'WITHDRAWN' && (
                <Btn sm ghost onClick={() => statusMutation.mutate('WITHDRAWN')}>Withdraw</Btn>
              )}
            </div>
            <Btn
              sm primary
              disabled={!reply.trim() || sendMutation.isPending}
              onClick={() => sendMutation.mutate(reply)}
            >
              {sendMutation.isPending ? 'Sending…' : 'Send →'}
            </Btn>
          </div>
        </div>
      )}

      {closed && (
        <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border-soft)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
          // this thread is closed · status: {thread.status}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg, isMine }: { msg: MessageResponse; isMine: boolean }) {
  const who = msg.senderId == null ? 'system' : isMine ? 'you' : `sender #${msg.senderId}`;
  return (
    <div style={{
      padding: '10px 18px',
      borderBottom: '1px solid var(--border-soft)',
      background: isMine ? 'var(--accent-soft)' : 'transparent',
    }}>
      <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>
        {who} · {relativeTime(msg.sentAt)}
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-mid)', whiteSpace: 'pre-wrap' }}>
        {msg.body}
      </div>
    </div>
  );
}
