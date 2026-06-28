import type { CorpProfile } from '../../types/corp';
import TZRing from '../../components/TZRing';
import Pill from '../../components/Pill';
import Stat from '../../components/Stat';
import TzRangeEditor from '../../components/TzRangeEditor';
import { fmtSP } from '../../utils/format';
import { inferTz, hoursRange } from '../../utils/tz';
import { toggleId, resolveMemberName, hrCandidates, orphanedHrIds } from '../../utils/hr';

const CORP_ACTIVITIES = ['Null', 'Small gang', 'Black ops', 'Wormhole', 'Lowsec', 'Industry', 'Capital', 'Mining', 'Exploration', 'FW', 'FW Plexing', 'FW Small Gang'];
const CORP_ROLES_WANTED = ['Logi', 'DPS', 'Capital'];
const LANGUAGES = ['English', 'German', 'French', 'Russian', 'Japanese', 'Korean', 'Chinese', 'Spanish', 'Portuguese'];

/** Find a declared minimum-SP requirement, matching on the label before the colon. */
function findMinSp(requirements?: string[]): number | null {
  if (!requirements) return null;
  for (const r of requirements) {
    const idx = r.indexOf(':');
    if (idx === -1) continue;
    const label = r.slice(0, idx).trim().toLowerCase();
    const isSp = label.includes('skill') || label.split(/\s+/).includes('sp');
    if (isSp) {
      const m = r.slice(idx + 1).replace(/,/g, '').trim().toUpperCase().match(/^([\d.]+)\s*([KMB])?$/);
      if (m) {
        const mult = m[2] === 'B' ? 1e9 : m[2] === 'M' ? 1e6 : m[2] === 'K' ? 1e3 : 1;
        const n = parseFloat(m[1]) * mult;
        if (Number.isFinite(n) && n > 0) return n;
      }
    }
  }
  return null;
}

interface OverviewProps {
  c: CorpProfile;
  isEditable: boolean;
  isEditing: boolean;
  isCeo: boolean;
  pilotTzHours: number[];
  draftHrIds: number[]; onHrIdsChange: (v: number[]) => void;
  draftTagline: string; onTaglineChange: (v: string) => void;
  draftPitch: string; onPitchChange: (v: string) => void;
  draftStatus: 'open' | 'selective' | 'closed'; onStatusChange: (v: 'open' | 'selective' | 'closed') => void;
  draftContent: string[]; onContentChange: (v: string[]) => void;
  draftRolesLooking: string[]; onRolesLookingChange: (v: string[]) => void;
  draftLanguages: string[]; onLanguagesChange: (v: string[]) => void;
  draftTzHours: number[]; onTzHoursChange: (v: number[]) => void;
  draftRequirements: string; onRequirementsChange: (v: string) => void;
  draftDoctrines: string; onDoctrinesChange: (v: string) => void;
}

export default function CorpOverview({
  c, isEditable, isEditing, isCeo, pilotTzHours,
  draftHrIds, onHrIdsChange,
  draftTagline, onTaglineChange,
  draftPitch, onPitchChange,
  draftStatus, onStatusChange,
  draftContent, onContentChange,
  draftRolesLooking, onRolesLookingChange,
  draftLanguages, onLanguagesChange,
  draftTzHours, onTzHoursChange,
  draftRequirements, onRequirementsChange,
  draftDoctrines, onDoctrinesChange,
}: OverviewProps) {
  const corpTzHours = isEditing ? draftTzHours : (c.tzHours ?? []);
  const minSp = findMinSp(c.requirements);
  const overlapHours = pilotTzHours.filter(h => corpTzHours.includes(h));
  const overlapPct = corpTzHours.length > 0 && pilotTzHours.length > 0
    ? Math.round(overlapHours.length / corpTzHours.length * 100)
    : undefined;
  const showTzCard = isEditable || corpTzHours.length > 0 || pilotTzHours.length > 0;
  const showActivitiesCard = isEditable
    || (c.content?.length ?? 0) > 0
    || (c.rolesLooking?.length ?? 0) > 0
    || (c.languages?.length ?? 0) > 0;

  function toggleActivity(a: string) {
    onContentChange(draftContent.includes(a) ? draftContent.filter(x => x !== a) : [...draftContent, a]);
  }
  function toggleRole(r: string) {
    onRolesLookingChange(draftRolesLooking.includes(r) ? draftRolesLooking.filter(x => x !== r) : [...draftRolesLooking, r]);
  }
  function toggleLanguage(l: string) {
    onLanguagesChange(draftLanguages.includes(l) ? draftLanguages.filter(x => x !== l) : [...draftLanguages, l]);
  }
  function toggleHr(id: number) {
    onHrIdsChange(toggleId(draftHrIds, id));
  }

  // ── HR management (CEO only) ──────────────────────────────────────────────
  const roster = c.roster ?? [];
  const currentHrIds = isEditing ? draftHrIds : (c.hrIds ?? []);
  const candidates = hrCandidates(roster, c.ceoId);
  const orphanedHr = orphanedHrIds(draftHrIds, roster, c.ceoId);
  // The CEO always manages HR; HR/members see the appointed list read-only.
  const showHrCard = isCeo || (isEditable && currentHrIds.length > 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
      {/* ── Left column ── */}
      <div className="col" style={{ gap: 20 }}>

        {/* Pitch */}
        {(isEditable || c.pitch) && (
          <div className="card">
            <div className="section-head">
              <h3>The pitch</h3>
              {isEditing && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="stat-label">Status</span>
                  <select
                    value={draftStatus}
                    onChange={e => onStatusChange(e.target.value as 'open' | 'selective' | 'closed')}
                    style={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 4, padding: '4px 8px', fontSize: 12 }}
                  >
                    <option value="open">Open</option>
                    <option value="selective">Selective</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              )}
            </div>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  className="input"
                  placeholder="Short tagline (shown on search results)…"
                  value={draftTagline}
                  onChange={e => onTaglineChange(e.target.value)}
                  style={{ fontSize: 13 }}
                />
                <textarea
                  className="input"
                  placeholder="Your full recruitment pitch…"
                  value={draftPitch}
                  onChange={e => onPitchChange(e.target.value)}
                  style={{ minHeight: 120, fontSize: 13, resize: 'vertical' }}
                />
              </div>
            ) : (
              <div style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--text-mid)', whiteSpace: 'pre-wrap' }}>{c.pitch}</div>
            )}
          </div>
        )}

        {/* Activities, roles, languages */}
        {showActivitiesCard && (
          <div className="card">
            <div className="section-head">
              <h3>What we do &amp; who we want</h3>
              <span className="label">/ corp culture</span>
            </div>
            {isEditing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <div className="stat-label" style={{ marginBottom: 10 }}>Activities</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {CORP_ACTIVITIES.map(a => (
                      <label key={a} className="checkbox-row" style={{ cursor: 'pointer' }}>
                        <input type="checkbox" checked={draftContent.includes(a)} onChange={() => toggleActivity(a)} />
                        <span>{a}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="stat-label" style={{ marginBottom: 10 }}>Roles wanted</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {CORP_ROLES_WANTED.map(r => (
                      <label key={r} className="checkbox-row" style={{ cursor: 'pointer' }}>
                        <input type="checkbox" checked={draftRolesLooking.includes(r)} onChange={() => toggleRole(r)} />
                        <span>{r}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-soft)', paddingTop: 16 }}>
                  <div className="stat-label" style={{ marginBottom: 10 }}>Languages</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {LANGUAGES.map(l => (
                      <label key={l} className="checkbox-row" style={{ cursor: 'pointer', minWidth: 120 }}>
                        <input type="checkbox" checked={draftLanguages.includes(l)} onChange={() => toggleLanguage(l)} />
                        <span>{l}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {(c.content?.length ?? 0) > 0 && (
                  <div>
                    <div className="stat-label">Activities</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                      {c.content!.map(a => <Pill key={a}>{a}</Pill>)}
                    </div>
                  </div>
                )}
                {(c.rolesLooking?.length ?? 0) > 0 && (
                  <div>
                    <div className="stat-label">Looking for</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                      {c.rolesLooking!.map(r => <Pill key={r} kind="accent">{r}</Pill>)}
                    </div>
                  </div>
                )}
                {(c.languages?.length ?? 0) > 0 && (
                  <div style={{ gridColumn: (c.content?.length ?? 0) > 0 && (c.rolesLooking?.length ?? 0) > 0 ? '1 / -1' : undefined }}>
                    <div className="stat-label">Languages</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                      {c.languages!.map(l => <Pill key={l}>{l}</Pill>)}
                    </div>
                  </div>
                )}
                {isEditable && !c.content?.length && !c.rolesLooking?.length && !c.languages?.length && (
                  <div className="muted" style={{ gridColumn: '1/-1', fontSize: 13 }}>Nothing set yet — click Edit listing to fill this in.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Timezone */}
        {showTzCard && (
          <div className="card">
            <div className="section-head">
              <div>
                <h3>Timezone coverage</h3>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {pilotTzHours.length > 0
                    ? 'Outer ring: corp active hours. Inner ring (amber): your active hours.'
                    : 'Hours the corp is active, in EVE time (UTC).'}
                </div>
              </div>
              <span className="label">/ EVE · UTC</span>
            </div>
            {isEditing ? (
              <TzRangeEditor hours={draftTzHours} onChange={onTzHoursChange} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28, alignItems: 'center' }}>
                <TZRing
                  activeHours={corpTzHours}
                  otherHours={pilotTzHours}
                  label={corpTzHours.length ? inferTz(corpTzHours) + ' PRIME' : 'NO HOURS SET'}
                  overlapPct={overlapPct}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {corpTzHours.length > 0 && (
                    <Stat label="Corp window" value={hoursRange(corpTzHours)} sub={`${corpTzHours.length}h · ${inferTz(corpTzHours)} prime`} accent />
                  )}
                  {pilotTzHours.length > 0 && overlapHours.length > 0 && (
                    <Stat label="Shared hours" value={`${overlapHours.length}h`} sub={hoursRange(overlapHours)} />
                  )}
                  {pilotTzHours.length > 0 && overlapHours.length === 0 && corpTzHours.length > 0 && (
                    <Stat label="Shared hours" value="0h" sub="no overlap" />
                  )}
                  {!corpTzHours.length && isEditable && (
                    <div className="muted" style={{ gridColumn: '1/-1', fontSize: 13 }}>No active hours set — click Edit listing to add them.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right column ── */}
      <div className="col" style={{ gap: 20 }}>

        {/* Corp vitals */}
        <div className="card">
          <div className="section-head"><h3>Corp vitals</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {c.members != null && (
              <Stat label="Members" value={c.members} sub={c.capacity != null ? `${Math.round(c.members / c.capacity * 100)}% capacity` : undefined} accent />
            )}
            {c.founded != null && <Stat label="Founded" value={c.founded} />}
            {c.alliance && <Stat label="Alliance" value={c.alliance} />}
          </div>
          {c.members == null && <div className="muted" style={{ textAlign: 'center', padding: 24 }}>Vitals not yet synced.</div>}
        </div>

        {/* HR managers — CEO appoints corp members who may edit this listing */}
        {showHrCard && (
          <div className="card">
            <div className="section-head"><h3>HR managers</h3><span className="label">/ can edit listing</span></div>
            {isEditing && isCeo ? (
              <>
                <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
                  Appoint corp members who may edit this listing and trigger syncs. As CEO you always have access.
                </div>
                {candidates.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
                    {candidates.map(m => (
                      <label key={m.characterId} className="checkbox-row" style={{ cursor: 'pointer' }}>
                        <input type="checkbox" checked={draftHrIds.includes(m.characterId)} onChange={() => toggleHr(m.characterId)} />
                        <span>{m.characterName}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="muted" style={{ fontSize: 13 }}>No corp members synced yet — run a sync to populate the roster.</div>
                )}
                {orphanedHr.length > 0 && (
                  <div style={{ marginTop: 12, borderTop: '1px solid var(--border-soft)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="stat-label" style={{ marginBottom: 2 }}>No longer in corp</div>
                    {orphanedHr.map(id => (
                      <label key={id} className="checkbox-row" style={{ cursor: 'pointer' }}>
                        <input type="checkbox" checked onChange={() => toggleHr(id)} />
                        <span>{resolveMemberName(roster, id)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </>
            ) : currentHrIds.length > 0 ? (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {currentHrIds.map(id => <Pill key={id}>{resolveMemberName(roster, id)}</Pill>)}
              </div>
            ) : (
              <div className="muted" style={{ fontSize: 13 }}>
                {isCeo ? 'No HR appointed yet — click Edit listing to appoint corp members.' : 'No HR appointed.'}
              </div>
            )}
          </div>
        )}

        {/* Doctrines */}
        {(isEditing || (c.doctrines?.length ?? 0) > 0) && (
          <div className="card">
            <div className="section-head"><h3>Doctrines</h3><span className="label">/ ship fits</span></div>
            {isEditing ? (
              <textarea
                className="input"
                placeholder={"One doctrine per line:\nHellcat\nNaglfar fleet\nRoach"}
                value={draftDoctrines}
                onChange={e => onDoctrinesChange(e.target.value)}
                style={{ minHeight: 80, fontSize: 13, resize: 'vertical', width: '100%' }}
              />
            ) : (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {c.doctrines!.map(x => <Pill key={x} kind="accent">{x}</Pill>)}
              </div>
            )}
          </div>
        )}

        {/* Requirements */}
        {(isEditing || (c.requirements?.length ?? 0) > 0) && (
          <div className="card">
            <div className="section-head"><h3>Requirements</h3><span className="label">/ non-negotiable</span></div>
            {isEditing ? (
              <textarea
                className="input"
                placeholder={"One per line:\nSP: 10,000,000\nESI: Required\nVoice: Mandatory"}
                value={draftRequirements}
                onChange={e => onRequirementsChange(e.target.value)}
                style={{ minHeight: 80, fontSize: 13, resize: 'vertical', width: '100%' }}
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                {c.requirements!.map((r, i) => {
                  const idx = r.indexOf(':');
                  const lbl = idx !== -1 ? r.slice(0, idx).trim() : r;
                  const val = idx !== -1 ? r.slice(idx + 1).trim() : '';
                  return (
                    <div key={i} style={{ padding: '12px 16px', borderTop: i > 1 ? '1px solid var(--border-soft)' : 'none', borderRight: i % 2 === 0 ? '1px solid var(--border-soft)' : 'none' }}>
                      <div className="stat-label">{lbl}</div>
                      <div className="mono" style={{ fontSize: 14, marginTop: 4 }}>{val || '—'}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Min SP */}
        {!isEditing && minSp != null && (
          <div className="card">
            <div className="section-head"><h3>Minimum SP</h3></div>
            <div className="mono" style={{ fontSize: 22, color: 'var(--accent-text)' }}>
              {fmtSP(minSp)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
