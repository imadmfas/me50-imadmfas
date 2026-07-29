import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassPanel } from '../components/GlassPanel';
import { NeonButton } from '../components/NeonButton';
import { useT, useNumberFormat } from '../i18n';
import { useMatchStore } from '../store/useMatchStore';
import { useAuthStore } from '../store/useAuthStore';
import { markFirstMatchCompleted } from '../lib/push';

export function Results() {
  const navigate = useNavigate();
  const t = useT();
  const numberFmt = useNumberFormat();
  const { me, refresh } = useAuthStore();
  const matchEnded = useMatchStore((s) => s.matchEnded);
  const solvedFactCards = useMatchStore((s) => s.solvedFactCards);
  const reset = useMatchStore((s) => s.reset);
  const joinQueue = useMatchStore((s) => s.joinQueue);

  useEffect(() => {
    if (!matchEnded) navigate('/home', { replace: true });
    refresh();
    markFirstMatchCompleted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchEnded]);

  if (!matchEnded || !me) return null;

  const won = matchEnded.winnerUserId === me.id;
  const draw = matchEnded.winnerUserId === 'draw';
  const myPlayer = matchEnded.players.find((p) => p.userId === me.id);
  const opponentPlayer = matchEnded.players.find((p) => p.userId !== me.id);
  const delta = matchEnded.ratingDeltas[me.id];
  const maxScore = Math.max(myPlayer?.score ?? 0, opponentPlayer?.score ?? 0, 1);

  function goHome() {
    reset();
    navigate('/home');
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="text-center">
        <motion.h1
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className={`font-display text-3xl font-extrabold ${won ? 'text-neon-lime' : draw ? 'text-text-hi' : 'text-neon-rose'}`}
        >
          {draw ? t('results.draw') : won ? t('results.win') : t('results.lose')}
        </motion.h1>
      </div>

      <GlassPanel className="p-4">
        {[{ label: t('match.you'), player: myPlayer, color: 'bg-neon-cyan' }, { label: t('match.opponent'), player: opponentPlayer, color: 'bg-neon-violet' }].map(
          (row, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-text-hi">{row.label}</span>
                <span className="font-bold text-text-hi">{numberFmt(row.player?.score ?? 0)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((row.player?.score ?? 0) / maxScore) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full ${row.color}`}
                />
              </div>
            </div>
          ),
        )}
        {delta && (
          <p className="mt-3 text-center text-sm text-text-lo">
            التقييم: {numberFmt(delta.before)} → <span className={delta.after >= delta.before ? 'text-neon-lime' : 'text-neon-rose'}>{numberFmt(delta.after)}</span>
          </p>
        )}
      </GlassPanel>

      {solvedFactCards.length > 0 && (
        <GlassPanel className="p-4">
          <p className="mb-2 font-display font-bold text-text-hi">{t('results.factCards')}</p>
          <ul className="flex flex-col gap-3">
            {solvedFactCards.map((f) => (
              <li key={f.entryId} className="border-s-2 border-neon-lime/60 ps-3 text-sm">
                <p className="text-text-hi">{f.clue}</p>
                <p className="mt-0.5 text-text-lo">{f.factCard}</p>
                <p className="mt-0.5 text-xs text-neon-cyan">{f.source}</p>
              </li>
            ))}
          </ul>
        </GlassPanel>
      )}

      <div className="flex gap-2">
        <NeonButton className="flex-1" onClick={() => { const d = matchEnded.difficulty; reset(); joinQueue(d); navigate('/matchmaking'); }}>
          {t('results.rematch')}
        </NeonButton>
        <NeonButton variant="ghost" className="flex-1" onClick={goHome}>
          {t('results.backHome')}
        </NeonButton>
        <NeonButton
          variant="ghost"
          onClick={() => {
            const text = `${won ? 'فزت' : draw ? 'تعادلت' : 'خسرت'} بنتيجة ${myPlayer?.score ?? 0} مقابل ${opponentPlayer?.score ?? 0} في الكلمات المتقاطعة النيونية!`;
            if (navigator.share) navigator.share({ text }).catch(() => void 0);
            else navigator.clipboard?.writeText(text).catch(() => void 0);
          }}
        >
          {t('results.share')}
        </NeonButton>
      </div>
    </div>
  );
}
