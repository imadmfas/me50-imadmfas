import type { ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import clsx from '../lib/clsx';

type ConflictingHandlers = 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration';

interface NeonButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, ConflictingHandlers> {
  variant?: 'cyan' | 'violet' | 'ghost';
}

const variantClass: Record<NonNullable<NeonButtonProps['variant']>, string> = {
  cyan: 'bg-neon-cyan/10 border-neon-cyan text-neon-cyan shadow-neon-cyan hover:bg-neon-cyan/20',
  violet: 'bg-neon-violet/10 border-neon-violet text-neon-violet shadow-neon-violet hover:bg-neon-violet/20',
  ghost: 'bg-transparent border-glass-stroke text-text-hi hover:bg-white/5',
};

export function NeonButton({ variant = 'cyan', className, children, ...rest }: NeonButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, mass: 0.9 }}
      className={clsx(
        'min-h-[44px] px-6 py-3 rounded-2xl border font-display font-semibold transition-colors',
        variantClass[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
