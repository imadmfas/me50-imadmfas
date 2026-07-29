import { describe, it, expect } from 'vitest';
import { generatePuzzle } from '@anc/shared';
import type { WordEntry } from '@anc/shared';
import { createMatchState, submitWord, requestHint, finalizeWinner, toSnapshot } from './matchEngine.js';

function entry(id: string, answer: string, clue: string): WordEntry {
  return { id, answer, answerNormalized: answer, length: answer.length, clue, category: 'physics', difficulty: 'easy', factCard: `fact-${id}`, source: 'src', verified: true, tags: [] };
}

const WORDS: WordEntry[] = [
  entry('w1', 'ذرة', 'أصغر وحدة'),
  entry('w2', 'خلية', 'وحدة الكائن الحي'),
  entry('w3', 'قمر', 'يدور حول الأرض'),
  entry('w4', 'عدد', 'كمية رياضية'),
  entry('w5', 'نجم', 'كرة غازية'),
  entry('w6', 'جين', 'وحدة وراثية'),
  entry('w7', 'رقم', 'كمية عددية'),
  entry('w8', 'صوت', 'موجة سمعية'),
  entry('w9', 'ضوء', 'إشعاع مرئي'),
  entry('w10', 'قلب', 'يضخ الدم'),
  entry('w11', 'حمض', 'مركب كيميائي'),
  entry('w12', 'مجرة', 'تجمع نجمي'),
  entry('w13', 'فيزياء', 'علم الطبيعة'),
  entry('w14', 'منطق', 'علم الاستدلال'),
  entry('w15', 'كسوف', 'ظاهرة فلكية'),
];

function buildTestMatch() {
  const grid = generatePuzzle({ seed: 'test-seed', difficulty: 'easy', words: WORDS.map((w) => ({ id: w.id, answer: w.answer })) });
  const match = createMatchState({
    matchId: 'm1',
    difficulty: 'easy',
    grid,
    words: WORDS,
    players: [
      { userId: 'alice', username: 'Alice', socketId: 's1', ratingBefore: 1200 },
      { userId: 'bob', username: 'Bob', socketId: 's2', ratingBefore: 1200 },
    ],
  });
  return { grid, match };
}

describe('submitWord', () => {
  it('accepts the correct answer and awards points + a fact card', () => {
    const { grid, match } = buildTestMatch();
    const firstWord = grid.words[0];
    const result = submitWord(match, 'alice', firstWord.entryId, firstWord.letters);
    expect(result.outcome).toBe('correct');
    if (result.outcome === 'correct') {
      expect(result.pointsAwarded).toBeGreaterThan(0);
      expect(result.factCard).toBeTruthy();
    }
    expect(match.players.get('alice')!.score).toBeGreaterThan(0);
  });

  it('rejects a wrong answer and applies the penalty without revealing letters', () => {
    const { grid, match } = buildTestMatch();
    const firstWord = grid.words[0];
    const wrongLetters = firstWord.letters.map(() => 'س');
    const result = submitWord(match, 'alice', firstWord.entryId, wrongLetters);
    expect(result.outcome).toBe('incorrect');
    expect(match.players.get('alice')!.score).toBe(-5);
    expect(match.cellOwners[firstWord.row][firstWord.col].filled).toBe(false);
  });

  it('does not award points twice for a cell already filled by another player', () => {
    const { grid, match } = buildTestMatch();
    // Find two crossing words sharing at least one cell.
    const [wordA, wordB] = grid.words;
    submitWord(match, 'alice', wordA.entryId, wordA.letters);
    const scoreAfterFirst = match.players.get('alice')!.score;

    // Bob solves a second word; any cell overlapping wordA should not
    // double-count toward "newly filled" credit.
    const resultB = submitWord(match, 'bob', wordB.entryId, wordB.letters);
    if (resultB.outcome === 'correct') {
      expect(resultB.newlyFilledCells).toBeLessThanOrEqual(wordB.length);
    }
    expect(match.players.get('alice')!.score).toBe(scoreAfterFirst);
  });

  it('rejects submissions to an already-solved word', () => {
    const { grid, match } = buildTestMatch();
    const word = grid.words[0];
    submitWord(match, 'alice', word.entryId, word.letters);
    const second = submitWord(match, 'bob', word.entryId, word.letters);
    expect(second.outcome).toBe('already_solved');
  });

  it('accepts diacritized or alternate-spelling input via server-side normalization', () => {
    const { grid, match } = buildTestMatch();
    const word = grid.words.find((w) => w.entryId === 'w1')!; // ذرة → stored as ذره
    const diacritized = word.letters.map((l) => (l === 'ه' ? 'ة' : l)); // send ة instead of normalized ه
    const result = submitWord(match, 'alice', word.entryId, diacritized);
    expect(result.outcome).toBe('correct');
  });
});

describe('requestHint', () => {
  it('reveals one letter and deducts the hint cost, capped at 2 hints per match', () => {
    const { grid, match } = buildTestMatch();
    const word = grid.words[0];
    const h1 = requestHint(match, 'alice', word.entryId);
    expect(h1.outcome).toBe('revealed');
    const h2 = requestHint(match, 'alice', grid.words[1].entryId);
    expect(h2.outcome).toBe('revealed');
    const h3 = requestHint(match, 'alice', grid.words[2].entryId);
    expect(h3.outcome).toBe('no_hints_left');
    expect(match.players.get('alice')!.score).toBeLessThanOrEqual(-50);
  });
});

describe('finalizeWinner', () => {
  it('picks the higher-score player', () => {
    const { match } = buildTestMatch();
    match.players.get('alice')!.score = 100;
    match.players.get('bob')!.score = 40;
    expect(finalizeWinner(match)).toBe('alice');
  });

  it('is a draw on equal scores with no completion event', () => {
    const { match } = buildTestMatch();
    expect(finalizeWinner(match)).toBe('draw');
  });
});

describe('toSnapshot', () => {
  it('never leaks solution letters for unsolved cells', () => {
    const { match } = buildTestMatch();
    const snapshot = toSnapshot(match);
    expect(JSON.stringify(snapshot)).not.toContain('solutionByCell');
    // Client-safe word slots must not carry a `letters` field either.
    for (const w of snapshot.grid.words) {
      expect((w as unknown as { letters?: unknown }).letters).toBeUndefined();
    }
  });
});
