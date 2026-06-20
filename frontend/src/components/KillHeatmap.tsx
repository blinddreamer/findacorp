interface KillHeatmapProps {
  grid: number[][];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LEVEL_LABELS = ['idle', 'low', 'moderate', 'high', 'peak'];

export default function KillHeatmap({ grid }: KillHeatmapProps) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: 4 }}>
        <div />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 3, marginBottom: 4 }}>
          {[0, 6, 12, 18].map(h => (
            <div key={h} style={{ gridColumn: `${h + 1} / span 6`, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)' }}>{String(h).padStart(2, '0')}:00</div>
          ))}
        </div>
        {grid.map((row, i) => (
          <>
            <div key={`d${i}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', display: 'grid', alignItems: 'center' }}>{DAYS[i]}</div>
            <div key={`r${i}`} className="heatmap">
              {row.map((lvl, j) => (
                <div key={j} className="h-cell" data-lvl={lvl > 0 ? String(lvl) : undefined} title={`${DAYS[i]} ${String(j).padStart(2, '0')}:00 — ${LEVEL_LABELS[lvl]}`} />
              ))}
            </div>
          </>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>
        <span>idle</span>
        {[0, 1, 2, 3, 4].map(l => (
          <div key={l} className="h-cell" data-lvl={l > 0 ? String(l) : undefined} style={{ width: 12, height: 12, borderRadius: 2 }} />
        ))}
        <span>peak</span>
      </div>
    </div>
  );
}
