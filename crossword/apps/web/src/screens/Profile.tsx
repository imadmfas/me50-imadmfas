import { GlassPanel } from '../components/GlassPanel';
import { Avatar } from '../components/Avatar';
import { useT, useNumberFormat } from '../i18n';
import { useAuthStore } from '../store/useAuthStore';

export function Profile() {
  const { me, logout } = useAuthStore();
  const t = useT();
  const numberFmt = useNumberFormat();

  if (!me) return null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-bold text-text-hi">{t('profile.title')}</h1>
      <GlassPanel className="flex items-center gap-4 p-4">
        <Avatar seed={me.avatarSeed} size={64} />
        <div>
          <p className="font-display text-lg font-bold text-text-hi">{me.username}</p>
          <p className="text-xs text-text-lo">المستوى {numberFmt(me.level)}</p>
        </div>
      </GlassPanel>

      <GlassPanel className="p-4">
        <p className="mb-3 font-display font-bold text-text-hi">{t('profile.stats')}</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <div key={d}>
              <p className="text-xs text-text-lo">{t(`home.difficulty.${d}` as never)}</p>
              <p className="text-lg font-bold text-neon-cyan">{numberFmt(me.ratings[d] ?? 1200)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between text-sm text-text-lo">
          <span>{t('home.streak')}</span>
          <span className="text-text-hi">{numberFmt(me.streakDays)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm text-text-lo">
          <span>XP</span>
          <span className="text-text-hi">{numberFmt(me.xp)}</span>
        </div>
      </GlassPanel>

      <button onClick={() => logout()} className="text-sm text-neon-rose underline">
        تسجيل الخروج
      </button>
    </div>
  );
}
