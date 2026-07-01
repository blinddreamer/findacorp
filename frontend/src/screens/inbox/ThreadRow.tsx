import Avatar from '../../components/Avatar';
import CorpLogo from '../../components/CorpLogo';
import Pill from '../../components/Pill';
import type { ThreadResponse } from '../../api/applicationApi';
import { relativeTime, counterpartName, STATUS_KIND, STATUS_LABEL } from '../../utils/inbox';

/**
 * A single conversation row in the left list. Unread threads are highlighted
 * (accent border + tint + accent name); once read they render in the normal colour.
 * `showStatus` toggles the status pill (shown for applications, hidden for messages).
 */
export default function ThreadRow({
  thread, active, onClick, showStatus = false,
}: {
  thread: ThreadResponse;
  active: boolean;
  onClick: () => void;
  showStatus?: boolean;
}) {
  const isSystem = thread.type === 'SYSTEM';
  const name = isSystem
    ? (thread.subject ?? thread.corpName ?? 'FINDACORP')
    : counterpartName(thread);
  // If I'm the corp side, the counterpart is a pilot; system notices use the corp glyph.
  const counterpartIsPilot = !isSystem && thread.mySide === 'CORP';
  const unread = thread.unread;

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
        borderLeft: `2px solid ${unread ? 'var(--accent)' : 'transparent'}`,
        background: active || unread ? 'var(--accent-soft)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      {counterpartIsPilot
        ? <Avatar characterId={thread.pilotId} seed={name} size={40} />
        : <CorpLogo corpId={thread.corpId} seed={name} size={40} />
      }
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: unread ? 600 : 500,
          color: unread ? 'var(--accent-text)' : 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {thread.lastMessage ?? thread.subject ?? ''}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, minWidth: 56 }}>
        {showStatus && thread.status && (
          <Pill kind={STATUS_KIND[thread.status]}>{STATUS_LABEL[thread.status] ?? thread.status}</Pill>
        )}
        <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>
          {relativeTime(thread.lastMessageAt ?? thread.updatedAt)}
        </div>
      </div>
    </div>
  );
}
