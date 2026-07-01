import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getThreadMessages,
  sendThreadMessage,
  updateThreadStatus,
  type ThreadResponse,
  type MessageResponse,
} from '../../api/applicationApi';
import Pill from '../../components/Pill';
import Btn from '../../components/Btn';
import { relativeTime, counterpartName, STATUS_KIND, STATUS_LABEL, isClosed } from '../../utils/inbox';

/**
 * The right-hand conversation panel: header, live message list, reply box, and — for
 * application threads — status actions. Shared by the Messages and Applications screens.
 * Message list refetches on SSE pushes (the stream invalidates ['thread-messages', id]).
 */
export default function ThreadConversation({
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
    mutationFn: (status: 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'READ' | 'UNDER_REVIEW') =>
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
  const closed = isClosed(thread);

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
          {thread.status && <Pill kind={STATUS_KIND[thread.status]}>{STATUS_LABEL[thread.status] ?? thread.status}</Pill>}
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

      {/* Reply box + application actions */}
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
              {isApplication && isCorp && thread.status !== 'UNDER_REVIEW' && (
                <Btn sm ghost onClick={() => statusMutation.mutate('UNDER_REVIEW')}>Under review</Btn>
              )}
              {isApplication && isCorp && thread.status !== 'ACCEPTED' && (
                <Btn sm primary onClick={() => statusMutation.mutate('ACCEPTED')}>Approve</Btn>
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
          // this thread is closed · status: {STATUS_LABEL[thread.status ?? ''] ?? thread.status}
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
