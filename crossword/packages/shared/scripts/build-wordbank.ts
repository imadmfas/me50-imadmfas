/**
 * Builds packages/shared/src/wordbank/wordbank.json from raw.ts.
 * Computes answerNormalized/length from the real normalizer (never
 * hand-typed) and fails loudly on any rule violation instead of shipping
 * a silently-broken entry:
 *   - length outside the assigned difficulty's [minLen, maxLen]
 *   - duplicate answer (normalized) anywhere in the bank
 *   - duplicate clue text anywhere in the bank (clue_ambiguity_check, coarse pass)
 *   - a category exceeding MAX_CATEGORY_SHARE of the total bank
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { RAW_WORDBANK } from '../src/wordbank/raw.js';
import { normalizeArabic, segmentToCells } from '../src/normalizer.js';
import { DIFFICULTY_RULES, CATEGORIES, MAX_CATEGORY_SHARE } from '../src/constants.js';
import type { WordEntry } from '../src/types.js';

const errors: string[] = [];
const warnings: string[] = [];

const seenAnswers = new Map<string, string>(); // normalized answer -> entry id
const seenClues = new Map<string, string>(); // clue text -> entry id
const categoryCounts = new Map<string, number>();

const entries: WordEntry[] = RAW_WORDBANK.map((raw) => {
  const answerNormalized = normalizeArabic(raw.answer);
  const length = segmentToCells(answerNormalized).length;
  const rules = DIFFICULTY_RULES[raw.difficulty];

  if (length < rules.minLen || length > rules.maxLen) {
    errors.push(
      `[${raw.id}] "${raw.answer}" has length ${length}, outside ${raw.difficulty} range [${rules.minLen}-${rules.maxLen}]`,
    );
  }

  if (seenAnswers.has(answerNormalized)) {
    errors.push(`[${raw.id}] duplicate answer "${raw.answer}" also used by [${seenAnswers.get(answerNormalized)}]`);
  } else {
    seenAnswers.set(answerNormalized, raw.id);
  }

  if (seenClues.has(raw.clue)) {
    errors.push(`[${raw.id}] duplicate clue text also used by [${seenClues.get(raw.clue)}] — ambiguous if they ever share a puzzle`);
  } else {
    seenClues.set(raw.clue, raw.id);
  }

  if (!raw.verified) {
    warnings.push(`[${raw.id}] not verified — excluded from shipped bank`);
    return null;
  }

  categoryCounts.set(raw.category, (categoryCounts.get(raw.category) ?? 0) + 1);

  return {
    id: raw.id,
    answer: raw.answer,
    answerNormalized,
    length,
    clue: raw.clue,
    clueEn: raw.clueEn,
    category: raw.category,
    difficulty: raw.difficulty,
    factCard: raw.factCard,
    source: raw.source,
    verified: raw.verified,
    tags: raw.tags,
  } satisfies WordEntry;
}).filter((e): e is WordEntry => e !== null);

const total = entries.length;
for (const cat of CATEGORIES) {
  const count = categoryCounts.get(cat) ?? 0;
  const share = total === 0 ? 0 : count / total;
  if (share > MAX_CATEGORY_SHARE) {
    errors.push(`category "${cat}" is ${(share * 100).toFixed(1)}% of the bank, exceeds ${MAX_CATEGORY_SHARE * 100}% cap`);
  }
}

if (warnings.length) {
  console.warn(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.warn('  ' + w);
}

if (errors.length) {
  console.error(`\n${errors.length} error(s) — wordbank.json NOT written:`);
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}

const outDir = path.dirname(fileURLToPath(import.meta.url)).replace(/scripts$/, 'src/wordbank');
const outPath = path.join(outDir, 'wordbank.json');
writeFileSync(outPath, JSON.stringify(entries, null, 2) + '\n', 'utf-8');

console.log(`\nOK — wrote ${entries.length} verified entries to ${outPath}`);
console.log('By category:');
for (const cat of CATEGORIES) {
  console.log(`  ${cat.padEnd(12)} ${categoryCounts.get(cat) ?? 0}`);
}
console.log('By difficulty:');
for (const diff of ['easy', 'medium', 'hard'] as const) {
  console.log(`  ${diff.padEnd(12)} ${entries.filter((e) => e.difficulty === diff).length}`);
}
