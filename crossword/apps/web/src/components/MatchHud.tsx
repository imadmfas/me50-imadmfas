import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { MatchSnapshot } from '@anc/shared';
import { Avatar } from './Avatar';
import { useNumberFormat } from '../i18n';

interface MatchHudProps {
  snapshot: MatchSnapshot;
  myUserId: string;
  clockOffsetMs: number;
}

export function MatchHud({ snapshot, myUserId, clockOffsetMs }: MatchHudProps) {
  const [now, setNow] = useState(Date.now() + clockOffsetMs);
  const numberFmt = useNumberFormat();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + clockOffsetMs), 250);
    return () => clearInterval(t);
  }, [clockOffsetMs]);

  const me = snapshot.players.find((p) => p.userId === myUserId);
  const opponent = snapshot.players.find((p) => p.userId !== myUserId);
  const totalWords = snapshot.clues.length;
  const remainingMs = Math.max(0, (snapshot.endsAtMs ?? now) - now);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const totalSec = snapshot.timeLimitSeconds;
  const pct = Math.max(0, Math.min(1, remainingMs / (totalSec * 1000)));
  const isCritical = remainingSec <= 10;

  const circumference = 2 * Math.PI * 26;

  return (
    <div className="glass-panel flex items-center justify-between gap-3 p-3">
      <div className="flex items-center gap-2">
        <Avatar seed={me?.userId ?? 'me'} size={36} />
        <div>
          <p className="text-xs text-text-lo">أنت</p>
          <motion.p key={me?.score} initial={{ y: -4, opacity: 0.5 }} animate={{ y: 0, opacity: 1 }} className="font-bold text-neon-cyan">
            {numberFmt(me?.score ?? 0)}
          </motion.p>
        </div>
      </div>

      <div className="relative h-16 w-16 shrink-0">
        <svg viewBox="0 0 60 60" className="h-16 w-16 -rotate-90">
          <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
          <circle
            cx="30" cy="30" r="26" fill="none"
            stroke={isCritical ? 'var(--neon-rose)' : 'var(--neon-cyan)'}
            strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct)}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-xs font-bold text-text-hi">
          {numberFmt(Math.floor(remainingSec / 60))}:{numberFmt(String(remainingSec % 60).padStart(2, '0'))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-left">
          <p className="text-xs text-text-lo">الخصم</p>
          <motion.p key={opponent?.score} initial={{ y: -4, opacity: 0.5 }} animate={{ y: 0, opacity: 1 }} className="font-bold text-neon-violet">
            {numberFmt(opponent?.score ?? 0)}
          </motion.p>
          <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-neon-violet"
              style={{ width: `${totalWords ? ((opponent?.wordsCompleted ?? 0) / totalWords) * 100 : 0}%` }}
            />
          </div>
        </div>
        <Avatar seed={opponent?.userId ?? 'opponent'} size={36} />
      </div>
    </div>
  );
}
