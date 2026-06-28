import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchPilots } from '../api/profileApi';
import type { PilotSearchResult } from '../types/pilot';
import { useRecruiterStatus } from '../auth/useIsRecruiter';
import Avatar from '../components/Avatar';
import Pill from '../components/Pill';
import Btn from '../components/Btn';
import PostListingModal from './PostListingModal';
import { fmtSP } from '../utils/format';

interface Filters {
  tz: Record<string, boolean>;
  content: Record<string, boolean>;
  minSP: number;
  activity: Record<string, boolean>;
  role: Record<string, boolean>;
  minEff: number;
}

const TZ_OPTS = ['EU', 'US', 'AU'];
const CONTENT_OPTS = ['Null', 'Small gang', 'Black ops', 'Wormhole', 'Lowsec', 'Industry', 'Capital', 'Mining', 'Exploration', 'FW', 'FW Plexing', 'FW Small Gang'];
const ROLE_OPTS = ['Logi', 'DPS', 'Capital'];
const ACTIVITY_OPTS = ['Daily', 'Weekly', 'Casual'];

export default function SearchPilotsScreen() {
  const navigate = useNavigate();
  const { isRecruiter, isResolved, hasListing } = useRecruiterStatus();
  const [showListingModal, setShowListingModal] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    tz: { EU: true, US: false, AU: false },
    content: { 'Null': false, 'Small gang': true, 'Black ops': true, 'Wormhole': false, 'Lowsec': false, 'Industry': false, 'Capital': false, 'Mining': false, 'Exploration': false, 'FW': false, 'FW Plexing': false, 'FW Small Gang': false },
    minSP: 25,
    activity: { Daily: true, Weekly: false, Casual: false },
    role: { 'Logi': true, 'DPS': false, 'Capital': false },
    minEff: 75,
  });

  const toggle = (group: keyof Filters, key: string) =>
    setFilters(f => ({ ...f, [group]: { ...(f[group] as Record<string, boolean>), [key]: !(f[group] as Record<string, boolean>)[key] } }));

  const activeTz = Object.entries(filters.tz).filter(([, v]) => v).map(([k]) => k).join(',');
  const activeContent = Object.entries(filters.content).filter(([, v]) => v).map(([k]) => k).join(',');
  const activeRoles = Object.entries(filters.role).filter(([, v]) => v).map(([k]) => k).join(',');

  const { data: pilots = [], isLoading } = useQuery({
    queryKey: ['pilots', filters],
    queryFn: () => searchPilots({
      tz: activeTz || undefined,
      minSp: filters.minSP * 1_000_000,
      minEff: filters.minEff,
      roles: activeRoles || undefined,
      content: activeContent || undefined,
    }),
    enabled: isRecruiter && hasListing, // require a published listing before searching
    staleTime: 2 * 60 * 1000,
  });

  // Recruiter-only screen: wait for resolution, then bounce non-CEO/HR users home.
  if (!isResolved) {
    return <div className="page"><div className="mono" style={{ color: 'var(--text-dim)' }}>Checking access…</div></div>;
  }
  if (!isRecruiter) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <div className="eyebrow">// HR · find pilots</div>
          <h2 style={{ marginTop: 6 }}>Find pilots</h2>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn sm ghost>Save search</Btn>
          <Btn sm primary onClick={() => setShowListingModal(true)}>+ Post recruitment listing</Btn>
        </div>
      </div>

      {!hasListing ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px', maxWidth: 560, margin: '0 auto' }}>
          <div className="eyebrow accent" style={{ justifyContent: 'center' }}>// listing required</div>
          <h3 style={{ marginTop: 12, fontSize: 18 }}>Post your recruitment listing first</h3>
          <p className="muted" style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.6 }}>
            Before you can search and contact pilots, your corp needs a published recruitment
            listing — that's how pilots find and apply to you in return.
          </p>
          <div style={{ marginTop: 20 }}>
            <Btn primary onClick={() => setShowListingModal(true)}>+ Post recruitment listing</Btn>
          </div>
        </div>
      ) : (
      <div className="two-col-r">
        <aside className="card" style={{ alignSelf: 'start', position: 'sticky', top: 72 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <h3 style={{ fontSize: 14 }}>Filters</h3>
            <Btn sm ghost onClick={() => setFilters({ tz: {}, content: {}, minSP: 0, activity: {}, role: {}, minEff: 0 })}>Reset</Btn>
          </div>

          <FilterGroup name="Timezone (EVE)" count={Object.values(filters.tz).filter(Boolean).length}>
            {TZ_OPTS.map(tz => (
              <CheckRow key={tz} label={`${tz} prime`} checked={!!filters.tz[tz]} onToggle={() => toggle('tz', tz)} />
            ))}
          </FilterGroup>

          <FilterGroup name="Minimum SP">
            <div className="range-row">
              <input type="range" min="0" max="200" step="5" value={filters.minSP} onChange={e => setFilters(f => ({ ...f, minSP: +e.target.value }))} style={{ flex: 1, accentColor: 'var(--accent)' }} />
              <span style={{ width: 56, textAlign: 'right' }}>{filters.minSP}M+</span>
            </div>
          </FilterGroup>

          <FilterGroup name="Minimum efficiency">
            <div className="range-row">
              <input type="range" min="0" max="100" step="5" value={filters.minEff} onChange={e => setFilters(f => ({ ...f, minEff: +e.target.value }))} style={{ flex: 1, accentColor: 'var(--accent)' }} />
              <span style={{ width: 56, textAlign: 'right' }}>{filters.minEff}%+</span>
            </div>
          </FilterGroup>

          <FilterGroup name="Role">
            {ROLE_OPTS.map(r => (
              <CheckRow key={r} label={r} checked={!!filters.role[r]} onToggle={() => toggle('role', r)} />
            ))}
          </FilterGroup>

          <FilterGroup name="Content type">
            {CONTENT_OPTS.map(c => (
              <CheckRow key={c} label={c} checked={!!filters.content[c]} onToggle={() => toggle('content', c)} />
            ))}
          </FilterGroup>

          <FilterGroup name="Activity">
            {ACTIVITY_OPTS.map(a => (
              <CheckRow key={a} label={a} checked={!!filters.activity[a]} onToggle={() => toggle('activity', a)} />
            ))}
          </FilterGroup>
        </aside>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div className="mono" style={{ fontSize: 13 }}>
                {isLoading ? 'Searching…' : <><span className="accent" style={{ color: 'var(--accent-text)' }}>{pilots.length}</span> <span className="muted">pilots match</span></>}
              </div>
            </div>
            <select className="input" style={{ width: 'auto', paddingRight: 24 }}>
              <option>SP (high → low)</option>
              <option>Efficiency</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pilots.map(p => <PilotResultRow key={p.characterId} p={p} onClick={() => navigate(`/pilots/${p.characterId}`)} />)}
            {!isLoading && pilots.length === 0 && (
              <div className="empty">No matches. Loosen SP minimum or add another timezone.</div>
            )}
          </div>
        </div>
      </div>
      )}

      {showListingModal && <PostListingModal onClose={() => setShowListingModal(false)} />}
    </div>
  );
}

function PilotResultRow({ p, onClick }: { p: PilotSearchResult; onClick: () => void }) {
  return (
    <div className="pilot-card" onClick={onClick} style={{ gridTemplateColumns: '56px 1fr auto auto' }}>
      <Avatar seed={p.name ?? String(p.characterId)} size={56} />
      <div>
        <div className="name">
          {p.name ?? `Pilot #${p.characterId}`}
          {p.ticker && <span className="mono" style={{ fontSize: 11, color: 'var(--accent-text)', marginLeft: 6 }}>{p.ticker}</span>}
        </div>
        <div className="sub" style={{ marginTop: 4 }}>
          {p.corp && <span>{p.corp}</span>}
          {p.sp != null && <><span className="dim">·</span><span className="mono">{fmtSP(p.sp)} SP</span></>}
          {p.tz && <><span className="dim">·</span><span>{p.tz} prime</span></>}
          {p.tzPeak && p.tzPeak.length > 0 && <span>peak {String(p.tzPeak[0]).padStart(2, '0')}–{String(p.tzPeak[p.tzPeak.length - 1] + 1).padStart(2, '0')}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {p.roles?.slice(0, 3).map(r => <Pill key={r} kind="accent">{r}</Pill>)}
          {p.content?.slice(0, 2).map(c => <Pill key={c}>{c}</Pill>)}
        </div>
      </div>
      {p.kbEfficiency != null && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, minWidth: 96 }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>EFFICIENCY</div>
          <div className="mono" style={{ fontSize: 17, color: 'var(--accent-text)', fontWeight: 500 }}>{p.kbEfficiency}%</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{p.kbKills}K · {p.kbLosses}L</div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Btn sm primary onClick={e => { e.stopPropagation(); onClick(); }}>View</Btn>
      </div>
    </div>
  );
}

function FilterGroup({ name, children, count }: { name: string; children: React.ReactNode; count?: number }) {
  return (
    <div className="filter-group">
      <div className="head">
        <span className="name">{name}</span>
        {count !== undefined && <span className="mono dim" style={{ fontSize: 11 }}>{count}</span>}
      </div>
      {children}
    </div>
  );
}

function CheckRow({ label, count, checked, onToggle }: { label: string; count?: number | string; checked: boolean; onToggle: () => void }) {
  return (
    <label className="checkbox-row">
      <input type="checkbox" checked={checked} onChange={onToggle} />
      <span>{label}</span>
      {count !== undefined && <span className="count">{count}</span>}
    </label>
  );
}
