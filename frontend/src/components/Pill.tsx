import { type ReactNode } from 'react';

interface PillProps {
  children: ReactNode;
  kind?: string;
  [key: string]: unknown;
}

export default function Pill({ children, kind, ...rest }: PillProps) {
  return <span className={`pill ${kind ?? ''}`} {...rest}>{children}</span>;
}
