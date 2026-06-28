import type { CorpProfile } from '../../types/corp';
import Btn from '../../components/Btn';
import Stat from '../../components/Stat';

export default function CorpKillboard({ c }: { c: CorpProfile }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div className="card">
        <div className="section-head">
          <h3>Kill stats</h3>
          <span className="label">/ zKillboard</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {c.killsLast30 != null && <Stat label="Total kills" value={c.killsLast30.toLocaleString()} accent />}
          {c.efficiency != null && <Stat label="Efficiency" value={`${Number(c.efficiency).toFixed(1)}%`} accent />}
          {c.members != null && <Stat label="Members" value={c.members.toLocaleString()} />}
          {c.founded != null && <Stat label="Founded" value={c.founded} />}
        </div>
        {c.killsLast30 == null && (
          <div className="muted" style={{ textAlign: 'center', padding: 24 }}>Kill data not yet synced.</div>
        )}
        {c.lastSyncedAt && (
          <div className="muted" style={{ fontSize: 11, marginTop: 12 }}>
            Last synced: {new Date(c.lastSyncedAt).toLocaleString()}
          </div>
        )}
      </div>
      <div className="card">
        <div className="section-head"><h3>Data &amp; sync</h3></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn ghost onClick={() => window.open(`https://zkillboard.com/corporation/${c.corpId}/`, '_blank')}>
            Open corp in zKillboard ↗
          </Btn>
          <Btn ghost onClick={() => window.open(`https://evewho.com/corp/${c.corpId}`, '_blank')}>
            View on EVE Who ↗
          </Btn>
        </div>
      </div>
    </div>
  );
}
