import { type ReactNode, type MouseEvent } from 'react';

interface BtnProps {
  children: ReactNode;
  primary?: boolean;
  ghost?: boolean;
  lg?: boolean;
  sm?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  [key: string]: unknown;
}

export default function Btn({ children, primary, ghost, lg, sm, onClick, ...rest }: BtnProps) {
  return (
    <button
      className={['btn', primary ? 'primary' : '', ghost ? 'ghost' : '', lg ? 'lg' : '', sm ? 'sm' : ''].filter(Boolean).join(' ')}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
