import { describe, it, expect } from 'vitest';
import {
  normalizeArabic,
  arabicEquals,
  segmentToCells,
  stripDiacritics,
  toArabicIndicDigits,
  usernameKey,
  validateUsernameFormat,
} from './normalizer.js';

describe('normalizeArabic', () => {
  it('collapses all alif variants to bare alif', () => {
    expect(normalizeArabic('أحمد')).toBe(normalizeArabic('احمد'));
    expect(normalizeArabic('إنسان')).toBe(normalizeArabic('انسان'));
    expect(normalizeArabic('آلة')).toBe('اله');
    expect(normalizeArabic('ٱسم')).toBe(normalizeArabic('اسم'));
  });

  it('strips diacritics (harakat, shadda, sukun, tanwin, dagger alif)', () => {
    expect(normalizeArabic('ذَرَّة')).toBe(normalizeArabic('ذره'));
    expect(normalizeArabic('كَتَبَ')).toBe('كتب');
    expect(normalizeArabic('مُحَمَّدٌ')).toBe('محمد');
  });

  it('strips tatweel', () => {
    expect(normalizeArabic('كـــتاب')).toBe('كتاب');
  });

  it('unifies ى to ي by default', () => {
    expect(normalizeArabic('مستشفى')).toBe('مستشفي');
  });

  it('can preserve ى when disabled', () => {
    expect(normalizeArabic('مستشفى', { unifyYaMaqsura: false })).toBe('مستشفى');
  });

  it('unifies ة to ه by default (accepts either spelling)', () => {
    expect(normalizeArabic('جامعة')).toBe('جامعه');
    expect(arabicEquals('جامعة', 'جامعه')).toBe(true);
  });

  it('preserves seated hamza (ؤ ئ) as distinct letters by default', () => {
    expect(normalizeArabic('سؤال')).toContain('ؤ');
    expect(normalizeArabic('بئر')).toContain('ئ');
  });

  it('tolerant mode folds seated hamza to و / ي', () => {
    expect(normalizeArabic('سؤال', { preserveSeatedHamza: false })).toBe('سوال');
    expect(normalizeArabic('بئر', { preserveSeatedHamza: false })).toBe('بير');
  });
});

describe('arabicEquals', () => {
  it('treats diacritized and bare forms as equal', () => {
    expect(arabicEquals('الْجَاذِبِيَّة', 'الجاذبيه')).toBe(true);
  });

  it('rejects genuinely different words', () => {
    expect(arabicEquals('ذرة', 'كرة')).toBe(false);
  });
});

describe('segmentToCells', () => {
  it('splits لا into two separate cells (ل and ا), never one ligature cell', () => {
    const cells = segmentToCells(normalizeArabic('لاسلكي'));
    expect(cells[0]).toBe('ل');
    expect(cells[1]).toBe('ا');
    expect(cells.length).toBe(6);
  });
});

describe('stripDiacritics', () => {
  it('removes marks but keeps letter-variant distinctions intact', () => {
    expect(stripDiacritics('أَحْمَد')).toBe('أحمد');
  });
});

describe('toArabicIndicDigits', () => {
  it('converts western digits to arabic-indic', () => {
    expect(toArabicIndicDigits(1234567890)).toBe('١٢٣٤٥٦٧٨٩٠');
  });
});

describe('usernameKey', () => {
  it('normalizes case, diacritics, and whitespace for uniqueness comparison', () => {
    expect(usernameKey('Ahmad_99')).toBe('ahmad_99');
    expect(usernameKey('أَحمد')).toBe(usernameKey('احمد'));
  });
});

describe('validateUsernameFormat', () => {
  it('accepts a valid mixed arabic/latin username', () => {
    expect(validateUsernameFormat('عماد_2026')).toEqual({ ok: true });
  });

  it('rejects too short or too long', () => {
    expect(validateUsernameFormat('ab')).toEqual({ ok: false, reason: 'length' });
    expect(validateUsernameFormat('a'.repeat(21))).toEqual({ ok: false, reason: 'length' });
  });

  it('rejects leading/trailing underscore', () => {
    expect(validateUsernameFormat('_ahmad')).toEqual({ ok: false, reason: 'leading_trailing_underscore' });
  });

  it('rejects reserved words regardless of normalization', () => {
    expect(validateUsernameFormat('مشرف')).toEqual({ ok: false, reason: 'reserved' });
    expect(validateUsernameFormat('Admin')).toEqual({ ok: false, reason: 'reserved' });
  });
});
