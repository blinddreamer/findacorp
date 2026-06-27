import { useNavigate } from 'react-router-dom';
import Btn from '../components/Btn';
import Pill from '../components/Pill';
import { useAuth } from '../auth/useAuth';

export default function LandingScreen() {
  const navigate = useNavigate();
  const auth = useAuth();

  function login() {
    window.location.href = '/auth/login';
  }

  return (
    <div className="page" style={{ paddingTop: 0 }}>
      <section className="hero">
        <div className="eyebrow accent">// FINDACORP · v1.0 · pilots online</div>
        <h1>Stop ratting alone. Find your fleet.</h1>
        <p className="lede">
          FINDACORP is a third-party recruitment platform for New Eden. Pilots build a real profile from ESI + zKill data — no more "20m SP DPS LFC" forum posts. Corp HR searches by what actually matters: timezone overlap, content type.
        </p>
        <div className="ctas">
          {!auth.token && (
            <Btn primary lg onClick={login}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 L20 7 V17 L12 22 L4 17 V7 Z" /><circle cx="12" cy="12" r="3" /></svg>
              Log in with EVE SSO
            </Btn>
          )}
          <Btn lg onClick={() => navigate('/search/corps')}>
            {auth.token ? 'Browse corps' : 'Browse corps as guest'}
          </Btn>
        </div>
        <div style={{ marginTop: 18, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
          // we pull ESI character + skill + corp history scopes only. read-only. you can revoke any time.
        </div>
      </section>

      <div className="ticker">
        <div className="cell"><div className="k">Pilots indexed</div><div className="v">N/A</div></div>
        <div className="cell"><div className="k">Corps recruiting</div><div className="v accent">N/A</div></div>
        <div className="cell"><div className="k">Matches this week</div><div className="v">N/A</div></div>
        <div className="cell"><div className="k">Most-wanted role</div><div className="v" style={{ fontSize: 18 }}>Logi</div></div>
        <div className="cell"><div className="k">Tranquility status</div><div className="v" style={{ fontSize: 14, color: 'var(--good)' }}>● Online</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 32 }}>
        <FeatureCard
          tag="02 — FOR CORP HR"
          title="Search by timezone overlap, not by SP number."
          body="Filter the pilot pool by your prime-time hours. See who actually logs in. Stop signing recruits who ghost after the first ping."
          example={<MiniSearch />}
        />
        <FeatureCard
          tag="03 — REAL DATA"
          title="Killboard data, on every card."
          body="zKill kills, losses, and efficiency are visible to corps. No padded resumes, no 'I FC' guys with 4 kills. The data tells the truth."
          example={<MiniKB />}
        />
      </div>

      <div style={{ marginTop: 56, padding: 32, border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-panel)' }}>
        <div className="eyebrow">// what makes findacorp different</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 18 }}>
          <div>
            <h3 style={{ marginBottom: 10 }}>Honest, not friendly</h3>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
              Corps mark themselves <Pill kind="good">open</Pill>, <Pill kind="accent">selective</Pill>, or <Pill kind="danger">closed</Pill>. No false hope.
            </p>
          </div>
          <div>
            <h3 style={{ marginBottom: 10 }}>Built for the EVE we actually play</h3>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
              Filters for blops, sov-grind, wormhole rolling, FW plex farming, capital escalations, abyssal speedrunning. If your corp does it, we have a tag for it. No "PvE / PvP / Both."
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 80, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
        // independent third-party. not affiliated with ccp games. fly safe — but mostly fly dangerous.
      </div>
    </div>
  );
}

function FeatureCard({ tag, title, body, example }: { tag: string; title: string; body: string; example: React.ReactNode }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="eyebrow accent">{tag}</div>
      <h3 style={{ fontSize: 22, lineHeight: 1.2 }}>{title}</h3>
      <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.55 }}>{body}</p>
      <div style={{ marginTop: 'auto', paddingTop: 10 }}>{example}</div>
    </div>
  );
}

function MiniSearch() {
  return (
    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-soft)', borderRadius: 6, padding: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.7 }}>
      <div>tz=eu_late <span style={{ color: 'var(--text-dim)' }}>&amp;</span> sp&gt;=25M</div>
      <div>content=blops,small_gang</div>
      <div>activity=daily</div>
      <div style={{ color: 'var(--accent-text)', marginTop: 6 }}>→ 247 pilots match</div>
    </div>
  );
}

function MiniKB() {
  return (
    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-soft)', borderRadius: 6, padding: 10, display: 'flex', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
      <div><div style={{ color: 'var(--text-dim)' }}>K</div><div style={{ color: 'var(--good)' }}>1,247</div></div>
      <div><div style={{ color: 'var(--text-dim)' }}>L</div><div style={{ color: 'var(--loss)' }}>312</div></div>
      <div><div style={{ color: 'var(--text-dim)' }}>EFF</div><div style={{ color: 'var(--accent-text)' }}>89.4%</div></div>
      <div><div style={{ color: 'var(--text-dim)' }}>ISK</div><div>412B</div></div>
    </div>
  );
}
