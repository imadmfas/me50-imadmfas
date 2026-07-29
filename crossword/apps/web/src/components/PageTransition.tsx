import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../store/useSettingsStore';

export function PageTransition({ children }: { children: ReactNode }) {
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  if (reducedMotion) return <div>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
