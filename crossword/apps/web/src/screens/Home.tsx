import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassPanel } from '../components/GlassPanel';
import { NeonButton } from '../components/NeonButton';
import { Avatar } from '../components/Avatar';
import { useT, useNumberFormat } from '../i18n';
import { useAuthStore } from '../store/useAuthStore';
import { useMatchStore } from '../store/useMatchStore';
import { api } from '../lib/api';
import clsx from '../lib/clsx';

type Difficulty = 'easy' | 'medium' | 'hard';

export function Home() {
  const { me } = useAuthStore();
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [preview, setPreview] = useState<{ username: string; rating: number }[]>([]);
  const t = useT();
  const numberFmt = useNumberFormat();
  const navigate = useNavigate();
  const joinQueue = useMatchStore((s) => s.joinQueue);
  const joinDaily = useMatchStore((s) => s.joinDaily);

  useEffect(() => {
    api.leaderboard(difficulty).then((r) => setPreview(r.entries.slice(0, 5).map((e) => ({ username: e.username, rating: e.rating })))).catch(() => void 0);
  }, [difficulty]);

  if (!me) return null;

  function handlePlay() {
    joinQueue(difficulty);
    navigate('/matchmaking');
  }

  function handleDaily() {
    joinDaily();
    navigate('/match');
  }

  return (
    <div className="flex flex-col gap-4">
      <GlassPanel className="flex items-center gap-4 p-4">
        <Avatar seed={me.avatarSeed} size={56} />
        <div className="flex-1">
          <p className="font-display font-bold text-text-hi">{me.username}</p>
          <p className="text-xs text-text-lo">
            {t('home.streak')}: {numberFmt(me.streakDays)} 🔥
          </p>
        </div>
        <div className="text-left">
          <p className="text-lg font-bold text-neon-cyan">{numberFmt(me.ratings[difficulty] ?? 1200)}</p>
        </div>
      </GlassPanel>

      <GlassPanel glow="violet" className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display font-bold text-text-hi">{t('home.dailyChallenge')}</p>
            <p className="text-xs text-text-lo">لغز موحّد لكل اللاعبين حول العالم اليوم</p>
          </div>
          <NeonButton variant="violet" onClick={handleDaily}>▶</NeonButton>
        </div>
      </GlassPanel>

      <GlassPanel className="p-4">
        <p className="mb-2 font-display text-sm font-bold text-text-hi">{t('home.difficulty')}</p>
        <div className="flex gap-2">
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={clsx(
                'flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors',
                difficulty === d ? 'border-neon-cyan bg-neon-cyan/15 text-neon-cyan shadow-neon-cyan' : 'border-glass-stroke text-text-lo',
              )}
            >
              {t(`home.difficulty.${d}` as never)}
            </button>
          ))}
        </div>
        <NeonButton className="mt-4 w-full" onClick={handlePlay}>{t('home.play')}</NeonButton>
      </GlassPanel>

      <GlassPanel className="p-4">
        <p className="mb-2 font-display text-sm font-bold text-text-hi">{t('home.leaderboardPreview')}</p>
        <ol className="flex flex-col gap-1.5">
          {preview.map((p, i) => (
            <li key={p.username} className="flex items-center justify-between text-sm">
              <span className="text-text-hi">{numberFmt(i + 1)}. {p.username}</span>
              <span className="text-neon-cyan">{numberFmt(p.rating)}</span>
            </li>
          ))}
          {preview.length === 0 && <p className="text-xs text-text-lo">لا يوجد لاعبون بعد</p>}
        </ol>
      </GlassPanel>
    </div>
  );
}
