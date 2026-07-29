import type { HTMLAttributes, ReactNode } from 'react';
import clsx from '../lib/clsx';

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glow?: 'cyan' | 'violet' | 'lime' | 'rose' | 'none';
}

const glowClass: Record<NonNullable<GlassPanelProps['glow']>, string> = {
  cyan: 'shadow-neon-cyan',
  violet: 'shadow-neon-violet',
  lime: 'shadow-neon-lime',
  rose: 'shadow-neon-rose',
  none: '',
};

export function GlassPanel({ children, glow = 'none', className, ...rest }: GlassPanelProps) {
  return (
    <div className={clsx('glass-panel', glowClass[glow], className)} {...rest}>
      {children}
    </div>
  );
}
