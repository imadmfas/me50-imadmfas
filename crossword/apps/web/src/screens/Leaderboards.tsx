import { useEffect, useState } from 'react';
import { GlassPanel } from '../components/GlassPanel';
import { useT, useNumberFormat } from '../i18n';
import { api } from '../lib/api';
import clsx from '../lib/clsx';

type Difficulty = 'easy' | 'medium' | 'hard';

export function Leaderboards() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [entries, setEntries] = useState<{ rank: number; username: string; rating: number }[]>([]);
  const t = useT();
  const numberFmt = useNumberFormat();

  useEffect(() => {
    api.leaderboard(difficulty).then((r) => setEntries(r.entries)).catch(() => setEntries([]));
  }, [difficulty]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-bold text-text-hi">{t('leaderboard.title')}</h1>
      <div className="flex gap-2">
        {(['easy', 'medium', 'hard'] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={clsx(
              'flex-1 rounded-xl border py-2 text-sm font-semibold',
              difficulty === d ? 'border-neon-cyan bg-neon-cyan/15 text-neon-cyan' : 'border-glass-stroke text-text-lo',
            )}
          >
            {t(`home.difficulty.${d}` as never)}
          </button>
        ))}
      </div>
      <GlassPanel className="p-2">
        <ol>
          {entries.map((e) => (
            <li key={e.rank} className="flex items-center justify-between border-b border-white/5 px-3 py-2.5 last:border-0">
              <span className="w-8 text-text-lo">{numberFmt(e.rank)}</span>
              <span className="flex-1 text-text-hi">{e.username}</span>
              <span className="font-bold text-neon-cyan">{numberFmt(e.rating)}</span>
            </li>
          ))}
          {entries.length === 0 && <p className="p-4 text-center text-sm text-text-lo">لا توجد بيانات بعد</p>}
        </ol>
      </GlassPanel>
    </div>
  );
}
