import type { PilotProfile } from '../../types/pilot';
import TZRing from '../../components/TZRing';
import Pill from '../../components/Pill';
import Stat from '../../components/Stat';
import TzRangeEditor from '../../components/TzRangeEditor';
import RecentActivityCard from './RecentActivityCard';
import { fmtSP, fmtISK } from '../../utils/format';
import { inferTz, hoursRange } from '../../utils/tz';
import { ROLES, CONTENT_TYPES, LANGUAGES } from './constants';

interface OverviewProps {
  p: PilotProfile;
  isOwner: boolean;
  isEditing: boolean;
  draftTzHours: number[];
  onTzChange: (h: number[]) => void;
  draftRoles: string[];
  onRolesChange: (r: string[]) => void;
  draftContent: string[];
  onContentChange: (c: string[]) => void;
  draftLanguages: string[];
  onLanguagesChange: (l: string[]) => void;
}

export default function PilotOverview({ p, isOwner, isEditing, draftTzHours, onTzChange, draftRoles, onRolesChange, draftContent, onContentChange, draftLanguages, onLanguagesChange }: OverviewProps) {
  const hasManualHours = (p.manualTzActive?.length ?? 0) > 0;

  // Effective timezone label — mirrors the hero pill logic
  const effectiveTz = isEditing
    ? (draftTzHours.length > 0 ? inferTz(draftTzHours) : p.tz)
    : (hasManualHours ? inferTz(p.manualTzActive!) : p.tz);

  // Clock: when editing show draft hours; otherwise prefer manualTzActive, fall back to computed
  const displayTzHours = isEditing
    ? draftTzHours
    : (hasManualHours ? p.manualTzActive! : (p.tzActive ?? []));
  const displayPeakHours = (isEditing || hasManualHours) ? [] : (p.tzPeak ?? []);

  const showTzCard = isOwner
    || hasManualHours
    || (p.tzActive && p.tzActive.length > 0)
    || (p.tzPeak && p.tzPeak.length > 0);
  const showRolesCard = isOwner || (p.roles && p.roles.length > 0) || (p.content && p.content.length > 0);

  function toggleRole(role: string) {
    const next = draftRoles.includes(role)
      ? draftRoles.filter(r => r !== role)
      : [...draftRoles, role];
    onRolesChange(next);
  }

  function toggleContent(c: string) {
    const next = draftContent.includes(c)
      ? draftContent.filter(x => x !== c)
      : [...draftContent, c];
    onContentChange(next);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
      <div className="col" style={{ gap: 20 }}>
        {showTzCard && (
          <div className="card">
            <div className="section-head">
              <div>
                <h3>Timezone &amp; activity</h3>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {isEditing
                    ? 'Set your active hours using the FROM / TO controls.'
                    : hasManualHours
                      ? 'Active hours set by the pilot.'
                      : 'Active hours pulled from last 90d login data.'}
                </div>
              </div>
              <span className="label">/ EVE · UTC</span>
            </div>
            {isEditing ? (
              <TzRangeEditor hours={draftTzHours} onChange={onTzChange} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28, alignItems: 'center' }}>
                <TZRing
                  activeHours={displayTzHours}
                  peakHours={displayPeakHours}
                  label={hasManualHours ? 'PREFERRED' : 'ACTIVITY'}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {hasManualHours && (
                    <Stat label="Active window" value={hoursRange(p.manualTzActive!)} sub="self-reported" accent />
                  )}
                  {hasManualHours && (
                    <Stat label="Hours active" value={`${p.manualTzActive!.length}h`} sub="per day" />
                  )}
                  {!hasManualHours && p.tzPeak && p.tzPeak.length > 0 && (
                    <Stat label="Prime time" value={hoursRange(p.tzPeak)} sub="EVE / UTC" accent />
                  )}
                  {!hasManualHours && p.tzActive && (
                    <Stat label="Active window" value={`${p.tzActive.length}h / day`} sub="avg over 90d" />
                  )}
                  {p.activity && <Stat label="Activity" value={p.activity} sub="login pattern" />}
                </div>
              </div>
            )}
          </div>
        )}

        {showRolesCard && (
          <div className="card">
            <div className="section-head">
              <h3>Preferred roles &amp; content</h3>
              <span className="label">/ self-reported</span>
            </div>
            {isEditing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <div className="stat-label" style={{ marginBottom: 10 }}>Roles I'll fly</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {ROLES.map(r => (
                      <label key={r} className="checkbox-row" style={{ cursor: 'pointer' }}>
                        <input type="checkbox" checked={draftRoles.includes(r)} onChange={() => toggleRole(r)} />
                        <span>{r}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="stat-label" style={{ marginBottom: 10 }}>Content I'm here for</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {CONTENT_TYPES.map(c => (
                      <label key={c} className="checkbox-row" style={{ cursor: 'pointer' }}>
                        <input type="checkbox" checked={draftContent.includes(c)} onChange={() => toggleContent(c)} />
                        <span>{c}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderTop: '1px solid var(--border-soft)', paddingTop: 16 }}>
                  <div>
                    <div className="stat-label" style={{ marginBottom: 8 }}>Primary language</div>
                    <select
                      value={draftLanguages[0] ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        const second = draftLanguages[1] === val ? '' : (draftLanguages[1] ?? '');
                        onLanguagesChange(val ? (second ? [val, second] : [val]) : (second ? [second] : []));
                      }}
                      style={{ width: '100%', background: 'var(--bg-elev)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 4, padding: '5px 8px', fontSize: 13 }}
                    >
                      <option value="">— none —</option>
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="stat-label" style={{ marginBottom: 8 }}>Secondary language</div>
                    <select
                      value={draftLanguages[1] ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        const first = draftLanguages[0] ?? '';
                        onLanguagesChange(first ? (val ? [first, val] : [first]) : (val ? [val] : []));
                      }}
                      style={{ width: '100%', background: 'var(--bg-elev)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 4, padding: '5px 8px', fontSize: 13 }}
                    >
                      <option value="">— none —</option>
                      {LANGUAGES.filter(l => l !== draftLanguages[0]).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {p.roles && p.roles.length > 0 && (
                  <div>
                    <div className="stat-label">Roles I'll fly</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                      {p.roles.map(r => <Pill key={r} kind="accent">{r}</Pill>)}
                    </div>
                  </div>
                )}
                {p.content && p.content.length > 0 && (
                  <div>
                    <div className="stat-label">Content I'm here for</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                      {p.content.map(c => <Pill key={c}>{c}</Pill>)}
                    </div>
                  </div>
                )}
                {p.languages && p.languages.length > 0 && (
                  <div>
                    <div className="stat-label">Languages</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                      {p.languages.map(l => <Pill key={l}>{l}</Pill>)}
                    </div>
                  </div>
                )}
                {p.voice && (
                  <div>
                    <div className="stat-label">Voice comms</div>
                    <div style={{ marginTop: 10, fontSize: 13 }}>{p.voice}</div>
                  </div>
                )}
                {isOwner && !p.roles?.length && !p.content?.length && !p.voice && !p.languages?.length && (
                  <div className="muted" style={{ gridColumn: '1/-1', fontSize: 13 }}>No preferences set yet — click Edit profile to add them.</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="col" style={{ gap: 20 }}>
        <div className="card">
          <div className="section-head"><h3>At a glance</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {p.sp != null && <Stat label="Skill points" value={fmtSP(p.sp)} sub="total" accent />}
            {p.kbKills != null && <Stat label="Kills" value={p.kbKills.toLocaleString()} sub={p.kbEfficiency != null ? `${p.kbEfficiency}% efficiency` : undefined} />}
            {p.iskDestroyed != null && <Stat label="ISK destroyed" value={fmtISK(p.iskDestroyed)} sub={p.kbLosses != null ? `${p.kbLosses} losses` : undefined} />}
            {effectiveTz && <Stat label="Timezone" value={`${effectiveTz} prime`} />}
          </div>
        </div>

        <RecentActivityCard
          killHistory={p.killHistory}
          skillQueue={p.skillQueue}
          skills={p.skills}
          recentSkills={p.recentSkills}
        />
      </div>
    </div>
  );
}
