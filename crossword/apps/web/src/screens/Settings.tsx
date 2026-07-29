import { useState } from 'react';
import { GlassPanel } from '../components/GlassPanel';
import { NeonButton } from '../components/NeonButton';
import { useT } from '../i18n';
import { useSettingsStore, type ThemeMode, type NumeralStyle } from '../store/useSettingsStore';
import { hasCompletedFirstMatch, getPushStatus, subscribeToPush } from '../lib/push';
import clsx from '../lib/clsx';

function SegmentedControl<T extends string>({
  value, options, onChange,
}: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'flex-1 rounded-xl border py-2 text-sm',
            value === o.value ? 'border-neon-cyan bg-neon-cyan/15 text-neon-cyan' : 'border-glass-stroke text-text-lo',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function VolumeSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm text-text-lo">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range" min={0} max={1} step={0.05} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[--neon-cyan]"
      />
    </div>
  );
}

export function Settings() {
  const t = useT();
  const s = useSettingsStore();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-bold text-text-hi">{t('settings.title')}</h1>

      <GlassPanel className="flex flex-col gap-2 p-4">
        <p className="text-sm font-bold text-text-hi">{t('settings.theme')}</p>
        <SegmentedControl<ThemeMode>
          value={s.theme}
          onChange={s.setTheme}
          options={[
            { value: 'dark', label: t('settings.theme.dark') },
            { value: 'light', label: t('settings.theme.light') },
            { value: 'system', label: t('settings.theme.system') },
          ]}
        />
      </GlassPanel>

      <GlassPanel className="flex flex-col gap-2 p-4">
        <p className="text-sm font-bold text-text-hi">{t('settings.language')}</p>
        <SegmentedControl
          value={s.locale}
          onChange={s.setLocale}
          options={[{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }]}
        />
      </GlassPanel>

      <GlassPanel className="flex flex-col gap-2 p-4">
        <p className="text-sm font-bold text-text-hi">{t('settings.numerals')}</p>
        <SegmentedControl<NumeralStyle>
          value={s.numeralStyle}
          onChange={s.setNumeralStyle}
          options={[
            { value: 'arabic', label: t('settings.numerals.arabic') },
            { value: 'western', label: t('settings.numerals.western') },
          ]}
        />
      </GlassPanel>

      <GlassPanel className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-text-hi">{t('settings.audio')}</p>
          <button onClick={s.toggleMuted} className="text-lg">{s.muted ? '🔇' : '🔊'}</button>
        </div>
        <VolumeSlider label={t('settings.audio.master')} value={s.masterVolume} onChange={s.setMasterVolume} />
        <VolumeSlider label={t('settings.audio.music')} value={s.musicVolume} onChange={s.setMusicVolume} />
        <VolumeSlider label={t('settings.audio.sfx')} value={s.sfxVolume} onChange={s.setSfxVolume} />
      </GlassPanel>

      <GlassPanel className="flex items-center justify-between p-4">
        <p className="text-sm font-bold text-text-hi">{t('settings.motion.reduced')}</p>
        <input
          type="checkbox"
          checked={s.reducedMotion}
          onChange={(e) => s.setReducedMotion(e.target.checked)}
          className="h-5 w-5 accent-[--neon-cyan]"
        />
      </GlassPanel>

      {hasCompletedFirstMatch() && <NotificationsSection />}
    </div>
  );
}

/**
 * Only rendered after the player's first completed match (never on first
 * load, per the product spec) — asking for notification permission before
 * someone has any reason to care about re-engagement pushes is exactly the
 * kind of prompt users reflexively deny.
 */
function NotificationsSection() {
  const [state, setState] = useState<'idle' | 'requesting' | 'subscribed' | 'denied' | 'unavailable'>('idle');

  async function enable() {
    setState('requesting');
    const status = await getPushStatus();
    if (!status.configured || !status.publicKey) {
      setState('unavailable');
      return;
    }
    const result = await subscribeToPush(status.publicKey);
    setState(result === 'subscribed' ? 'subscribed' : result === 'denied' ? 'denied' : 'unavailable');
  }

  return (
    <GlassPanel className="flex flex-col gap-2 p-4">
      <p className="text-sm font-bold text-text-hi">الإشعارات اليومية</p>
      <p className="text-xs text-text-lo">تذكير لطيف عند غيابك — بحد أقصى إشعار واحد يوميًا، ويمكنك إيقافه في أي وقت.</p>
      {state === 'unavailable' && (
        <p className="text-xs text-neon-rose">الإشعارات غير مفعّلة على هذا الخادم (بحاجة إلى مفاتيح VAPID).</p>
      )}
      {state === 'denied' && <p className="text-xs text-neon-rose">تم رفض إذن الإشعارات من إعدادات المتصفح.</p>}
      {state === 'subscribed' && <p className="text-xs text-neon-lime">تم تفعيل الإشعارات.</p>}
      {(state === 'idle' || state === 'requesting') && (
        <NeonButton variant="ghost" onClick={enable} disabled={state === 'requesting'}>
          تفعيل الإشعارات
        </NeonButton>
      )}
    </GlassPanel>
  );
}
