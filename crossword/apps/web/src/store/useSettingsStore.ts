import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light' | 'system';
export type Locale = 'ar' | 'en';
export type NumeralStyle = 'arabic' | 'western';

interface SettingsState {
  theme: ThemeMode;
  locale: Locale;
  numeralStyle: NumeralStyle;
  reducedMotion: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  setTheme: (t: ThemeMode) => void;
  setLocale: (l: Locale) => void;
  setNumeralStyle: (n: NumeralStyle) => void;
  setReducedMotion: (v: boolean) => void;
  setMasterVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  toggleMuted: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      locale: 'ar',
      numeralStyle: 'arabic',
      reducedMotion: typeof window !== 'undefined' ? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false : false,
      masterVolume: 0.8,
      musicVolume: 0.6,
      sfxVolume: 0.9,
      muted: false,
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
      setNumeralStyle: (numeralStyle) => set({ numeralStyle }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setMasterVolume: (masterVolume) => set({ masterVolume }),
      setMusicVolume: (musicVolume) => set({ musicVolume }),
      setSfxVolume: (sfxVolume) => set({ sfxVolume }),
      toggleMuted: () => set((s) => ({ muted: !s.muted })),
    }),
    { name: 'anc-settings' },
  ),
);

/** Applies the resolved theme to <html data-theme> and lang/dir to <html>. Call once at app root. */
export function resolveEffectiveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'system') {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}
