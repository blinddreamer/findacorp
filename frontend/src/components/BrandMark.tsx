interface BrandMarkProps {
  size?: number;
}

export default function BrandMark({ size = 22 }: BrandMarkProps) {
  return (
    <img src="/fc.png" width={size} height={size} style={{ display: 'block', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} alt="FINDACORP" />
  );
}
