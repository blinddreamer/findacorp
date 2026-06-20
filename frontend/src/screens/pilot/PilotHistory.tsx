import { useMemo, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { getCorp } from '../../api/profileApi';
import type { PilotProfile } from '../../types/pilot';

function isNpcCorp(corpId?: number): boolean {
  return corpId != null && corpId < 2_000_000;
}

function CorpNameLink({ corpId, corpName, inDrydock }: { corpId?: number; corpName: string; inDrydock?: boolean }) {
  const npc = isNpcCorp(corpId);
  const linkStyle: CSSProperties = {
    color: npc ? 'var(--text-mute)' : 'var(--accent-text)',
    textDecoration: 'none',
    fontWeight: 600,
  };

  const badge = npc ? (
    <span style={{
      fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.5px',
      padding: '1px 5px', marginLeft: 6, borderRadius: 3,
      background: 'var(--bg-elev)', border: '1px solid var(--border)',
      color: 'var(--text-mute)', verticalAlign: 'middle',
    }}>NPC</span>
  ) : null;

  if (!corpId) {
    return <><b>{corpName}</b>{badge}</>;
  }

  if (npc || !inDrydock) {
    return (
      <a href={`https://evewho.com/corporation/${corpId}`} target="_blank" rel="noopener noreferrer" style={linkStyle}>
        {corpName}{badge}
      </a>
    );
  }

  return (
    <Link to={`/corps/${corpId}`} style={linkStyle}>
      {corpName}
    </Link>
  );
}

export default function PilotHistory({ p }: { p: PilotProfile }) {
  const playerCorpIds = useMemo(() => {
    const seen = new Set<number>();
    const ids: number[] = [];
    for (const h of p.corpHistory ?? []) {
      if (h.corpId != null && !isNpcCorp(h.corpId) && !seen.has(h.corpId)) {
        seen.add(h.corpId);
        ids.push(h.corpId);
      }
    }
    return ids;
  }, [p.corpHistory]);

  const corpChecks = useQueries({
    queries: playerCorpIds.map(corpId => ({
      queryKey: ['corp', corpId],
      queryFn: () => getCorp(corpId),
      retry: false,
      staleTime: 10 * 60 * 1000,
    })),
  });

  const drydockIds = useMemo(() => {
    const set = new Set<number>();
    corpChecks.forEach((q, i) => { if (q.isSuccess) set.add(playerCorpIds[i]); });
    return set;
  }, [corpChecks, playerCorpIds]);

  if (!p.corpHistory || p.corpHistory.length === 0) {
    return <div className="card" style={{ padding: 32, textAlign: 'center' }}>Corp history not yet synced.</div>;
  }
  return (
    <div className="card">
      <div className="section-head"><h3>Corp history</h3><span className="label">/ from ESI</span></div>
      <div>
        {p.corpHistory.map((h, i) => {
          const npc = isNpcCorp(h.corpId);
          return (
            <div key={i} className={`history-row ${i > 0 ? 'past' : ''}`} style={npc ? { opacity: 0.72 } : undefined}>
              <div className="when">{h.fromDate} → {h.toDate ?? 'now'}</div>
              <div className="dot" />
              <div className="corp">
                <CorpNameLink
                  corpId={h.corpId}
                  corpName={h.corpName}
                  inDrydock={h.corpId != null ? drydockIds.has(h.corpId) : false}
                />
                {h.alliance && <span> · <span className="muted">{h.alliance}</span></span>}
              </div>
              <div className="dur">{h.durationLabel}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
