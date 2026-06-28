import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchCorps } from '../api/profileApi';
import type { CorpSearchResult } from '../types/corp';
import CorpLogo from '../components/CorpLogo';
import Pill from '../components/Pill';
import Btn from '../components/Btn';
import { fmtSP } from '../utils/format';

interface Filters {
  tz: Record<string, boolean>;
  content: Record<string, boolean>;
  spReq: number;
  status: Record<string, boolean>;
}

const TZ_OPTS = ['EU', 'US', 'AU'];
const CONTENT_OPTS = ['Null', 'Small gang', 'Black ops', 'Wormhole', 'Lowsec', 'Industry', 'Capital', 'Mining', 'Exploration', 'FW', 'FW Small Gang'];
const STATUS_OPTS = ['open', 'selective', 'closed'];

export default function SearchCorpsScreen() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({
    tz: { EU: true, US: false, AU: false },
    content: { 'Null': false, 'Small gang': false, 'Black ops': true, 'Wormhole': false, 'Lowsec': true, 'Industry': false, 'Capital': false, 'Mining': false, 'Exploration': false, 'FW': false, 'FW Small Gang': false },
    spReq: 100,
    status: { open: true, selective: true, closed: false },
  });

  const toggle = (group: keyof Filters, key: string) =>
    setFilters(f => ({ ...f, [group]: { ...(f[group] as Record<string, boolean>), [key]: !(f[group] as Record<string, boolean>)[key] } }));

  const activeTz = Object.entries(filters.tz).filter(([, v]) => v).map(([k]) => k).join(',');
  const activeContent = Object.entries(filters.content).filter(([, v]) => v).map(([k]) => k).join(',');
  const activeStatus = Object.entries(filters.status).filter(([, v]) => v).map(([k]) => k).join(',');

  const { data: corps = [], isLoading } = useQuery({
    queryKey: ['corps', filters],
    queryFn: () => searchCorps({
      tz: activeTz || undefined,
      content: activeContent || undefined,
      maxMinSp: filters.spReq * 1_000_000,
      status: activeStatus || undefined,
    }),
    staleTime: 2 * 60 * 1000,
  });

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <div className="eyebrow">// find a corp</div>
          <h2 style={{ marginTop: 6 }}>Find a corp</h2>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn sm ghost onClick={() => navigate('/inbox')}>My applications</Btn>
        </div>
      </div>

      <div className="two-col-r">
        <aside className="card" style={{ alignSelf: 'start', position: 'sticky', top: 72 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <h3 style={{ fontSize: 14 }}>Filters</h3>
            <Btn sm ghost onClick={() => setFilters({ tz: {}, content: {}, spReq: 200, status: {} })}>Reset</Btn>
          </div>

          <FilterGroup name="Timezone">
            {TZ_OPTS.map(tz => (
              <CheckRow key={tz} label={`${tz} prime`} checked={!!filters.tz[tz]} onToggle={() => toggle('tz', tz)} />
            ))}
          </FilterGroup>

          <FilterGroup name="Content type">
            {CONTENT_OPTS.map(c => (
              <CheckRow key={c} label={c} checked={!!filters.content[c]} onToggle={() => toggle('content', c)} />
            ))}
          </FilterGroup>

          <FilterGroup name="They require ≤ SP">
            <div className="range-row">
              <input type="range" min="0" max="200" step="5" value={filters.spReq} onChange={e => setFilters(f => ({ ...f, spReq: +e.target.value }))} style={{ flex: 1, accentColor: 'var(--accent)' }} />
              <span style={{ width: 56, textAlign: 'right' }}>{filters.spReq}M</span>
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>Hide corps whose minimum SP requirement is above this.</div>
          </FilterGroup>

          <FilterGroup name="Status">
            {STATUS_OPTS.map(s => (
              <CheckRow key={s} label={s} checked={!!filters.status[s]} onToggle={() => toggle('status', s)} />
            ))}
          </FilterGroup>
        </aside>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="mono" style={{ fontSize: 13 }}>
              {isLoading ? 'Searching…' : <><span style={{ color: 'var(--accent-text)' }}>{corps.length}</span> <span className="muted">corps match</span></>}
            </div>
            <select className="input" style={{ width: 'auto', paddingRight: 24 }}>
              <option>Fit score (best first)</option>
              <option>Largest first</option>
              <option>Most active killboard</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {corps.map((c, i) => (
              <CorpResultRow key={c.corpId} c={c} fit={c.fitScore ?? (94 - i * 5)} onClick={() => navigate(`/corps/${c.corpId}`)} />
            ))}
            {!isLoading && corps.length === 0 && (
              <div className="empty">No corps match your filters. Try widening the search.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CorpResultRow({ c, fit, onClick }: { c: CorpSearchResult; fit: number; onClick: () => void }) {
  const statusKind = c.status === 'open' ? 'good' : c.status === 'selective' ? 'accent' : 'danger';
  return (
    <div className="corp-card" onClick={onClick}>
      <CorpLogo corpId={c.corpId} seed={c.name ?? String(c.corpId)} size={64} faction={c.faction} />
      <div style={{ minWidth: 0 }}>
        {c.ticker && c.alliance && <div className="ticker">{c.ticker} · {c.alliance}</div>}
        <div className="name">{c.name ?? `Corp #${c.corpId}`}</div>
        {c.tagline && <div className="blurb">{c.tagline}</div>}
        <div className="meta">
          {c.status && <Pill kind={statusKind}><span className="dot" />{c.status}</Pill>}
          {c.tz && <Pill>{c.tz} TZ</Pill>}
          {c.minSp != null && <Pill>min {fmtSP(c.minSp)} SP</Pill>}
          {c.content?.slice(0, 3).map(x => <Pill key={x} kind="accent">{x}</Pill>)}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, minWidth: 120 }}>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>FIT</div>
          <div className="mono" style={{ fontSize: 28, color: 'var(--accent-text)', fontWeight: 500, lineHeight: 1 }}>{fit}<span style={{ fontSize: 14, color: 'var(--text-dim)' }}>/100</span></div>
        </div>
        {c.members != null && <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'right' }}>{c.members} members</div>}
        <Btn sm>View →</Btn>
      </div>
    </div>
  );
}

function FilterGroup({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="filter-group">
      <div className="head"><span className="name">{name}</span></div>
      {children}
    </div>
  );
}

function CheckRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <label className="checkbox-row">
      <input type="checkbox" checked={checked} onChange={onToggle} />
      <span>{label}</span>
    </label>
  );
}
