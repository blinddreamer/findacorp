import { useState } from 'react';
import type { PilotProfile } from '../../types/pilot';
import { fmtSP } from '../../utils/format';

export default function PilotSkills({ p }: { p: PilotProfile }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!p.spByCat && (!p.skills || p.skills.length === 0)) {
    return <div className="card" style={{ padding: 32, textAlign: 'center' }}>Skill data not yet synced.</div>;
  }

  const categories = p.spByCat
    ? Object.entries(p.spByCat).sort((a, b) => b[1] - a[1])
    : [];
  const max = categories.length > 0 ? categories[0][1] : 1;

  return (
    <div className="card">
      <div className="section-head">
        <h3>Skills by category</h3>
        {p.sp != null && <span className="label">/ {fmtSP(p.sp)} total</span>}
      </div>
      <div>
        {categories.map(([name, val]) => {
          const isOpen = expanded === name;
          const catSkills = (p.skills ?? [])
            .filter(s => s.category === name)
            .sort((a, b) => b.level - a.level || b.points - a.points);
          return (
            <div key={name}>
              <div
                onClick={() => setExpanded(isOpen ? null : name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '9px 0', cursor: 'pointer',
                  borderBottom: isOpen ? 'none' : '1px solid var(--border-soft)',
                }}
              >
                <div style={{ width: 160, fontSize: 12.5, flexShrink: 0, color: isOpen ? 'var(--accent-text)' : 'var(--text)' }}>
                  {name}
                </div>
                <div style={{ flex: 1, height: 4, background: 'var(--bg-elev)', borderRadius: 2 }}>
                  <div style={{
                    width: (val / max * 100) + '%', height: '100%', borderRadius: 2,
                    background: isOpen ? 'var(--accent)' : 'var(--accent-soft)',
                    transition: 'background 0.15s',
                  }} />
                </div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-mute)', width: 56, textAlign: 'right', flexShrink: 0 }}>
                  {fmtSP(val)}
                </div>
                <span style={{
                  fontSize: 9, color: 'var(--text-mute)', flexShrink: 0, width: 14, textAlign: 'center',
                  transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block',
                }}>▶</span>
              </div>
              {isOpen && (
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
                  padding: '8px 0 10px', borderBottom: '1px solid var(--border-soft)',
                }}>
                  {catSkills.length > 0 ? catSkills.map(s => (
                    <div key={s.skillName} className="skill-cell">
                      <div className="top"><span className="name">{s.skillName}</span><span className="val">{s.level}</span></div>
                      <div className="dots">{[1, 2, 3, 4, 5].map(i => <span key={i} className={i <= s.level ? 'on' : ''} />)}</div>
                    </div>
                  )) : (
                    <div className="muted" style={{ gridColumn: '1/-1', fontSize: 12, padding: '4px 0' }}>
                      Skill details will appear after next sync.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
