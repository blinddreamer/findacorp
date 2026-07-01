interface BrandMarkProps {
  size?: number;
}

export default function BrandMark({ size = 22 }: BrandMarkProps) {
  return (
    <img src="/logo.png" width={size} height={size} style={{ display: 'block', objectFit: 'contain' }} alt="FINDACORP" />
  );
}
