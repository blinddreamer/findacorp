import { useState } from 'react';
import type { CorpProfile, CorpMemberEntry } from '../../types/corp';
import Btn from '../../components/Btn';
import Stat from '../../components/Stat';

export default function CorpMembers({ c }: { c: CorpProfile }) {
  const capacity = c.capacity ?? null;
  const members  = c.members ?? null;
  const pct      = members != null && capacity != null ? Math.round(members / capacity * 100) : null;
  const roster: CorpMemberEntry[] = c.roster ?? [];
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? roster.filter(m => m.characterName.toLowerCase().includes(search.toLowerCase()))
    : roster;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>

      {/* Left: stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card">
          <div className="section-head"><h3>Overview</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {members != null && <Stat label="Members" value={members.toLocaleString()} accent />}
            {capacity != null && <Stat label="Capacity" value={capacity.toLocaleString()} />}
          </div>
          {members != null && capacity != null && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="stat-label">Capacity used</span>
                <span className="mono" style={{ fontSize: 12 }}>{pct}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-elev)', borderRadius: 3 }}>
                <div style={{ width: `${Math.min(pct ?? 0, 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: 3, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}
          {members == null && <div className="muted" style={{ textAlign: 'center', padding: 24, fontSize: 13 }}>Member data not yet synced.</div>}
        </div>
        <div className="card">
          <div className="section-head"><h3>External</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Btn ghost onClick={() => window.open(`https://evewho.com/corp/${c.corpId}`, '_blank')}>
              EVE Who ↗
            </Btn>
          </div>
        </div>
      </div>

      {/* Right: roster */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div className="section-head">
          <h3>Roster{roster.length > 0 ? ` · ${roster.length}` : ''}</h3>
          {roster.length === 0 && (
            <span className="muted" style={{ fontSize: 12 }}>awaiting sync</span>
          )}
        </div>
        {roster.length === 0 ? (
          <div className="muted" style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, lineHeight: 1.7 }}>
            Roster is sourced from EVE Who and appears after the next sync.<br />
            Some corps have limited public data, so the list may be partial.
          </div>
        ) : (
          <>
            <input
              className="input"
              placeholder="Search members…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ marginBottom: 12, fontSize: 13 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 480, overflowY: 'auto' }}>
              {filtered.map(m => (
                <div key={m.characterId} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 0', borderBottom: '1px solid var(--border-soft)',
                }}>
                  <img
                    src={`https://images.evetech.net/characters/${m.characterId}/portrait?size=32`}
                    alt={m.characterName}
                    style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'var(--bg-elev)' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span style={{ fontSize: 13 }}>{m.characterName}</span>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="muted" style={{ padding: '16px 0', fontSize: 13 }}>No members match "{search}".</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
