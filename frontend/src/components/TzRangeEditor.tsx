import { useState, useMemo, useEffect, type CSSProperties } from 'react';
import TZRing from './TZRing';
import Stat from './Stat';
import { inferTz, buildRange, detectRange } from '../utils/tz';

function HourStepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const btn: CSSProperties = {
    width: 36, height: 22, display: 'grid', placeItems: 'center',
    background: 'var(--bg-elev)', border: '1px solid var(--border)',
    borderRadius: 3, cursor: 'pointer', fontSize: 10,
    color: 'var(--text-mute)', userSelect: 'none',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div className="stat-label" style={{ marginBottom: 4 }}>{label}</div>
      <div style={btn} onClick={() => onChange((value + 1) % 24)}>▲</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 38, color: 'var(--accent-text)', lineHeight: 1, padding: '6px 0' }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={btn} onClick={() => onChange((value - 1 + 24) % 24)}>▼</div>
      <div style={{ fontSize: 10, color: 'var(--text-mute)', fontFamily: 'var(--font-mono)', marginTop: 5 }}>
        {String(value).padStart(2, '0')}:00 UTC
      </div>
    </div>
  );
}

/** FROM/TO active-hours editor backed by a TZRing preview. Shared by pilot & corp screens. */
export default function TzRangeEditor({ hours, onChange }: { hours: number[]; onChange: (h: number[]) => void }) {
  const [from, setFrom] = useState(() => detectRange(hours)[0]);
  const [to, setTo] = useState(() => detectRange(hours)[1]);

  const derived = useMemo(() => buildRange(from, to), [from, to]);

  // If opened with no hours set, adopt the displayed default range so it persists
  // even when the user clicks through without touching the FROM/TO controls.
  useEffect(() => {
    if (hours.length === 0) onChange(buildRange(from, to));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFrom(v: number) { setFrom(v); onChange(buildRange(v, to)); }
  function handleTo(v: number) { setTo(v); onChange(buildRange(from, v)); }

  const tz = derived.length > 0 ? inferTz(derived) : '—';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28, alignItems: 'center' }}>
      <TZRing activeHours={derived} label="ACTIVE HOURS" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <HourStepper label="FROM" value={from} onChange={handleFrom} />
          <div style={{ fontSize: 18, color: 'var(--text-mute)', marginTop: 26 }}>→</div>
          <HourStepper label="TO" value={to} onChange={handleTo} />
        </div>
        <Stat
          label="Active window"
          value={`${String(from).padStart(2, '0')}:00 – ${String(to + 1).padStart(2, '0')}:00`}
          sub={`${derived.length}h · ${tz} prime`}
          accent
        />
      </div>
    </div>
  );
}
