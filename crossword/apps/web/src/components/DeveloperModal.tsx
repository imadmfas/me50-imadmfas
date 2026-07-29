import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GlassPanel } from './GlassPanel';
import { useT } from '../i18n';

const APP_VERSION = '0.1.0-mvp';

export function DeveloperFooterLink() {
  const [open, setOpen] = useState(false);
  const t = useT();
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mx-auto block py-6 text-center text-xs text-text-lo underline decoration-dotted underline-offset-4 hover:text-neon-cyan"
      >
        {t('developer.title')}
      </button>
      <AnimatePresence>{open && <DeveloperModal onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

function DeveloperModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const t = useT();

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText('info@drimad.net');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the email is still visible/selectable */
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={t('developer.title')}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, mass: 0.9 }}
      >
        <GlassPanel glow="cyan" className="relative m-4 w-[min(92vw,26rem)] border-t-2 border-t-neon-cyan p-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-neon-cyan/10 font-display text-2xl font-bold text-neon-cyan shadow-neon-cyan">
            عم
          </div>
          <h2 className="font-display text-lg font-bold text-text-hi">{t('developer.name')}</h2>
          <p className="mt-1 text-sm text-text-lo">{t('developer.nameEn')}</p>

          <div className="mt-4 flex items-center justify-center gap-2">
            <a href="mailto:info@drimad.net" className="text-neon-cyan underline">
              info@drimad.net
            </a>
            <button
              onClick={copyEmail}
              className="rounded-full border border-glass-stroke px-2 py-1 text-xs text-text-lo hover:text-neon-cyan"
              aria-label={t('developer.copy')}
            >
              {copied ? t('developer.copied') : '⧉'}
            </button>
          </div>

          <a href="https://drimad.net" target="_blank" rel="noreferrer" className="mt-2 block text-xs text-text-lo underline">
            drimad.net
          </a>

          <div className="mt-6 border-t border-glass-stroke pt-4 text-[11px] text-text-lo">
            <p>الإصدار {APP_VERSION}</p>
            <p className="mt-1">الخطوط: Cairo · Rubik · IBM Plex Sans Arabic · Noto Naskh Arabic — انظر ASSETS.md</p>
          </div>

          <button
            onClick={onClose}
            className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full text-text-lo hover:bg-white/10"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </GlassPanel>
      </motion.div>
    </motion.div>
  );
}
