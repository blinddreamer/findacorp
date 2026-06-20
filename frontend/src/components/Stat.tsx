interface StatProps {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: boolean;
}

import { type ReactNode } from 'react';

export default function Stat({ label, value, sub, accent }: StatProps) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={accent ? { color: 'var(--accent-text)' } : undefined}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
