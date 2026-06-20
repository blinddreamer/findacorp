import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPilot, updatePilot } from '../api/profileApi';
import { deleteAccount } from '../api/authApi';
import { useAuth, clearAccessToken } from '../auth/useAuth';
import Portrait from '../components/Portrait';
import Pill from '../components/Pill';
import Btn from '../components/Btn';
import ApplicationModal from './ApplicationModal';
import PilotOverview from './pilot/PilotOverview';
import PilotSkills from './pilot/PilotSkills';
import PilotKillboard from './pilot/PilotKillboard';
import PilotHistory from './pilot/PilotHistory';
import OnboardingModal from './pilot/OnboardingModal';
import { fmtSP } from '../utils/format';
import { inferTz } from '../utils/tz';

export default function PilotProfileScreen() {
  const { characterId } = useParams<{ characterId: string }>();
  const id = Number(characterId);
  const [tab, setTab] = useState('overview');
  const auth = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const stubAttempted = useRef(false);
  const [creatingStub, setCreatingStub] = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftBio, setDraftBio] = useState('');
  const [draftTzHours, setDraftTzHours] = useState<number[]>([]);
  const [draftRoles, setDraftRoles] = useState<string[]>([]);
  const [draftContent, setDraftContent] = useState<string[]>([]);
  const [draftLanguages, setDraftLanguages] = useState<string[]>([]);

  // Onboarding modal
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: p, isLoading, isError } = useQuery({
    queryKey: ['pilot', id],
    queryFn: () => getPilot(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });

  useEffect(() => {
    if (isError && id === auth.characterId && !stubAttempted.current) {
      stubAttempted.current = true;
      setCreatingStub(true);
      updatePilot({})
        .then(() => queryClient.invalidateQueries({ queryKey: ['pilot', id] }))
        .catch(() => {})
        .finally(() => setCreatingStub(false));
    }
  }, [isError, id, auth.characterId, queryClient]);

  const isOwner = auth.characterId === id;

  useEffect(() => {
    if (!p || !isOwner) return;
    const key = `drydock_onboarding_done_${id}`;
    if (localStorage.getItem(key)) return;
    const isEmpty = !p.bio && !p.roles?.length && !p.content?.length && !p.manualTzActive?.length;
    if (isEmpty) setShowOnboarding(true);
  }, [p, isOwner, id]);

  if (isLoading || creatingStub) {
    return <div className="page"><div className="card" style={{ textAlign: 'center', padding: 40 }}>Loading pilot profile…</div></div>;
  }
  if (isError || !p) return <div className="page"><div className="card" style={{ textAlign: 'center', padding: 40 }}>Pilot not found or not yet indexed.</div></div>;

  function enterEdit() {
    if (!p) return;
    setDraftBio(p.bio ?? '');
    setDraftTzHours(p.manualTzActive ?? p.tzActive ?? []);
    setDraftRoles(p.roles ?? []);
    setDraftContent(p.content ?? []);
    setDraftLanguages(p.languages ?? []);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
  }

  async function saveEdit() {
    setIsSaving(true);
    try {
      await updatePilot({
        bio: draftBio.trim() || undefined,
        manualTzActive: draftTzHours,
        roles: draftRoles,
        content: draftContent,
        languages: draftLanguages,
      });
      await queryClient.invalidateQueries({ queryKey: ['pilot', id] });
      setIsEditing(false);
    } catch {
      // keep editing open on error
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteAccount();
      clearAccessToken();
      navigate('/');
    } catch {
      setIsDeleting(false);
      setDeleteConfirm(false);
    }
  }

  function shareProfile() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // Timezone pill: live during edit, saved value otherwise
  const displayTz = isEditing
    ? (draftTzHours.length > 0 ? inferTz(draftTzHours) : p.tz)
    : (p.manualTzActive?.length ? inferTz(p.manualTzActive) : p.tz);

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div className="eyebrow">// pilot/{p.characterId}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn sm ghost onClick={shareProfile}>{copied ? '✓ Copied!' : 'Share profile'}</Btn>
          {isOwner && !isEditing && !deleteConfirm && (
            <>
              <Btn sm ghost onClick={enterEdit}>Edit profile</Btn>
              <Btn sm ghost onClick={() => setDeleteConfirm(true)} style={{ color: 'var(--bad, #e05252)' }}>Delete account</Btn>
            </>
          )}
          {isOwner && !isEditing && deleteConfirm && (
            <>
              <span style={{ fontSize: 12.5, color: 'var(--text-mute)', alignSelf: 'center' }}>Remove all data and stop syncing?</span>
              <Btn sm ghost onClick={() => setDeleteConfirm(false)} disabled={isDeleting}>Cancel</Btn>
              <Btn sm primary onClick={handleDelete} disabled={isDeleting} style={{ background: 'var(--bad, #e05252)', borderColor: 'var(--bad, #e05252)' }}>
                {isDeleting ? 'Deleting…' : 'Yes, delete'}
              </Btn>
            </>
          )}
          {isOwner && isEditing && (
            <>
              <Btn sm ghost onClick={cancelEdit} disabled={isSaving}>Cancel</Btn>
              <Btn sm primary onClick={saveEdit} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save changes'}
              </Btn>
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <div style={{ marginBottom: 16, padding: '8px 14px', background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', borderRadius: 6, fontSize: 12.5, color: 'var(--accent-text)' }}>
          // editing your profile — changes are not saved until you click Save
        </div>
      )}

      <div className="profile-hero">
        <div style={{ width: 220 }}>
          <Portrait id={p.characterId} name={p.name} />
        </div>
        <div className="ident">
          <div className="ticker">{p.ticker} {p.corp}</div>
          <h1>{p.name ?? `Pilot #${p.characterId}`}</h1>
          <div className="meta">
            {displayTz && <span><Pill kind="good"><span className="dot" />{displayTz} prime</Pill></span>}
            {p.sp != null && <span className="mono">{fmtSP(p.sp)} SP</span>}
            {p.activity && <><span className="dim">·</span><span>{p.activity}</span></>}
            {p.verified && <span className="mono" style={{ color: 'var(--good)', fontSize: 11 }}>✓ ESI verified</span>}
          </div>
          {isEditing ? (
            <textarea
              className="input"
              style={{ marginTop: 10, minHeight: 64, fontSize: 13, resize: 'vertical', width: '100%' }}
              placeholder="Tell recruiters about yourself…"
              value={draftBio}
              onChange={e => setDraftBio(e.target.value)}
            />
          ) : (
            p.bio && <p className="bio">{p.bio}</p>
          )}
          {p.lookingFor && (
            <div className="lookingfor">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
              <span><b>Looking for:</b> {p.lookingFor}</span>
            </div>
          )}
        </div>
        <div className="actions">
          {!isOwner && (
            <>
              <Btn primary onClick={() => setContactModal(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                Message
              </Btn>
              <Btn ghost onClick={() => setContactModal(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8 L12 13 L21 8 V18 H3 Z" /><path d="M3 8 L12 3 L21 8" /></svg>
                Send EVEmail
              </Btn>
            </>
          )}
          <Btn ghost onClick={() => window.open(`https://zkillboard.com/character/${p.characterId}/`, '_blank')}>⌃ Open in zKill</Btn>
          {p.lastSyncedAt && (
            <div className="verified" style={{ marginTop: 8 }}>
              <span>●</span> Last sync {new Date(p.lastSyncedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <div className="tabs" style={{ marginTop: 24 }}>
        {['overview', 'skills', 'killboard', 'history'].map(t => (
          <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.toUpperCase()}
          </div>
        ))}
      </div>

      {tab === 'overview' && (
        <PilotOverview
          p={p}
          isOwner={isOwner}
          isEditing={isEditing}
          draftTzHours={draftTzHours}
          onTzChange={setDraftTzHours}
          draftRoles={draftRoles}
          onRolesChange={setDraftRoles}
          draftContent={draftContent}
          onContentChange={setDraftContent}
          draftLanguages={draftLanguages}
          onLanguagesChange={setDraftLanguages}
        />
      )}
      {tab === 'skills' && <PilotSkills p={p} />}
      {tab === 'killboard' && <PilotKillboard p={p} />}
      {tab === 'history' && <PilotHistory p={p} />}

      {contactModal && (
        <ApplicationModal
          ctx={{
            mode: 'contact-pilot',
            targetId: p.characterId,
            targetName: p.name ?? `Pilot #${p.characterId}`,
            targetSp: p.sp,
          }}
          onClose={() => setContactModal(false)}
        />
      )}

      {showOnboarding && (
        <OnboardingModal
          characterId={id}
          onSave={async (hours, roles, content, languages) => {
            try {
              await updatePilot({ manualTzActive: hours, roles, content, languages });
              await queryClient.invalidateQueries({ queryKey: ['pilot', id] });
            } catch { /* non-fatal */ }
            localStorage.setItem(`drydock_onboarding_done_${id}`, '1');
            setShowOnboarding(false);
          }}
          onSkip={() => {
            localStorage.setItem(`drydock_onboarding_done_${id}`, '1');
            setShowOnboarding(false);
          }}
        />
      )}
    </div>
  );
}
