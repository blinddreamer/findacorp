import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Btn from '../components/Btn';
import Pill from '../components/Pill';
import { useAuth } from '../auth/useAuth';

export default function LandingScreen() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [role, setRole] = useState<'pilot' | 'corp'>('pilot');

  function login() {
    window.location.href = '/api/auth/login';
  }

  return (
    <div className="page" style={{ paddingTop: 0 }}>

      {/* ── Hero ── */}
      <section className="hero" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', paddingTop: 52, paddingBottom: 40 }}>
        <div>
          <div className="eyebrow accent">// FINDACORP · v1.0 · New Eden</div>
          <h1>Find your fleet.</h1>
          <div style={{ width: 52, height: 3, background: 'var(--accent)', borderRadius: 2, marginTop: 20 }} />
          <p className="lede" style={{ marginTop: 24 }}>
            Real profiles from ESI and zKill. Corps search by timezone and content — not a wall of forum threads.
          </p>
          <div className="ctas">
            {auth.token ? (
              <Btn primary lg onClick={() => navigate('/search/corps')}>Browse corps</Btn>
            ) : (
              <Btn primary lg onClick={login}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 L20 7 V17 L12 22 L4 17 V7 Z" /><circle cx="12" cy="12" r="3" /></svg>
                Log in with EVE SSO
              </Btn>
            )}
          </div>
          <div style={{ marginTop: 18, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
            // ESI character + skill + corp history scopes only. read-only. revoke any time.
          </div>
        </div>

        {/* Onboard card */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-soft)',
          borderTop: '2px solid var(--accent)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
            <span>You are a</span>
            <div style={{ display: 'flex', background: 'var(--bg-base)', borderRadius: 6, padding: 3, border: '1px solid var(--border-soft)' }}>
              {(['pilot', 'corp'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    background: role === r ? 'var(--accent)' : 'transparent',
                    color: role === r ? 'oklch(0.14 0.02 250)' : 'var(--text-dim)',
                    border: 'none',
                    borderRadius: 4,
                    padding: '5px 16px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: role === r ? 700 : 400,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    transition: 'all 0.15s',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {role === 'pilot' ? (
            <>
              <OnboardCard
                body="Your next corp is one login away."
                steps={['Sign in with EVE SSO', 'Your profile builds itself', 'Make it yours', 'Find your people']}
              />
              <MiniPilotCard />
            </>
          ) : (
            <>
              <OnboardCard
                body="The right pilot exists. Go find them."
                steps={['Put your corp on the map', 'Set your standards', 'Own your listing', 'Browse pilots who are ready']}
              />
              <MiniCorpCard />
            </>
          )}
        </div>
      </section>

      {/* ── Ticker ── */}
      <div className="ticker">
        <div className="cell"><div className="k">Pilots indexed</div><div className="v">—</div></div>
        <div className="cell"><div className="k">Corps recruiting</div><div className="v accent">—</div></div>
        <div className="cell"><div className="k">Matches this week</div><div className="v">—</div></div>
        <div className="cell"><div className="k">Most-wanted role</div><div className="v" style={{ fontSize: 18 }}>Logi</div></div>
        <div className="cell"><div className="k">Tranquility status</div><div className="v" style={{ fontSize: 14, color: 'var(--good)' }}>● Online</div></div>
      </div>

      {/* ── Feature cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
        <FeatureCard
          tag="// FOR CORP HR"
          title="Search by timezone overlap, not SP number."
          body="Filter the pilot pool by your prime-time hours. See who's actually putting up kills, not who claims to log in daily. Stop signing recruits who ghost after the first ping."
          example={<MiniSearch />}
        />
        <FeatureCard
          tag="// REAL DATA"
          title="Killboard data, on every card."
          body="zKill kills, losses, and efficiency on every profile. No padded resumes, no 'I FC' guys with 4 kills. The data tells the truth."
          example={<MiniKB />}
        />
      </div>

      {/* ── Differentiators ── */}
      <div style={{ marginTop: 56, padding: '36px 32px', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-panel)' }}>
        <div className="eyebrow">// what makes findacorp different</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 36, marginTop: 24 }}>
          <Differentiator
            glyph="01"
            title="Honest, not friendly"
            body={<>Corps mark themselves <Pill kind="good">open</Pill>, <Pill kind="accent">selective</Pill>, or <Pill kind="danger">closed</Pill>. No false hope, no ghost listings.</>}
          />
          <Differentiator
            glyph="02"
            title="Built for EVE we actually play"
            body="Black ops, wormhole, FW, capital — real content tags, not a vague 'PvP' checkbox. Pick what your corp actually flies."
          />
          <Differentiator
            glyph="03"
            title="No padded SP"
            body="Every pilot is ESI-verified — SP and skills come straight from the API, not self-reported. We can't stop someone from posting a fresh alt, but we can stop them from lying about what's on it."
          />
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div style={{
        marginTop: 48,
        padding: '28px 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 32,
        border: '1px solid var(--border-soft)',
        borderTop: '2px solid var(--accent)',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(160deg, oklch(0.24 0.022 250) 0%, var(--bg-panel) 100%)',
      }}>
        <div>
          <div className="eyebrow accent">// ready?</div>
          <h2 style={{ marginTop: 8, fontSize: 28 }}>Your fleet is out there.</h2>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-mute)', lineHeight: 1.55 }}>
            Sign in with your EVE character and find the corp that actually fits.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          {!auth.token && (
            <Btn primary lg onClick={login}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 L20 7 V17 L12 22 L4 17 V7 Z" /><circle cx="12" cy="12" r="3" /></svg>
              Log in with EVE SSO
            </Btn>
          )}
          {auth.token && (
            <Btn lg onClick={() => navigate('/search/corps')}>Browse corps</Btn>
          )}
        </div>
      </div>

      {/* ── Footer note ── */}
      <div style={{ marginTop: 48, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
        // independent third-party. not affiliated with <a href="https://fenris.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-dim)', textDecoration: 'underline', textUnderlineOffset: 3 }}>fenris creations</a>. fly safe — but mostly fly dangerous.
      </div>
    </div>
  );
}

function OnboardCard({ body, steps }: { body: string; steps: string[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ margin: 0, fontSize: 26, fontWeight: 600, color: 'var(--accent-text)', lineHeight: 1.2 }}>{body}</p>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 13, top: 22, bottom: 10, width: 1, background: 'var(--border-soft)' }} />
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {steps.map((step, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent-text)',
                minWidth: 28, flexShrink: 0, position: 'relative', zIndex: 1,
                background: 'var(--bg-panel)',
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 15, color: 'var(--text-mid)', lineHeight: 1.4 }}>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function FeatureCard({ tag, title, body, example }: { tag: string; title: string; body: string; example: React.ReactNode }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, borderTop: '2px solid var(--accent-line)' }}>
      <div className="eyebrow accent">{tag}</div>
      <h3 style={{ fontSize: 22, lineHeight: 1.2 }}>{title}</h3>
      <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6 }}>{body}</p>
      <div style={{ marginTop: 'auto', paddingTop: 10 }}>{example}</div>
    </div>
  );
}

function Differentiator({ glyph, title, body }: { glyph: string; title: string; body: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-text)', letterSpacing: '0.1em', marginBottom: 12 }}>// {glyph}</div>
      <h3 style={{ marginBottom: 10, fontSize: 17 }}>{title}</h3>
      <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.65 }}>{body}</p>
    </div>
  );
}

function MiniSearch() {
  return (
    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-soft)', borderRadius: 6, padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mid)' }}>
      {[
        ['tz', 'EU prime'],
        ['sp', '25M+'],
        ['content', 'blops, small gang'],
      ].map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingBlock: '5px', borderBottom: '1px solid var(--border-soft)' }}>
          <span style={{ color: 'var(--text-dim)' }}>{k}</span>
          <span style={{ color: 'var(--accent-text)' }}>{v}</span>
        </div>
      ))}
      <div style={{ marginTop: 10, color: 'var(--good)', fontSize: 13 }}>→ 247 pilots match</div>
    </div>
  );
}

function MiniKB() {
  return (
    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-soft)', borderRadius: 6, padding: '14px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, fontFamily: 'var(--font-mono)' }}>
        {([
          { label: 'KILLS', value: '1,247', color: 'var(--good)' },
          { label: 'LOSSES', value: '312', color: 'var(--loss)' },
          { label: 'EFF', value: '89.4%', color: 'var(--accent-text)' },
          { label: 'ISK', value: '412B', color: 'var(--text)' },
        ] as const).map(({ label, value, color }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>{label}</div>
            <div style={{ fontSize: 20, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, height: 1, background: 'var(--border-soft)' }} />
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>last 90 days · 1,559 engagements</div>
    </div>
  );
}

function MiniPilotCard() {
  return (
    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginBottom: 10, letterSpacing: '0.08em' }}>// your profile</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <img
          src="https://images.evetech.net/characters/93774683/portrait?size=64"
          alt="John Doe"
          style={{ width: 44, height: 44, borderRadius: 'var(--radius)', border: '1px solid var(--border-soft)', flexShrink: 0, objectFit: 'cover', display: 'block' }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: 14 }}>John Doe</div>
          <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 2 }}>42.3M SP · EU prime</div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--good)', flexShrink: 0 }}>87% eff</div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
        {['Black ops', 'Small gang', 'Logi'].map(t => (
          <span key={t} className="pill accent" style={{ fontSize: 11 }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function MiniCorpCard() {
  return (
    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginBottom: 10, letterSpacing: '0.08em' }}>// your listing</div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <img
          src="https://images.evetech.net/corporations/633462446/logo?size=64"
          alt="MagicSandCastle"
          style={{ width: 44, height: 44, borderRadius: 'var(--radius)', border: '1px solid var(--border-soft)', flexShrink: 0, objectFit: 'cover', display: 'block' }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-text)' }}>CORP</div>
          <div style={{ fontWeight: 500, fontSize: 15, marginTop: 2 }}>MagicSandCastle</div>
          <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 2 }}>EU · 25M SP min · Logi wanted</div>
        </div>
        <span className="pill good" style={{ fontSize: 11, flexShrink: 0 }}><span className="dot" />open</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
        {['Black ops', 'Wormhole', 'Capital'].map(t => (
          <span key={t} className="pill accent" style={{ fontSize: 11 }}>{t}</span>
        ))}
      </div>
    </div>
  );
}
