import { useState } from 'react';
import Btn from '../../components/Btn';
import TzRangeEditor from '../../components/TzRangeEditor';
import { ROLES, CONTENT_TYPES, LANGUAGES } from './constants';

interface OnboardingModalProps {
  characterId: number;
  onSave: (hours: number[], roles: string[], content: string[], languages: string[]) => Promise<void>;
  onSkip: () => void;
}

export default function OnboardingModal({ onSave, onSkip }: OnboardingModalProps) {
  const [step, setStep] = useState<'hours' | 'roles' | 'languages'>('hours');
  const [hours, setHours] = useState<number[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [content, setContent] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleRole(r: string) {
    setRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  }
  function toggleContent(c: string) {
    setContent(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }
  function toggleLanguage(l: string) {
    setLanguages(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  }

  async function handleSave() {
    setSaving(true);
    try { await onSave(hours, roles, content, languages); } finally { setSaving(false); }
  }

  const stepTitle = step === 'hours' ? 'When do you fly?' : step === 'roles' ? 'What do you want to fly?' : 'What languages do you speak?';
  const stepDesc = step === 'hours'
    ? 'Use the FROM and TO controls to set your usual active hours in EVE time (UTC). Corp HRs use this to find timezone overlap.'
    : step === 'roles'
    ? 'Pick your preferred roles and content types. Corp HRs filter by these when searching pilots.'
    : 'Select the languages you can communicate in. Helps corps find pilots who fit their culture.';

  return (
    <div className="modal-shade">
      <div className="modal" style={{ width: 560 }}>
        <div className="eyebrow accent">// welcome to findacorp · profile setup</div>
        <h2 style={{ marginTop: 8, fontSize: 22 }}>{stepTitle}</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{stepDesc}</p>

        {step === 'hours' && (
          <div style={{ marginTop: 24 }}>
            <TzRangeEditor hours={hours} onChange={setHours} />
          </div>
        )}

        {step === 'roles' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 20 }}>
            <div>
              <div className="stat-label" style={{ marginBottom: 10 }}>Roles I'll fly</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ROLES.map(r => (
                  <label key={r} className="checkbox-row" style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={roles.includes(r)} onChange={() => toggleRole(r)} />
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
                    <input type="checkbox" checked={content.includes(c)} onChange={() => toggleContent(c)} />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'languages' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 20 }}>
            {LANGUAGES.map(l => (
              <label key={l} className="checkbox-row" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={languages.includes(l)} onChange={() => toggleLanguage(l)} />
                <span>{l}</span>
              </label>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
          <Btn ghost onClick={onSkip} disabled={saving}>Skip for now</Btn>
          <div style={{ display: 'flex', gap: 8 }}>
            {step === 'roles' && (
              <Btn ghost onClick={() => setStep('hours')} disabled={saving}>Back</Btn>
            )}
            {step === 'languages' && (
              <Btn ghost onClick={() => setStep('roles')} disabled={saving}>Back</Btn>
            )}
            {step === 'hours' && <Btn primary onClick={() => setStep('roles')}>Next →</Btn>}
            {step === 'roles' && <Btn primary onClick={() => setStep('languages')}>Next →</Btn>}
            {step === 'languages' && (
              <Btn primary onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save profile'}
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
