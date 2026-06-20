interface TZRingProps {
  activeHours?: number[];
  peakHours?: number[];
  otherHours?: number[];
  label?: string;
  subLabel?: string;
  editable?: boolean;
  selectedHours?: number[];
  onHoursChange?: (hours: number[]) => void;
  overlapPct?: number;
}

export default function TZRing({
  activeHours = [], peakHours = [], otherHours = [],
  label = 'ACTIVITY', subLabel,
  editable = false, selectedHours = [], onHoursChange,
  overlapPct,
}: TZRingProps) {
  const cx = 100, cy = 100, rOuter = 92, rMid = 78, rInner = 56;
  const segments = Array.from({ length: 24 }, (_, h) => {
    const a1 = (h / 24) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((h + 1) / 24) * Math.PI * 2 - Math.PI / 2;
    return { h, a1, a2 };
  });

  function arcPath(a1: number, a2: number, rO: number, rI: number) {
    const x1 = cx + Math.cos(a1) * rO, y1 = cy + Math.sin(a1) * rO;
    const x2 = cx + Math.cos(a2) * rO, y2 = cy + Math.sin(a2) * rO;
    const x3 = cx + Math.cos(a2) * rI, y3 = cy + Math.sin(a2) * rI;
    const x4 = cx + Math.cos(a1) * rI, y4 = cy + Math.sin(a1) * rI;
    return `M${x1} ${y1} A${rO} ${rO} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${rI} ${rI} 0 0 0 ${x4} ${y4} Z`;
  }

  function handleClick(h: number) {
    if (!editable || !onHoursChange) return;
    const next = selectedHours.includes(h)
      ? selectedHours.filter(x => x !== h)
      : [...selectedHours, h].sort((a, b) => a - b);
    onHoursChange(next);
  }

  return (
    <svg className="tzring" viewBox="0 0 200 200" style={{ overflow: 'visible', cursor: editable ? 'pointer' : 'default' }}>
      <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="oklch(0.30 0.012 250)" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="oklch(0.30 0.012 250)" strokeWidth="0.5" />
      {segments.map(s => {
        const isSelected = editable ? selectedHours.includes(s.h) : false;
        const isPeak = !editable && peakHours.includes(s.h);
        const isActive = !editable && activeHours.includes(s.h);
        const isOther = !editable && otherHours.includes(s.h);
        const isOverlap = isActive && isOther;

        const fill = (isPeak || isSelected)
          ? 'var(--accent)'
          : isOverlap
            ? 'oklch(0.72 0.18 145)'
            : isActive
              ? 'var(--accent-line)'
              : 'oklch(0.25 0.012 250)';
        const opacity = (isPeak || isSelected) ? 1 : (isOverlap || isActive) ? 0.85 : editable ? 0.25 : 0.4;

        return (
          <g key={s.h} onClick={() => handleClick(s.h)}>
            <path
              d={arcPath(s.a1 + 0.01, s.a2 - 0.01, rOuter, rMid)}
              fill={fill}
              opacity={opacity}
            />
            {isOther && (
              <path
                d={arcPath(s.a1 + 0.01, s.a2 - 0.01, rMid - 2, rInner + 2)}
                fill={isOverlap ? 'oklch(0.72 0.18 145)' : 'oklch(0.78 0.14 75)'}
                opacity={0.7}
              />
            )}
            {editable && (
              <path
                d={arcPath(s.a1 + 0.01, s.a2 - 0.01, rOuter, rMid)}
                fill="transparent"
              />
            )}
          </g>
        );
      })}
      {[0, 6, 12, 18].map(h => {
        const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
        const x1 = cx + Math.cos(a) * (rOuter + 3);
        const y1 = cy + Math.sin(a) * (rOuter + 3);
        const x2 = cx + Math.cos(a) * (rOuter + 9);
        const y2 = cy + Math.sin(a) * (rOuter + 9);
        return (
          <g key={h}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-mute)" strokeWidth="0.5" />
            <text x={x2 + Math.cos(a) * 6} y={y2 + Math.sin(a) * 6 + 3} textAnchor="middle" fontSize="9" fill="var(--text-mute)" fontFamily="var(--font-mono)">{String(h).padStart(2, '0')}</text>
          </g>
        );
      })}
      {overlapPct != null ? (
        <>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="22" fill="var(--accent-text)"
                fontFamily="var(--font-mono)" fontWeight="600">{overlapPct}%</text>
          <text x={cx} y={cy + 22} textAnchor="middle" fontSize="7" fill="var(--text-dim)"
                fontFamily="var(--font-mono)" letterSpacing="1.5">OVERLAP</text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="9" fill="var(--text-mute)" fontFamily="var(--font-mono)" letterSpacing="1.2">
            {editable ? 'SET HOURS' : label}
          </text>
          {subLabel && (
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize="8" fill="var(--text-dim)" fontFamily="var(--font-mono)" letterSpacing="1">{subLabel}</text>
          )}
        </>
      )}
    </svg>
  );
}
