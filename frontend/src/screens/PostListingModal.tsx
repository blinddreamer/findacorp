import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPilot, getCorp, updateCorp } from '../api/profileApi';
import { useAuth } from '../auth/useAuth';
import CorpLogo from '../components/CorpLogo';
import Pill from '../components/Pill';
import Btn from '../components/Btn';
import TzRangeEditor from '../components/TzRangeEditor';

const CONTENT_TYPES = ['Sov', 'Small gang', 'Black ops', 'Wormhole', 'Fleet', 'Lowsec', 'FW', 'Capital'];
const CORP_ROLES_WANTED = ['Fleet Cmdr', 'Logi', 'DPS', 'Capital pilot', 'Scout', 'Industrialist', 'Dictor', 'Booster'];
const LANGUAGES = ['English', 'German', 'French', 'Russian', 'Japanese', 'Korean', 'Chinese', 'Spanish', 'Portuguese'];

type Phase = 'resolving' | 'editing' | 'done';

export default function PostListingModal({ onClose }: { onClose: () => void }) {
  const auth = useAuth();
  const qc = useQueryClient();

  const [phase, setPhase] = useState<Phase>('resolving');
  const [corpId, setCorpId] = useState<number | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [manualCorpId, setManualCorpId] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Edit form
  const [status, setStatus] = useState<'open' | 'selective' | 'closed'>('open');
  const [tagline, setTagline] = useState('');
  const [pitch, setPitch] = useState('');
  const [requirements, setRequirements] = useState<string[]>(['']);
  const [content, setContent] = useState<string[]>([]);
  const [rolesLooking, setRolesLooking] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [tzHours, setTzHours] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch logged-in pilot profile to get their current corp
  const { data: pilot, isLoading: pilotLoading } = useQuery({
    queryKey: ['pilot', auth.characterId],
    queryFn: () => getPilot(auth.characterId!),
    enabled: !!auth.characterId,
    staleTime: 5 * 60 * 1000,
  });

  // Resolve corp ID directly from pilot's synced corp history
  useEffect(() => {
    if (!pilot) return;
    const current = pilot.corpHistory?.find(h => !h.toDate || h.toDate === 'Present')
      ?? pilot.corpHistory?.[0];

    if (!current) {
      setResolveError('Your pilot has no corp history yet. Try again after the next data sync.');
      setPhase('editing');
      return;
    }

    if (current.corpId) {
      setCorpId(current.corpId);
      setPhase('editing');
    } else {
      setResolveError(`Corp ID for "${current.corpName}" is not yet available — it will populate after the next sync cycle.`);
      setPhase('editing');
    }
  }, [pilot]);

  // Load existing corp data once corpId is known
  const { data: corp } = useQuery({
    queryKey: ['corp', corpId],
    queryFn: () => getCorp(corpId!),
    enabled: !!corpId && phase === 'editing',
    staleTime: 0,
  });

  // Pre-fill form when corp profile loads
  useEffect(() => {
    if (!corp) return;
    setStatus(corp.status ?? 'open');
    setTagline(corp.tagline ?? '');
    setPitch(corp.pitch ?? '');
    setRequirements(corp.requirements?.length ? corp.requirements : ['']);
    setContent(corp.content ?? []);
    setRolesLooking(corp.rolesLooking ?? []);
    setLanguages(corp.languages ?? []);
    setTzHours(corp.tzHours ?? []);
  }, [corp]);

  function toggleContent(c: string) {
    setContent(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  function toggleRole(r: string) {
    setRolesLooking(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  }

  function toggleLanguage(l: string) {
    setLanguages(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  }

  function setReq(i: number, val: string) {
    setRequirements(prev => prev.map((r, idx) => idx === i ? val : r));
  }

  function addReq() { setRequirements(prev => [...prev, '']); }
  function removeReq(i: number) { setRequirements(prev => prev.filter((_, idx) => idx !== i)); }

  async function handleSave() {
    if (!corpId) {
      setSaveError('Enter your EVE corp ID in the field above to continue.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await updateCorp(corpId, {
        status,
        tagline: tagline.trim() || undefined,
        pitch: pitch.trim() || undefined,
        requirements: requirements.filter(r => r.trim()),
        content,
        rolesLooking,
        languages,
        tzHours,
      });
      qc.invalidateQueries({ queryKey: ['corp', corpId] });
      setPhase('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setSaveError(`Failed to save: ${msg}. Check you are logged in and try again.`);
    } finally {
      setSaving(false);
    }
  }

  const statusKinds: Record<string, 'good' | 'accent' | 'danger'> = {
    open: 'good', selective: 'accent', closed: 'danger',
  };

  return (
    <div className="modal-shade" onClick={onClose}>
      <div className="modal" style={{ width: 680, maxHeight: '88vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>

        {/* ── Resolving ── */}
        {(phase === 'resolving' || pilotLoading) && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div className="eyebrow">// post recruitment listing</div>
            <div className="muted" style={{ marginTop: 16, fontSize: 13 }}>Detecting your corp…</div>
          </div>
        )}

        {/* ── Edit form ── */}
        {phase === 'editing' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="eyebrow">// post recruitment listing</div>
                <h2 style={{ marginTop: 6, fontSize: 22 }}>
                  {corp ? corp.name ?? `Corp #${corpId}` : 'Recruitment listing'}
                </h2>
              </div>
              {corp && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <CorpLogo seed={corp.name ?? String(corpId)} size={48} faction={corp.faction} />
                  <div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--accent-text)' }}>{corp.ticker}</div>
                    {corp.alliance && <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{corp.alliance}</div>}
                  </div>
                </div>
              )}
            </div>

            {resolveError && (
              <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--bg-base)', border: '1px solid var(--border-soft)', borderRadius: 6, fontSize: 12.5, color: 'var(--text-mid)' }}>
                <div>⚠ {resolveError}</div>
                <div style={{ marginTop: 10 }}>
                  <div className="stat-label" style={{ marginBottom: 6 }}>Enter your EVE corp ID to continue</div>
                  <input
                    className="input"
                    type="number"
                    placeholder="e.g. 98000001 — find it on zkillboard.com or dotlan.net"
                    value={manualCorpId}
                    style={{ width: '100%' }}
                    onChange={e => {
                      setManualCorpId(e.target.value);
                      const val = parseInt(e.target.value, 10);
                      setCorpId(!isNaN(val) && val > 0 ? val : null);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Status */}
            <div style={{ marginTop: 22 }}>
              <div className="stat-label" style={{ marginBottom: 10 }}>Recruitment status</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['open', 'selective', 'closed'] as const).map(s => (
                  <div
                    key={s}
                    onClick={() => setStatus(s)}
                    style={{ cursor: 'pointer', opacity: status === s ? 1 : 0.45, transition: 'opacity 0.15s' }}
                  >
                    <Pill kind={statusKinds[s]}>
                      <span className="dot" />
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Pill>
                  </div>
                ))}
              </div>
            </div>

            {/* Tagline */}
            <div style={{ marginTop: 20 }}>
              <div className="stat-label" style={{ marginBottom: 8 }}>
                Tagline <span className="muted" style={{ fontWeight: 400 }}>· one-liner shown on search cards</span>
              </div>
              <input
                className="input"
                style={{ width: '100%' }}
                placeholder="e.g. EUTZ small gang corp. No drama. Just kills."
                value={tagline}
                maxLength={120}
                onChange={e => setTagline(e.target.value)}
              />
              <div className="muted mono" style={{ fontSize: 11, marginTop: 4 }}>{tagline.length}/120</div>
            </div>

            {/* Pitch */}
            <div style={{ marginTop: 20 }}>
              <div className="stat-label" style={{ marginBottom: 8 }}>
                The pitch <span className="muted" style={{ fontWeight: 400 }}>· shown on your corp listing page</span>
              </div>
              <textarea
                className="input"
                style={{ minHeight: 120, width: '100%', resize: 'vertical' }}
                placeholder="Who you are, what you do, why a pilot should join you. Keep it honest."
                value={pitch}
                onChange={e => setPitch(e.target.value)}
              />
            </div>

            {/* Content types */}
            <div style={{ marginTop: 20 }}>
              <div className="stat-label" style={{ marginBottom: 10 }}>Content we do</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {CONTENT_TYPES.map(c => (
                  <label key={c} className="checkbox-row" style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={content.includes(c)} onChange={() => toggleContent(c)} />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Active hours */}
            <div style={{ marginTop: 20 }}>
              <div className="stat-label" style={{ marginBottom: 12 }}>Active hours <span className="muted" style={{ fontWeight: 400 }}>· corp prime time in EVE (UTC)</span></div>
              <TzRangeEditor hours={tzHours} onChange={setTzHours} />
            </div>

            {/* Roles wanted */}
            <div style={{ marginTop: 20 }}>
              <div className="stat-label" style={{ marginBottom: 10 }}>Roles we need</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {CORP_ROLES_WANTED.map(r => (
                  <label key={r} className="checkbox-row" style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={rolesLooking.includes(r)} onChange={() => toggleRole(r)} />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div style={{ marginTop: 20 }}>
              <div className="stat-label" style={{ marginBottom: 10 }}>Languages spoken</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {LANGUAGES.map(l => (
                  <label key={l} className="checkbox-row" style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={languages.includes(l)} onChange={() => toggleLanguage(l)} />
                    <span>{l}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div style={{ marginTop: 20 }}>
              <div className="stat-label" style={{ marginBottom: 8 }}>
                Requirements <span className="muted" style={{ fontWeight: 400 }}>· format "Label: value" e.g. "Minimum SP: 25M"</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {requirements.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="input"
                      style={{ flex: 1 }}
                      placeholder='e.g. "Minimum SP: 25M" or "ESI: Full required"'
                      value={r}
                      onChange={e => setReq(i, e.target.value)}
                    />
                    {requirements.length > 1 && (
                      <Btn sm ghost onClick={() => removeReq(i)} style={{ flexShrink: 0 }}>✕</Btn>
                    )}
                  </div>
                ))}
                <Btn sm ghost onClick={addReq} style={{ alignSelf: 'flex-start' }}>+ Add requirement</Btn>
              </div>
            </div>

            {saveError && (
              <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--bg-base)', border: '1px solid var(--danger, #c0392b)', borderRadius: 6, fontSize: 12.5, color: 'var(--danger-text, #e74c3c)' }}>
                ✕ {saveError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-soft)' }}>
              <Btn ghost onClick={onClose}>Cancel</Btn>
              <Btn primary onClick={handleSave} disabled={saving}>
                {saving ? 'Publishing…' : 'Publish listing →'}
              </Btn>
            </div>
          </>
        )}

        {/* ── Done ── */}
        {phase === 'done' && (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, margin: '0 auto 18px', borderRadius: 999, background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', display: 'grid', placeItems: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 style={{ fontSize: 22 }}>Listing published.</h2>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 10, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
              Pilots browsing corps can now see your listing. Inbound applications will land in your inbox.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22 }}>
              <Btn onClick={onClose}>Close</Btn>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
