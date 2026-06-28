import { useState } from 'react';

interface AvatarProps {
  characterId?: number | null;
  seed?: string;
  size?: number;
  label?: string;
}

export default function Avatar({ characterId, seed = 'x', size = 56, label }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  // Render the real EVE character portrait when we have an id; fall back to the
  // generated identicon if there's no id or the image fails to load.
  if (characterId && !failed) {
    return (
      <img
        src={`https://images.evetech.net/characters/${characterId}/portrait?size=128`}
        alt={seed}
        onError={() => setFailed(true)}
        className="gavatar"
        style={{ width: size, height: size, objectFit: 'cover', display: 'block' }}
      />
    );
  }

  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rand = (n = 1) => { h = (h * 1664525 + 1013904223) >>> 0; return (h / 4294967295) * n; };
  const hues = [220, 240, 200, 260, 280, 80, 40, 150, 25];
  const hue = hues[Math.floor(rand() * hues.length)];
  const c2 = hues[Math.floor(rand() * hues.length)];

  const cells: { x: number; y: number; on: boolean }[] = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 4; x++) {
      const on = rand() < 0.42;
      cells.push({ x, y, on });
      cells.push({ x: 7 - x, y, on });
    }
  }

  return (
    <div className="gavatar" style={{ width: size, height: size, position: 'relative', background: `linear-gradient(135deg, oklch(0.24 0.03 ${hue}), oklch(0.18 0.02 ${c2}))` }}>
      <svg viewBox="0 0 8 8" width="100%" height="100%" style={{ display: 'block' }}>
        {cells.map((c, i) => c.on && (
          <rect key={i} x={c.x} y={c.y} width="1" height="1" fill={`oklch(0.70 0.13 ${hue})`} opacity={0.85} />
        ))}
        <rect x="0" y="0" width="8" height="8" fill="none" stroke={`oklch(0.55 0.10 ${hue} / 0.35)`} strokeWidth="0.04" />
      </svg>
      {label && <div style={{ position: 'absolute', bottom: 2, right: 4, fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-mute)', letterSpacing: 0.5 }}>{label}</div>}
    </div>
  );
}
