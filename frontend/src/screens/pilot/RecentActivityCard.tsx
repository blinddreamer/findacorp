import { useState } from 'react';
import type { PilotProfile, RecentSkillDto } from '../../types/pilot';

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86_400_000);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

interface RecentActivityCardProps {
  killHistory?: PilotProfile['killHistory'];
  skillQueue?: PilotProfile['skillQueue'];
  skills?: PilotProfile['skills'];
  recentSkills?: RecentSkillDto[];
}

export default function RecentActivityCard({ killHistory, skillQueue, skills, recentSkills }: RecentActivityCardProps) {
  const [tab, setTab] = useState<'skills' | 'kills'>('skills');

  const recentKills = (killHistory ?? []).filter(k => k.kind === 'kill').slice(0, 8);
  const recentLosses = (killHistory ?? []).filter(k => k.kind === 'loss').slice(0, 8);

  const isQueue = skillQueue && skillQueue.length > 0;
  const hasRecentLearned = recentSkills && recentSkills.length > 0;

  const tabs = [
    { key: 'skills' as const, label: 'RECENT SKILLS' },
    { key: 'kills' as const, label: 'RECENT KILLS' },
  ];

  let skillsHeading: string;
  if (tab !== 'skills') {
    skillsHeading = 'Recent kills';
  } else if (isQueue) {
    skillsHeading = 'In training';
  } else if (hasRecentLearned) {
    skillsHeading = 'Recently learned';
  } else {
    skillsHeading = 'Recent skills';
  }

  return (
    <div className="card">
      <div className="section-head">
        <h3>{skillsHeading}</h3>
        <div style={{ display: 'flex', gap: 4 }}>
          {tabs.map(t => (
            <span
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                padding: '2px 8px',
                borderRadius: 3,
                background: tab === t.key ? 'var(--accent-soft)' : 'transparent',
                color: tab === t.key ? 'var(--accent-text)' : 'var(--text-mute)',
                border: `1px solid ${tab === t.key ? 'var(--accent-line)' : 'transparent'}`,
                letterSpacing: '0.5px',
              }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {tab === 'skills' && (() => {
        if (isQueue) {
          const displaySkills = skillQueue!.slice(0, 8);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {displaySkills.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0',
                  borderBottom: i < displaySkills.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(dot => (
                      <span key={dot} style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: dot <= s.level ? 'var(--accent)' : 'var(--bg-elev)',
                        border: '1px solid var(--border)',
                      }} />
                    ))}
                  </div>
                  <div style={{ flex: 1, fontSize: 12.5 }}>{s.skillName}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--accent-text)' }}>→ L{s.level}</div>
                </div>
              ))}
            </div>
          );
        }

        if (hasRecentLearned) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentSkills!.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0',
                  borderBottom: i < recentSkills!.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(dot => (
                      <span key={dot} style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: dot <= s.level ? 'var(--accent)' : 'var(--bg-elev)',
                        border: '1px solid var(--border)',
                      }} />
                    ))}
                  </div>
                  <div style={{ flex: 1, fontSize: 12.5 }}>{s.skillName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--accent-text)' }}>L{s.level}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>{relativeTime(s.learnedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          );
        }

        const notableSkills = [...(skills ?? [])]
          .sort((a, b) => b.level - a.level || b.points - a.points)
          .filter(s => s.level >= 4)
          .slice(0, 8);

        if (notableSkills.length === 0) {
          return (
            <div className="muted" style={{ textAlign: 'center', padding: '16px 0', fontSize: 13 }}>
              Skill data not yet synced.
            </div>
          );
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {notableSkills.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0',
                borderBottom: i < notableSkills.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map(dot => (
                    <span key={dot} style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: dot <= s.level ? 'var(--accent)' : 'var(--bg-elev)',
                      border: '1px solid var(--border)',
                    }} />
                  ))}
                </div>
                <div style={{ flex: 1, fontSize: 12.5 }}>{s.skillName}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--accent-text)' }}>L{s.level}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {tab === 'kills' && (
        recentKills.length === 0 && recentLosses.length === 0 ? (
          <div className="muted" style={{ textAlign: 'center', padding: '16px 0', fontSize: 13 }}>
            No kill data synced yet.
          </div>
        ) : (
          <div>
            {[...recentKills, ...recentLosses]
              .sort((a, b) => new Date(b.whenAt).getTime() - new Date(a.whenAt).getTime())
              .slice(0, 8)
              .map((k, i) => (
                <div key={i} className={`kill-row ${k.kind === 'loss' ? 'loss' : ''}`}>
                  <div className="ship-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                      style={{ color: k.kind === 'kill' ? 'var(--good)' : 'var(--loss)' }}>
                      <path d="M12 2 L20 8 L17 22 L7 22 L4 8 Z" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {k.kind === 'kill'
                        ? <>{k.victimName ? <b>{k.victimName}</b> : 'Unknown'} <span className="dim">·</span> {k.ship}</>
                        : <>Lost <b>{k.ship}</b>{k.victimName ? <> <span className="dim">to</span> {k.victimName}</> : null}</>
                      }
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>{k.system}</div>
                  </div>
                  <div className="isk">{k.isk}</div>
                </div>
              ))}
          </div>
        )
      )}
    </div>
  );
}
