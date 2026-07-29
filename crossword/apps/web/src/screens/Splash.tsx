import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassPanel } from '../components/GlassPanel';
import { NeonButton } from '../components/NeonButton';
import { ThemeToggle } from '../components/ThemeToggle';
import { useT } from '../i18n';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';

const CARDS = ['onboarding.value1', 'onboarding.value2', 'onboarding.value3'] as const;

export function Splash() {
  const [step, setStep] = useState(0);
  const t = useT();
  const navigate = useNavigate();
  const { status } = useAuthStore();
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);

  useEffect(() => {
    if (status === 'authenticated') navigate('/home', { replace: true });
  }, [status, navigate]);

  const isLast = step === CARDS.length - 1;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-10">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <div className="absolute left-4 top-4 flex gap-1 rounded-full glass-panel p-1 text-xs">
        <button
          onClick={() => setLocale('ar')}
          className={`rounded-full px-3 py-1 ${locale === 'ar' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-text-lo'}`}
        >
          عربي
        </button>
        <button
          onClick={() => setLocale('en')}
          className={`rounded-full px-3 py-1 ${locale === 'en' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-text-lo'}`}
        >
          EN
        </button>
      </div>

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="grid h-20 w-20 place-items-center rounded-3xl bg-neon-cyan/10 text-4xl shadow-neon-cyan"
      >
        🧩
      </motion.div>

      <div className="text-center">
        <h1 className="font-display text-2xl font-extrabold text-text-hi">{t('app.name')}</h1>
        <p className="mt-1 text-sm text-text-lo">{t('app.tagline')}</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26, mass: 0.9 }}
          className="w-full max-w-sm"
        >
          <GlassPanel className="p-6 text-center" glow="cyan">
            <h2 className="font-display text-lg font-bold text-text-hi">{t(`${CARDS[step]}.title` as never)}</h2>
            <p className="mt-2 text-sm text-text-lo">{t(`${CARDS[step]}.body` as never)}</p>
          </GlassPanel>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-1.5">
        {CARDS.map((_, i) => (
          <span key={i} className={`h-1.5 w-6 rounded-full ${i === step ? 'bg-neon-cyan' : 'bg-white/15'}`} />
        ))}
      </div>

      <NeonButton
        onClick={() => (isLast ? navigate('/username') : setStep((s) => s + 1))}
        className="w-full max-w-sm"
      >
        {isLast ? t('onboarding.start') : t('onboarding.continue')}
      </NeonButton>
    </div>
  );
}
