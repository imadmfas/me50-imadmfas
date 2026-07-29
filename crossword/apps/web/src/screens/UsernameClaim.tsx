import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassPanel } from '../components/GlassPanel';
import { NeonButton } from '../components/NeonButton';
import { useT } from '../i18n';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

type CheckStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export function UsernameClaim() {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const t = useT();
  const navigate = useNavigate();
  const setMe = useAuthStore((s) => s.setMe);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!value) {
      setStatus('idle');
      return;
    }
    setStatus('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.checkUsername(value);
        setStatus(res.status as CheckStatus);
        setSuggestions(res.suggestions ?? []);
      } catch {
        setStatus('idle');
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  async function claim(name = value) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.claimUsername(name);
      setMe({ id: res.id, username: res.username, avatarSeed: res.username, countryCode: null, bio: null, xp: 0, level: 1, streakDays: 0, ratings: {} });
      navigate('/home', { replace: true });
    } catch (err: unknown) {
      const e = err as { body?: { error?: string; suggestions?: string[] } };
      if (e.body?.error === 'username_taken') {
        setStatus('taken');
        setSuggestions(e.body.suggestions ?? []);
      } else {
        setError('حدث خطأ، حاول مرة أخرى');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const indicatorColor = status === 'available' ? 'bg-neon-lime' : status === 'taken' || status === 'invalid' ? 'bg-neon-rose' : 'bg-white/20';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <GlassPanel className="w-full max-w-sm p-6" glow="cyan">
        <h1 className="font-display text-xl font-bold text-text-hi">{t('username.title')}</h1>
        <p className="mt-1 text-xs text-text-lo">{t('username.rules')}</p>

        <div className="relative mt-4">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('username.placeholder')}
            maxLength={20}
            dir="auto"
            className="w-full rounded-xl border border-glass-stroke bg-white/5 px-4 py-3 text-lg text-text-hi outline-none focus:border-neon-cyan"
            aria-describedby="username-status"
          />
          <motion.span
            animate={{ scale: status === 'checking' ? [1, 1.3, 1] : 1 }}
            transition={{ repeat: status === 'checking' ? Infinity : 0, duration: 0.8 }}
            className={`absolute top-1/2 -translate-y-1/2 left-4 h-2.5 w-2.5 rounded-full shadow-neon-cyan ${indicatorColor}`}
          />
        </div>

        <p id="username-status" className="mt-2 min-h-[1.25rem] text-sm">
          {status === 'available' && <span className="text-neon-lime">{t('username.available')}</span>}
          {status === 'taken' && <span className="text-neon-rose">{t('username.taken')}</span>}
          {status === 'checking' && <span className="text-text-lo">{t('username.checking')}</span>}
        </p>

        {status === 'taken' && suggestions.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-text-lo">{t('username.suggestions')}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setValue(s)}
                  className="rounded-full border border-glass-stroke px-3 py-1 text-xs text-neon-cyan hover:bg-neon-cyan/10"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="mt-2 text-sm text-neon-rose">{error}</p>}

        <NeonButton
          className="mt-6 w-full"
          disabled={status !== 'available' || submitting}
          onClick={() => claim()}
        >
          {t('username.claim')}
        </NeonButton>
      </GlassPanel>
    </div>
  );
}
