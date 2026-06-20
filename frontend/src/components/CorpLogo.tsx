interface CorpLogoProps {
  seed?: string;
  size?: number;
  faction?: string;
}

export default function CorpLogo({ seed = 'c', size = 64, faction }: CorpLogoProps) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const facHue: Record<string, number> = { caldari: 240, amarr: 80, gallente: 150, minmatar: 40 };
  const fh = facHue[faction ?? ''] ?? 240;
  const shape = h % 4;
  return (
    <div style={{ width: size, height: size, borderRadius: 6, border: '1px solid var(--border)', background: `linear-gradient(135deg, oklch(0.22 0.02 ${fh}), oklch(0.18 0.015 ${fh}))`, display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <svg viewBox="0 0 32 32" width="70%" height="70%">
        {shape === 0 && <>
          <polygon points="16,3 28,12 24,28 8,28 4,12" fill="none" stroke={`oklch(0.70 0.12 ${fh})`} strokeWidth="1.5" />
          <circle cx="16" cy="16" r="4" fill={`oklch(0.70 0.12 ${fh})`} />
        </>}
        {shape === 1 && <>
          <rect x="6" y="6" width="20" height="20" fill="none" stroke={`oklch(0.70 0.12 ${fh})`} strokeWidth="1.5" transform="rotate(45 16 16)" />
          <rect x="13" y="13" width="6" height="6" fill={`oklch(0.70 0.12 ${fh})`} />
        </>}
        {shape === 2 && <>
          <circle cx="16" cy="16" r="11" fill="none" stroke={`oklch(0.70 0.12 ${fh})`} strokeWidth="1.5" />
          <line x1="16" y1="5" x2="16" y2="27" stroke={`oklch(0.70 0.12 ${fh})`} strokeWidth="1.5" />
          <line x1="5" y1="16" x2="27" y2="16" stroke={`oklch(0.70 0.12 ${fh})`} strokeWidth="1.5" />
        </>}
        {shape === 3 && <>
          <path d="M16 4 L28 22 L4 22 Z" fill="none" stroke={`oklch(0.70 0.12 ${fh})`} strokeWidth="1.5" />
          <path d="M16 14 L22 24 L10 24 Z" fill={`oklch(0.70 0.12 ${fh})`} />
        </>}
      </svg>
    </div>
  );
}
