import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassPanel } from '../components/GlassPanel';
import { NeonButton } from '../components/NeonButton';
import { useT, useNumberFormat } from '../i18n';
import { useMatchStore } from '../store/useMatchStore';
import { audioMixer } from '../audio/AudioMixer';

export function Matchmaking() {
  const [waited, setWaited] = useState(0);
  const navigate = useNavigate();
  const t = useT();
  const numberFmt = useNumberFormat();
  const snapshot = useMatchStore((s) => s.snapshot);
  const queueStatus = useMatchStore((s) => s.queueStatus);
  const botOfferDifficulty = useMatchStore((s) => s.botOfferDifficulty);
  const cancelQueue = useMatchStore((s) => s.cancelQueue);
  const acceptBot = useMatchStore((s) => s.acceptBot);

  useEffect(() => {
    const t = setInterval(() => setWaited((w) => w + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (snapshot) {
      audioMixer.play('matchFound');
      navigate('/match');
    }
  }, [snapshot, navigate]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8">
      <div className="relative h-56 w-56">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-neon-cyan/50"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-6 rounded-full border-2 border-neon-violet/50"
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
        />
        <div className="absolute inset-0 grid place-items-center text-5xl">🔍</div>
      </div>

      <div className="text-center">
        <p className="font-display text-lg font-bold text-text-hi">{t('matchmaking.title')}</p>
        <p className="mt-1 text-sm text-text-lo">
          {t('matchmaking.waiting')}: {numberFmt(waited)}s
        </p>
      </div>

      {queueStatus === 'botOffered' && (
        <GlassPanel glow="violet" className="w-full max-w-sm p-4 text-center">
          <p className="text-sm text-text-hi">{t('matchmaking.botOffer')}</p>
          <div className="mt-3 flex gap-2">
            <NeonButton
              variant="violet"
              className="flex-1"
              onClick={() => botOfferDifficulty && acceptBot(botOfferDifficulty as 'easy' | 'medium' | 'hard')}
            >
              {t('matchmaking.acceptBot')}
            </NeonButton>
            <NeonButton variant="ghost" className="flex-1" onClick={() => setWaited(0)}>
              {t('matchmaking.keepWaiting')}
            </NeonButton>
          </div>
        </GlassPanel>
      )}

      <NeonButton
        variant="ghost"
        onClick={() => {
          cancelQueue();
          navigate('/home');
        }}
      >
        {t('matchmaking.cancel')}
      </NeonButton>
    </div>
  );
}
