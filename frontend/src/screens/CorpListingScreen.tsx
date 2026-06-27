import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCorp, updateCorp, getPilot, syncCorp } from '../api/profileApi';
import { useAuth } from '../auth/useAuth';
import CorpLogo from '../components/CorpLogo';
import Pill from '../components/Pill';
import Btn from '../components/Btn';
import ApplicationModal from './ApplicationModal';
import CorpOverview from './corp/CorpOverview';
import CorpMembers from './corp/CorpMembers';
import CorpKillboard from './corp/CorpKillboard';
import CorpHistory from './corp/CorpHistory';
import { inferTz } from '../utils/tz';

// ── Permission feature flag ───────────────────────────────────────────────────
// false = dev mode: any logged-in user may edit
// true  = prod mode: CEO or appointed HR only (non-members see "Apply" instead)
// NOTE: keep in sync with the backend `app.corp-edit-restricted` property — the
// backend enforces this independently; flipping it here only hides the UI.
const CORP_EDIT_RESTRICTED = true;

export default function CorpListingScreen() {
  const { corpId } = useParams<{ corpId: string }>();
  const id = Number(corpId);
  const auth = useAuth();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState('overview');
  const [applying, setApplying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Draft state
  const [draftTagline, setDraftTagline] = useState('');
  const [draftPitch, setDraftPitch] = useState('');
  const [draftStatus, setDraftStatus] = useState<'open' | 'selective' | 'closed'>('open');
  const [draftContent, setDraftContent] = useState<string[]>([]);
  const [draftRolesLooking, setDraftRolesLooking] = useState<string[]>([]);
  const [draftLanguages, setDraftLanguages] = useState<string[]>([]);
  const [draftTzHours, setDraftTzHours] = useState<number[]>([]);
  const [draftRequirements, setDraftRequirements] = useState('');
  const [draftDoctrines, setDraftDoctrines] = useState('');
  const [draftHrIds, setDraftHrIds] = useState<number[]>([]);

  const { data: c, isLoading, isError } = useQuery({
    queryKey: ['corp', id],
    queryFn: () => getCorp(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });

  const { data: myPilot } = useQuery({
    queryKey: ['pilot', auth.characterId],
    queryFn: () => getPilot(auth.characterId!),
    enabled: !!auth.characterId,
    staleTime: 5 * 60 * 1000,
  });

  // ── Permission check ──────────────────────────────────────────────────────
  // CORP_EDIT_RESTRICTED=false: any logged-in user can edit (dev mode)
  // CORP_EDIT_RESTRICTED=true:  CEO or appointed HR only
  const isEditable = !CORP_EDIT_RESTRICTED
    ? !!auth.characterId
    : !!c && !!auth.characterId && (
        auth.characterId === c.ceoId ||
        (c.hrIds ?? []).includes(auth.characterId)
      );

  // Only the CEO may appoint/revoke HR; HR can edit the listing but not the HR roster.
  const isCeo = !!c && !!auth.characterId && auth.characterId === c.ceoId;

  const pilotTzHours: number[] = myPilot?.manualTzActive?.length
    ? myPilot.manualTzActive
    : (myPilot?.tzActive ?? []);

  function enterEdit() {
    if (!c) return;
    setDraftTagline(c.tagline ?? '');
    setDraftPitch(c.pitch ?? '');
    setDraftStatus(c.status ?? 'open');
    setDraftContent(c.content ?? []);
    setDraftRolesLooking(c.rolesLooking ?? []);
    setDraftLanguages(c.languages ?? []);
    setDraftTzHours(c.tzHours ?? []);
    setDraftRequirements((c.requirements ?? []).join('\n'));
    setDraftDoctrines((c.doctrines ?? []).join('\n'));
    setDraftHrIds(c.hrIds ?? []);
    setIsEditing(true);
  }

  async function saveEdit() {
    if (!c) return;
    setIsSaving(true);
    try {
      await updateCorp(c.corpId, {
        tagline: draftTagline.trim() || undefined,
        pitch: draftPitch.trim() || undefined,
        status: draftStatus,
        content: draftContent,
        rolesLooking: draftRolesLooking,
        languages: draftLanguages,
        tzHours: draftTzHours,
        requirements: draftRequirements.split('\n').map(s => s.trim()).filter(Boolean),
        doctrines: draftDoctrines.split('\n').map(s => s.trim()).filter(Boolean),
        // Only the CEO may change the HR roster.
        ...(isCeo ? { hrIds: draftHrIds } : {}),
      });
      await queryClient.invalidateQueries({ queryKey: ['corp', id] });
      setIsEditing(false);
    } catch {
      // keep editing open on error
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSync() {
    if (!c) return;
    await syncCorp(c.corpId);
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ['corp', id] }), 3000);
  }

  function shareProfile() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (isLoading) return <div className="page"><div className="card" style={{ textAlign: 'center', padding: 40 }}>Loading corp profile…</div></div>;
  if (isError || !c) return <div className="page"><div className="card" style={{ textAlign: 'center', padding: 40 }}>Corp not found or not yet indexed.</div></div>;

  const statusKind = c.status === 'open' ? 'good' : c.status === 'selective' ? 'accent' : 'danger';

  // Viewer's current corp (from their synced corp history) — don't offer to apply to your own corp.
  const myCurrentCorp = myPilot?.corpHistory?.find(h => !h.toDate || h.toDate === 'Present')
    ?? myPilot?.corpHistory?.[0];
  const isMember = myCurrentCorp?.corpId != null && myCurrentCorp.corpId === c.corpId;

  return (
    <div className="page">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div className="eyebrow">// corp/{c.corpId}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn sm ghost onClick={shareProfile}>{copied ? '✓ Copied!' : 'Share listing'}</Btn>
          {isEditable && !isEditing && <Btn sm ghost onClick={enterEdit}>Edit listing</Btn>}
          {isEditable && isEditing && (
            <>
              <Btn sm ghost onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Btn>
              <Btn sm primary onClick={saveEdit} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save changes'}
              </Btn>
            </>
          )}
          {c.updatedAt && (
            <div className="kbd-hint">↗ updated {new Date(c.updatedAt).toLocaleDateString()}</div>
          )}
        </div>
      </div>

      {isEditing && (
        <div style={{ marginBottom: 16, padding: '8px 14px', background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', borderRadius: 6, fontSize: 12.5, color: 'var(--accent-text)' }}>
          // editing corp listing — changes are not saved until you click Save
        </div>
      )}

      {c.ceoLoginRequired && isEditable && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--bg-base)', border: '1px solid var(--bad, #e05252)', borderRadius: 6, fontSize: 12.5, color: 'var(--text-mid)', lineHeight: 1.5 }}>
          <b style={{ color: 'var(--bad, #e05252)' }}>⚠ CEO change detected.</b>{' '}
          This corp's CEO recently changed and the new CEO hasn't signed in yet — roster and member
          sync are paused until they log into FINDACORP.
        </div>
      )}

      {/* ── Hero ── */}
      <div className="profile-hero">
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <CorpLogo seed={c.name ?? String(c.corpId)} size={140} faction={c.faction} />
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            {c.ticker}{c.founded ? ` · founded ${c.founded}` : ''}
          </div>
        </div>
        <div className="ident">
          <div className="ticker">{c.ticker}{c.alliance ? ` · ${c.alliance}` : ''}</div>
          <h1>{c.name ?? `Corp #${c.corpId}`}</h1>
          <div className="meta">
            {c.status && <Pill kind={statusKind}><span className="dot" />Recruitment {c.status}</Pill>}
            {c.members != null && (
              <span className="mono">{c.members}{c.capacity != null ? ` / ${c.capacity}` : ''} members</span>
            )}
            {(c.tzHours?.length ?? 0) > 0 && (
              <Pill kind="good"><span className="dot" />{inferTz(c.tzHours!)} prime</Pill>
            )}
          </div>
          {!isEditing && c.tagline && <p className="bio">{c.tagline}</p>}
          {!isEditing && (c.doctrines?.length ?? 0) > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
              {c.doctrines!.map(x => <Pill key={x} kind="accent">{x}</Pill>)}
            </div>
          )}
        </div>
        <div className="actions">
          {!isEditable && !isMember && (
            <Btn primary onClick={() => setApplying(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12 L19 12" /><path d="M13 6 L19 12 L13 18" /></svg>
              Apply to {c.ticker ?? 'this corp'}
            </Btn>
          )}
          {!isEditable && isMember && (
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>// you're a member of this corp</div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs" style={{ marginTop: 24 }}>
        {['overview', 'members', 'killboard', 'history'].map(t => (
          <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.toUpperCase()}
          </div>
        ))}
      </div>

      {tab === 'overview' && (
        <CorpOverview
          c={c} isEditable={isEditable} isEditing={isEditing} isCeo={isCeo} pilotTzHours={pilotTzHours}
          draftHrIds={draftHrIds} onHrIdsChange={setDraftHrIds}
          draftTagline={draftTagline} onTaglineChange={setDraftTagline}
          draftPitch={draftPitch} onPitchChange={setDraftPitch}
          draftStatus={draftStatus} onStatusChange={setDraftStatus}
          draftContent={draftContent} onContentChange={setDraftContent}
          draftRolesLooking={draftRolesLooking} onRolesLookingChange={setDraftRolesLooking}
          draftLanguages={draftLanguages} onLanguagesChange={setDraftLanguages}
          draftTzHours={draftTzHours} onTzHoursChange={setDraftTzHours}
          draftRequirements={draftRequirements} onRequirementsChange={setDraftRequirements}
          draftDoctrines={draftDoctrines} onDoctrinesChange={setDraftDoctrines}
        />
      )}
      {tab === 'members' && <CorpMembers c={c} />}
      {tab === 'killboard' && <CorpKillboard c={c} onSync={handleSync} />}
      {tab === 'history' && <CorpHistory c={c} />}

      {applying && (
        <ApplicationModal
          ctx={{
            mode: 'apply-corp',
            targetId: c.corpId,
            targetName: c.name ?? `Corp #${c.corpId}`,
            targetTicker: c.ticker ?? undefined,
            targetAlliance: c.alliance ?? undefined,
            targetFaction: c.faction ?? undefined,
            targetStatus: c.status ?? undefined,
          }}
          onClose={() => setApplying(false)}
        />
      )}
    </div>
  );
}
