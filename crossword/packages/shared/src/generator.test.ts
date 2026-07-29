import { describe, it, expect } from 'vitest';
import { generatePuzzle } from './generator.js';
import type { GeneratorWordInput } from './generator.js';

const EASY_WORDS: GeneratorWordInput[] = [
  { id: 'w1', answer: 'ذرة' },
  { id: 'w2', answer: 'خلية' },
  { id: 'w3', answer: 'قمر' },
  { id: 'w4', answer: 'عدد' },
  { id: 'w5', answer: 'دم' + 'اغ' }, // دماغ
  { id: 'w6', answer: 'نجم' },
  { id: 'w7', answer: 'جين' },
  { id: 'w8', answer: 'رقم' },
  { id: 'w9', answer: 'صوت' },
  { id: 'w10', answer: 'ضوء' },
  { id: 'w11', answer: 'قلب' },
  { id: 'w12', answer: 'حمض' },
  { id: 'w13', answer: 'مجرة' },
  { id: 'w14', answer: 'فيزياء' },
  { id: 'w15', answer: 'منطق' },
];

describe('generatePuzzle', () => {
  it('is deterministic for a given seed', () => {
    const a = generatePuzzle({ seed: 'match-123', difficulty: 'easy', words: EASY_WORDS });
    const b = generatePuzzle({ seed: 'match-123', difficulty: 'easy', words: EASY_WORDS });
    expect(a.cells).toEqual(b.cells);
    expect(a.solutionByCell).toEqual(b.solutionByCell);
    expect(a.words.map((w) => w.entryId)).toEqual(b.words.map((w) => w.entryId));
  });

  it('produces a different grid for a different seed', () => {
    const a = generatePuzzle({ seed: 'seed-A', difficulty: 'easy', words: EASY_WORDS });
    const b = generatePuzzle({ seed: 'seed-B', difficulty: 'easy', words: EASY_WORDS });
    expect(a.solutionByCell).not.toEqual(b.solutionByCell);
  });

  it('places at least 4 intersecting words', () => {
    const grid = generatePuzzle({ seed: 'seed-1', difficulty: 'easy', words: EASY_WORDS });
    expect(grid.words.length).toBeGreaterThanOrEqual(4);
  });

  it('never contains a placement shorter than 3 letters', () => {
    const grid = generatePuzzle({ seed: 'seed-1', difficulty: 'easy', words: EASY_WORDS });
    for (const w of grid.words) {
      expect(w.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('assigns every crossing cell a consistent letter across both its words', () => {
    const grid = generatePuzzle({ seed: 'seed-1', difficulty: 'easy', words: EASY_WORDS });
    const bySlot = new Map<string, string>();
    for (const w of grid.words) {
      const dr = w.direction === 'down' ? 1 : 0;
      const dc = w.direction === 'across' ? 1 : 0;
      for (let k = 0; k < w.length; k++) {
        const r = w.row + dr * k;
        const c = w.col + dc * k;
        const letter = grid.solutionByCell[r][c];
        const key = `${r},${c}`;
        if (bySlot.has(key)) {
          expect(bySlot.get(key)).toBe(letter);
        } else {
          bySlot.set(key, letter);
        }
      }
    }
  });

  it('numbers cells starting from 1 in row-major (top-right-first) order', () => {
    const grid = generatePuzzle({ seed: 'seed-1', difficulty: 'easy', words: EASY_WORDS });
    const numbers: number[] = [];
    for (const row of grid.cells) {
      for (const cell of row) {
        if (cell.number) numbers.push(cell.number);
      }
    }
    expect(numbers[0]).toBe(1);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it('throws with a clear error when the word pool is too small', () => {
    expect(() =>
      generatePuzzle({ seed: 'x', difficulty: 'easy', words: [{ id: 'a', answer: 'قمر' }] }),
    ).toThrow(/Not enough candidate words/);
  });
});
