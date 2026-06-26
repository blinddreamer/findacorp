import type { CorpProfile, CorpAllianceEntry, CorpMemberEventEntry } from '../../types/corp';
import Pill from '../../components/Pill';

function computeAllianceDuration(startDate?: string, endDate?: string): string {
  if (!startDate) return '';
  const end = endDate ? new Date(endDate) : new Date();
  const start = new Date(startDate);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (months <= 0) return '';
  if (months >= 12) return `${Math.floor(months / 12)}y ${months % 12}m`;
  return `${months}m`;
}

export default function CorpHistory({ c }: { c: CorpProfile }) {
  const allianceHistory: CorpAllianceEntry[]    = c.allianceHistory  ?? [];
  const memberEvents:    CorpMemberEventEntry[]  = c.memberEvents     ?? [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

      {/* ── Left: member join / leave events ── */}
      <div className="card">
        <div className="section-head">
          <h3>Member changes</h3>
          <span className="label">/ joins &amp; departures</span>
        </div>
        {memberEvents.length === 0 ? (
          <div className="muted" style={{ textAlign: 'center', padding: 24, fontSize: 13, lineHeight: 1.7 }}>
            No member changes recorded yet.<br />
            Joins and departures are tracked from the first sync onward.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 520, overflowY: 'auto' }}>
            {memberEvents.map((ev, i) => {
              const isJoin = ev.eventType === 'JOINED';
              const date = new Date(ev.occurredAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
              return (
                <div key={`${ev.characterId}-${ev.occurredAt}-${i}`} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 0', borderBottom: i < memberEvents.length - 1 ? '1px solid var(--border-soft)' : 'none',
                }}>
                  <img
                    src={`https://images.evetech.net/characters/${ev.characterId}/portrait?size=32`}
                    alt={ev.characterName}
                    style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'var(--bg-elev)' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.characterName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{date}</div>
                  </div>
                  <span className="mono" style={{
                    fontSize: 11, flexShrink: 0,
                    color: isJoin ? 'oklch(0.72 0.18 145)' : 'var(--danger, #e74c3c)',
                  }}>
                    {isJoin ? '+ joined' : '− left'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Right: alliance history ── */}
      <div className="card">
        <div className="section-head">
          <h3>Alliance history</h3>
          <span className="label">/ EVE SSO</span>
        </div>
        {allianceHistory.length === 0 ? (
          <div className="muted" style={{ textAlign: 'center', padding: 24, fontSize: 13 }}>
            No alliance history recorded — either the corp has always been independent or data hasn't synced yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {allianceHistory.map((entry, i) => {
              const isCurrent = !entry.endDate;
              const duration = computeAllianceDuration(entry.startDate, entry.endDate);
              return (
                <div key={`${entry.allianceId}-${entry.startDate}`} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '12px 0', borderBottom: i < allianceHistory.length - 1 ? '1px solid var(--border-soft)' : 'none',
                }}>
                  {/* Timeline dot */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: isCurrent ? 'oklch(0.72 0.18 145)' : 'var(--text-mute)',
                    }} />
                    {i < allianceHistory.length - 1 && (
                      <div style={{ width: 1, flexGrow: 1, minHeight: 20, background: 'var(--border-soft)', marginTop: 4 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13.5, fontWeight: 500 }}>{entry.allianceName || `Alliance #${entry.allianceId}`}</span>
                      {isCurrent && <Pill kind="good"><span className="dot" />Current</Pill>}
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>
                      {entry.startDate} → {entry.endDate ?? 'Present'}
                      {duration ? ` · ${duration}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
