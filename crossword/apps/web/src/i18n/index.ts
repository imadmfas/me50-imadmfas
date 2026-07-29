import ar from './ar.json';
import en from './en.json';
import { useSettingsStore } from '../store/useSettingsStore';
import { toArabicIndicDigits } from '@anc/shared';

const dictionaries = { ar, en } as const;
export type TranslationKey = keyof typeof ar;

export function translate(locale: 'ar' | 'en', key: TranslationKey): string {
  return dictionaries[locale][key] ?? dictionaries.ar[key] ?? key;
}

/** Hook: t('some.key') resolved against the current locale in settings. */
export function useT() {
  const locale = useSettingsStore((s) => s.locale);
  return (key: TranslationKey) => translate(locale, key);
}

/** Format a number/digit-string per the user's numeral style preference. */
export function useNumberFormat() {
  const numeralStyle = useSettingsStore((s) => s.numeralStyle);
  return (n: number | string) => (numeralStyle === 'arabic' ? toArabicIndicDigits(n) : String(n));
}
