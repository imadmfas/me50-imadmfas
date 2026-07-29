/**
 * Arabic-aware normalization layer.
 *
 * Crossword answers and player input must be compared on letter *identity*,
 * not on the many visually/phonetically equivalent spellings Arabic text
 * allows. This module is the single source of truth for that comparison —
 * both the puzzle generator (server) and the input validator (server) and
 * any client-side preview must call the same function so they never diverge.
 */

// U+064B–U+0652 (harakat + shadda/sukun), U+0670 (dagger alif),
// U+06D6–U+06ED (Quranic annotation marks sometimes present in pasted text)
const DIACRITICS_RE = /[ً-ْٰۖ-ۭ]/g;
const TATWEEL_RE = /ـ/g;
const ZERO_WIDTH_RE = /[​-‏﻿]/g;

// All alif variants (hamza-above, hamza-below, madda, wasla) collapse to bare alif.
const ALIF_VARIANTS_RE = /[أإآٱ]/g; // أ إ آ ٱ

export interface NormalizeOptions {
  /** ى → ي. Default true (most crossword word banks treat these as equivalent). */
  unifyYaMaqsura?: boolean;
  /** ة → ه. Default true — accept both spellings for a taa marbuta answer. */
  unifyTaaMarbuta?: boolean;
  /**
   * Preserve hamza on waw/ya (ؤ ئ) as distinct letters. Default true (strict).
   * Set false for a "tolerant" mode that also folds these to و / ي.
   */
  preserveSeatedHamza?: boolean;
}

const DEFAULT_OPTIONS: Required<NormalizeOptions> = {
  unifyYaMaqsura: true,
  unifyTaaMarbuta: true,
  preserveSeatedHamza: true,
};

/**
 * Normalize a full Arabic word/phrase for equality comparison.
 * Does NOT change the *display* string — only used for validation.
 */
export function normalizeArabic(input: string, options: NormalizeOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let s = input;

  s = s.replace(ZERO_WIDTH_RE, '');
  s = s.replace(DIACRITICS_RE, '');
  s = s.replace(TATWEEL_RE, '');
  s = s.replace(ALIF_VARIANTS_RE, 'ا'); // → ا

  if (opts.unifyYaMaqsura) {
    s = s.replace(/ى/g, 'ي'); // ى → ي
  }
  if (opts.unifyTaaMarbuta) {
    s = s.replace(/ة/g, 'ه'); // ة → ه
  }
  if (!opts.preserveSeatedHamza) {
    s = s.replace(/ؤ/g, 'و'); // ؤ → و
    s = s.replace(/ئ/g, 'ي'); // ئ → ي
  }

  // Collapse whitespace, trim.
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

/** Case-insensitive-equivalent comparison for Arabic answers. */
export function arabicEquals(a: string, b: string, options?: NormalizeOptions): boolean {
  return normalizeArabic(a, options) === normalizeArabic(b, options);
}

/**
 * Segment a normalized Arabic word into crossword *cells*.
 * The only compound rule required by the spec: "لا" (lam-alif) is always
 * two cells, never a single ligature cell — this is already true once the
 * string is stored as separate ل and ا codepoints (no U+FEFB/FEFC ligature
 * codepoints are ever produced by normalizeArabic), so segmentation is a
 * straight per-codepoint split. Kept as an explicit function so callers
 * never inline `Array.from(word)` and quietly break if we introduce
 * multi-codepoint clusters later (e.g. lam + alif-with-hamza combos).
 */
export function segmentToCells(word: string): string[] {
  return Array.from(word);
}

/** Strip diacritics/tatweel only — used for *display* cleanup, keeps letter variants intact. */
export function stripDiacritics(input: string): string {
  return input.replace(ZERO_WIDTH_RE, '').replace(DIACRITICS_RE, '').replace(TATWEEL_RE, '');
}

const WESTERN_TO_ARABIC_INDIC: Record<string, string> = {
  '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
  '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩',
};

/** Render Western digits as Arabic-Indic numerals for the Arabic locale. */
export function toArabicIndicDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => WESTERN_TO_ARABIC_INDIC[d] ?? d);
}

// Reserved usernames blocked regardless of case/normalization.
export const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'root', 'support', 'moderator', 'mod', 'system',
  'مشرف', 'ادمن', 'ادارة', 'الادارة', 'دعم', 'مسؤول', 'نظام',
]);

/**
 * Normalize a username into its uniqueness key: lowercased, Arabic-normalized,
 * tatweel/diacritics/zero-width stripped, whitespace removed. This is what
 * gets stored in `username_key` and compared for uniqueness + reserved-word
 * checks, so visually-identical impostor names collide with the original.
 */
export function usernameKey(raw: string): string {
  let s = raw.trim().toLowerCase();
  s = stripDiacritics(s);
  s = normalizeArabic(s);
  s = s.replace(/\s+/g, '');
  return s;
}

const USERNAME_FORMAT_RE = /^[A-Za-z0-9ء-ي_]{3,20}$/;

export type UsernameValidation =
  | { ok: true }
  | { ok: false; reason: 'length' | 'chars' | 'leading_trailing_underscore' | 'reserved' };

export function validateUsernameFormat(raw: string): UsernameValidation {
  if (raw.length < 3 || raw.length > 20) return { ok: false, reason: 'length' };
  if (raw.startsWith('_') || raw.endsWith('_')) {
    return { ok: false, reason: 'leading_trailing_underscore' };
  }
  if (!USERNAME_FORMAT_RE.test(raw)) return { ok: false, reason: 'chars' };
  if (RESERVED_USERNAMES.has(usernameKey(raw))) return { ok: false, reason: 'reserved' };
  return { ok: true };
}
