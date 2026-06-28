import { useState, useEffect, useMemo } from 'react';
import type { PilotProfile } from '../../types/pilot';
import Stat from '../../components/Stat';
import KillHeatmap from '../../components/KillHeatmap';
import { fmtISK } from '../../utils/format';

export default function PilotKillboard({ p }: { p: PilotProfile }) {
  const [resolvedTypeIds, setResolvedTypeIds] = useState<Record<string, number>>({});

  const topShips = useMemo(() => {
    if (!p.killHistory) return [];
    const counts = new Map<string, { kills: number; losses: number; typeId?: number }>();
    for (const k of p.killHistory) {
      if (!k.ship || k.ship === 'Unknown') continue;
      const entry = counts.get(k.ship) ?? { kills: 0, losses: 0, typeId: k.shipTypeId };
      if (k.kind === 'kill') entry.kills++;
      else entry.losses++;
      if (!entry.typeId && k.shipTypeId) entry.typeId = k.shipTypeId;
      counts.set(k.ship, entry);
    }
    return Array.from(counts.entries())
      .map(([ship, { kills, losses, typeId }]) => ({ ship, kills, losses, typeId, total: kills + losses }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);
  }, [p.killHistory]);

  useEffect(() => {
    const missing = topShips.filter(s => !s.typeId).map(s => s.ship);
    if (missing.length === 0) return;
    fetch('https://esi.evetech.net/latest/universe/ids/?datasource=tranquility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(missing),
    })
      .then(r => r.json())
      .then((data: { types?: { id: number; name: string }[] }) => {
        if (!data.types) return;
        const map: Record<string, number> = {};
        for (const t of data.types) map[t.name] = t.id;
        setResolvedTypeIds(prev => ({ ...prev, ...map }));
      })
      .catch(() => {});
  }, [topShips]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="section-head" style={{ marginBottom: 16 }}><h3>Lifetime stats</h3><span className="label">/ zkillboard</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {p.kbKills != null && <Stat label="Kills" value={p.kbKills.toLocaleString()} accent />}
            {p.soloKills != null && <Stat label="Solo kills" value={p.soloKills.toLocaleString()} accent />}
            {p.kbLosses != null && <Stat label="Losses" value={p.kbLosses.toLocaleString()} />}
            {p.kbEfficiency != null && <Stat label="Efficiency" value={`${Number(p.kbEfficiency).toFixed(1)}%`} accent />}
            {p.iskDestroyed != null && <Stat label="ISK destroyed" value={fmtISK(p.iskDestroyed)} />}
            {p.iskLost != null && <Stat label="ISK lost" value={fmtISK(p.iskLost)} />}
          </div>
          {p.kbKills == null && <div className="muted" style={{ padding: '16px 0' }}>Kill data not yet synced.</div>}
        </div>
        {p.heatmap && (
          <div className="card">
            <div className="section-head" style={{ marginBottom: 16, width: '100%' }}><h3>Kill activity by hour</h3><span className="label">/ last 7 days</span></div>
            <KillHeatmap grid={p.heatmap} />
          </div>
        )}
      </div>
      {topShips.length > 0 && (
        <div className="card">
          <div className="section-head"><h3>Top ships flown</h3><span className="label">/ from kill history</span></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {topShips.map(({ ship, kills, losses, typeId }) => {
              const effectiveTypeId = typeId ?? resolvedTypeIds[ship];
              return (
              <div key={ship} className="skill-cell" style={{ alignItems: 'center' }}>
                <div style={{ width: 64, height: 64, background: 'var(--bg-elev)', borderRadius: 4, overflow: 'hidden', marginBottom: 8, flexShrink: 0 }}>
                  {effectiveTypeId ? (
                    <img
                      src={`https://images.evetech.net/types/${effectiveTypeId}/render?size=64`}
                      alt={ship}
                      style={{ width: 64, height: 64, objectFit: 'cover', display: 'block' }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: 64, height: 64, display: 'grid', placeItems: 'center' }}>
                      <svg width="40%" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.7">
                        <path d="M12 2 L20 8 L17 22 L7 22 L4 8 Z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12.5, textAlign: 'center' }}>{ship}</div>
                <div className="mono" style={{ fontSize: 11, color: losses > kills ? 'var(--loss)' : 'var(--text-mute)', textAlign: 'center' }}>
                  {kills}K · {losses}L
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
