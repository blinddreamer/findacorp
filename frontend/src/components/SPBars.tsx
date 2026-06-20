import { fmtSP } from '../utils/format';

interface SPBarsProps {
  spByCat: Record<string, number>;
}

export default function SPBars({ spByCat }: SPBarsProps) {
  const values = Object.values(spByCat);
  const max = Math.max(...values);
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <div>
      {Object.entries(spByCat).map(([name, val]) => (
        <div key={name} className="spbar-row">
          <div className="spbar-name">{name}</div>
          <div className="spbar-track">
            <div className="spbar-fill" style={{ width: (val / max * 100) + '%' }} />
          </div>
          <div className="spbar-val">{fmtSP(val)}</div>
        </div>
      ))}
      <div className="divider" />
      <div className="spbar-row">
        <div className="spbar-name" style={{ color: 'var(--text)' }}>Total</div>
        <div />
        <div className="spbar-val" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>{fmtSP(total)}</div>
      </div>
    </div>
  );
}
