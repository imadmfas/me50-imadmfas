import { useState } from 'react';
import { GlassPanel } from '../components/GlassPanel';
import { useT } from '../i18n';
import { getLearnHistory, markReviewed, type LearnEntry } from '../lib/learnHistory';

export function Learn() {
  const [history, setHistory] = useState<LearnEntry[]>(() => getLearnHistory());
  const t = useT();
  const now = Date.now();
  const due = history.filter((h) => h.nextReviewAt <= now);

  function review(entryId: string) {
    markReviewed(entryId);
    setHistory(getLearnHistory());
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-bold text-text-hi">{t('learn.title')}</h1>
      {due.length > 0 && (
        <p className="text-sm text-neon-lime">{due.length} كلمة جاهزة للمراجعة اليوم</p>
      )}
      {history.length === 0 && <GlassPanel className="p-6 text-center text-sm text-text-lo">{t('learn.empty')}</GlassPanel>}
      <div className="flex flex-col gap-3">
        {history.map((h) => {
          const isDue = h.nextReviewAt <= now;
          return (
            <GlassPanel key={h.entryId} glow={isDue ? 'lime' : 'none'} className="p-4">
              <p className="font-bold text-text-hi">{h.clue}</p>
              <p className="mt-1 text-sm text-text-lo">{h.factCard}</p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-neon-cyan">{h.source}</span>
                {isDue && (
                  <button onClick={() => review(h.entryId)} className="rounded-full border border-neon-lime px-3 py-1 text-neon-lime">
                    راجعتها ✓
                  </button>
                )}
              </div>
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}
