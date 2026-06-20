interface BrandMarkProps {
  size?: number;
}

export default function BrandMark({ size = 22 }: BrandMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
      <path d="M3 6 L12 2 L21 6 L21 18 L12 22 L3 18 Z" fill="none" stroke="var(--accent)" strokeWidth="1.2" />
      <path d="M3 6 L12 10 L21 6" fill="none" stroke="var(--accent)" strokeWidth="1.2" opacity="0.7" />
      <path d="M12 10 L12 22" stroke="var(--accent)" strokeWidth="1.2" opacity="0.7" />
      <circle cx="12" cy="12" r="2" fill="var(--accent)" />
    </svg>
  );
}
