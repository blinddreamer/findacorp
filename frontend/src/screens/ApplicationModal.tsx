import { useState } from 'react';
import { createApplication, createDirectMessage } from '../api/applicationApi';
import Avatar from '../components/Avatar';
import CorpLogo from '../components/CorpLogo';
import Btn from '../components/Btn';
import Pill from '../components/Pill';
import { fmtSP } from '../utils/format';

export interface ApplicationCtx {
  mode: 'apply-corp' | 'contact-pilot';
  targetId: number;
  targetName: string;
  targetTicker?: string;
  targetSp?: number;
  targetAlliance?: string;
  targetFaction?: string;
  targetStatus?: string;
}

interface ApplicationModalProps {
  ctx: ApplicationCtx;
  onClose: () => void;
}

export default function ApplicationModal({ ctx, onClose }: ApplicationModalProps) {
  const [step, setStep] = useState(1);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState(
    ctx.mode === 'contact-pilot'
      ? 'Saw your profile on FINDACORP. We\'re recruiting and your TZ and fit are a match. Open to a Mumble chat?\n\n— Recruiter'
      : 'EUTZ pilot looking for a good corp. References available. Fly safe — Pilot'
  );

  const isPilotContact = ctx.mode === 'contact-pilot';

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      if (isPilotContact) {
        await createDirectMessage({ pilotId: ctx.targetId, message });
      } else {
        await createApplication({ corpId: ctx.targetId, message, direction: 'PILOT_TO_CORP' });
      }
      setStep(2);
    } catch (e) {
      const ax = e as { response?: { status?: number; data?: { message?: string; error?: string } } };
      const status = ax?.response?.status;
      const backendMsg = ax?.response?.data?.message || ax?.response?.data?.error;
      const fallback = isPilotContact
        ? 'Could not send your message — please try again.'
        : 'Could not send your application — please try again.';
      if (backendMsg) {
        setError(`${backendMsg}${status ? ` (${status})` : ''}`);
      } else if (status === 404) {
        setError('Inbox service unavailable (404) — the API gateway / application-service may need a rebuild & restart.');
      } else if (status) {
        setError(`${fallback} (HTTP ${status})`);
      } else {
        setError(fallback);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="modal-shade" onClick={onClose}>
      <div className="modal" style={{ width: 600 }} onClick={e => e.stopPropagation()}>
        {step === 1 && (
          <>
            <div className="eyebrow">// {isPilotContact ? 'contact pilot' : 'apply to corp'}</div>
            <h2 style={{ marginTop: 6, fontSize: 22 }}>
              {isPilotContact ? `EVEmail ${ctx.targetName}` : `Apply to ${ctx.targetName}`}
            </h2>

            <div style={{ display: 'flex', gap: 12, padding: 12, marginTop: 16, background: 'var(--bg-base)', borderRadius: 6, border: '1px solid var(--border-soft)' }}>
              {isPilotContact
                ? <Avatar characterId={ctx.targetId} seed={ctx.targetName} size={44} />
                : <CorpLogo corpId={ctx.targetId} seed={ctx.targetName} size={44} faction={ctx.targetFaction} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{ctx.targetName}</div>
                <div className="muted mono" style={{ fontSize: 11, marginTop: 2 }}>
                  {isPilotContact
                    ? `${ctx.targetTicker ?? ''} · ${ctx.targetSp != null ? fmtSP(ctx.targetSp) + ' SP' : ''}`
                    : `${ctx.targetTicker ?? ''} · ${ctx.targetAlliance ?? 'no alliance'}`}
                </div>
              </div>
              <Pill kind="good"><span className="dot" />{isPilotContact ? 'looking' : (ctx.targetStatus ?? 'open')}</Pill>
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="stat-label" style={{ marginBottom: 8 }}>Message</div>
              <textarea
                className="input"
                style={{ minHeight: 180 }}
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              <div className="muted mono" style={{ fontSize: 11, marginTop: 6 }}>{message.length} chars · sent as FINDACORP inbox message</div>
            </div>

            {error && (
              <div style={{ marginTop: 14, padding: '8px 12px', borderRadius: 6, fontSize: 12.5, color: 'var(--bad, #e05252)', background: 'var(--bg-base)', border: '1px solid var(--bad, #e05252)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22 }}>
              <Btn ghost onClick={onClose}>Cancel</Btn>
              <Btn primary onClick={handleSend} disabled={sending}>
                {sending ? 'Sending…' : 'Send →'}
              </Btn>
            </div>
          </>
        )}

        {step === 2 && (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, margin: '0 auto 18px', borderRadius: 999, background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', display: 'grid', placeItems: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M3 8 L12 13 L21 8 V18 H3 Z" /><path d="M3 8 L12 3 L21 8" /></svg>
            </div>
            <h2 style={{ fontSize: 22 }}>Sent. Fly safe.</h2>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 10, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
              {isPilotContact
                ? `${ctx.targetName} will see your message in their FINDACORP inbox. Most pilots reply within 24h.`
                : `Your application is now in the recruiter queue. They typically reply within 12h.`}
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
