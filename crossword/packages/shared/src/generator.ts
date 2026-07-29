import type { CellDirection, Difficulty, GridCell, PlacedWord, PuzzleGridWithSolution } from './types.js';
import { normalizeArabic, segmentToCells } from './normalizer.js';
import { DIFFICULTY_RULES } from './constants.js';

export interface GeneratorWordInput {
  id: string;
  answer: string; // raw Arabic answer (will be normalized + segmented internally)
}

export interface GenerateOptions {
  seed: string;
  difficulty: Difficulty;
  words: GeneratorWordInput[];
  /** Grid is regenerated up to this many times (different internal shuffles) to hit the checked-cell target. Default 8. */
  maxAttempts?: number;
  /** Reject/retry if the final checked-cell ratio is below this. Default 0.6 (60%). */
  minCheckedCellRatio?: number;
  /** Stop adding words once the grid holds this many. Default 18. */
  maxWords?: number;
}

/**
 * Coordinate convention (important — this is what makes RTL rendering trivial):
 * col index 0 is the RIGHTMOST column. Increasing col index moves left.
 * An "across" word is stored as letters at (row, col), (row, col+1), ... —
 * i.e. it reads correctly when the grid is rendered in DOM/array order
 * inside a `dir="rtl"` container (CSS Grid flips the inline axis for you).
 * "down" words simply increase row top-to-bottom as usual.
 * Clue numbering (top-right first) is therefore a plain row-major scan
 * with row asc, col asc.
 */

// FNV-1a
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seedInt: number) {
  let a = seedInt;
  return function rng(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

interface Candidate {
  id: string;
  letters: string[];
}

interface TrialPlacement {
  row: number;
  col: number;
  direction: CellDirection;
  crossings: number;
}

class WorkingGrid {
  cells: (string | null)[][]; // null = inactive
  placed: PlacedWord[] = [];
  readonly size: number;

  constructor(size: number) {
    this.size = size;
    this.cells = Array.from({ length: size }, () => Array<string | null>(size).fill(null));
  }

  inBounds(row: number, col: number): boolean {
    return row >= 0 && row < this.size && col >= 0 && col < this.size;
  }

  at(row: number, col: number): string | null {
    if (!this.inBounds(row, col)) return null;
    return this.cells[row][col];
  }

  /** Try every placed word as an anchor and find the best-scoring valid trial placement for candidate. */
  findBestPlacement(candidate: Candidate, rng: () => number): TrialPlacement | null {
    const trials: TrialPlacement[] = [];

    for (const placed of this.placed) {
      for (let j = 0; j < placed.letters.length; j++) {
        const anchorLetter = placed.letters[j];
        for (let i = 0; i < candidate.letters.length; i++) {
          if (candidate.letters[i] !== anchorLetter) continue;

          let row: number;
          let col: number;
          let direction: CellDirection;
          if (placed.direction === 'across') {
            direction = 'down';
            col = placed.col + j;
            row = placed.row - i;
          } else {
            direction = 'across';
            row = placed.row + j;
            col = placed.col - i;
          }

          const trial = this.validate(candidate, row, col, direction);
          if (trial) trials.push(trial);
        }
      }
    }

    if (trials.length === 0) return null;
    trials.sort((a, b) => b.crossings - a.crossings);
    const best = trials[0].crossings;
    const bestTrials = trials.filter((t) => t.crossings === best);
    return bestTrials[Math.floor(rng() * bestTrials.length)];
  }

  private validate(candidate: Candidate, row: number, col: number, direction: CellDirection): TrialPlacement | null {
    let crossings = 0;
    const dr = direction === 'down' ? 1 : 0;
    const dc = direction === 'across' ? 1 : 0;

    // Cell immediately before the start and immediately after the end must
    // be out of bounds or inactive, or this word would silently fuse with
    // a neighboring entry.
    const beforeRow = row - dr;
    const beforeCol = col - dc;
    if (this.inBounds(beforeRow, beforeCol) && this.at(beforeRow, beforeCol) !== null) return null;
    const afterRow = row + dr * candidate.letters.length;
    const afterCol = col + dc * candidate.letters.length;
    if (this.inBounds(afterRow, afterCol) && this.at(afterRow, afterCol) !== null) return null;

    for (let k = 0; k < candidate.letters.length; k++) {
      const r = row + dr * k;
      const c = col + dc * k;
      if (!this.inBounds(r, c)) return null;

      const existing = this.at(r, c);
      if (existing !== null) {
        if (existing !== candidate.letters[k]) return null;
        crossings++;
      } else {
        // Empty cell: the two perpendicular neighbors must also be empty,
        // otherwise this letter would sit flush against an unrelated word
        // and create an accidental, unclued adjacent entry.
        const perp = direction === 'across'
          ? [[r - 1, c], [r + 1, c]]
          : [[r, c - 1], [r, c + 1]];
        for (const [pr, pc] of perp) {
          if (this.inBounds(pr, pc) && this.at(pr, pc) !== null) return null;
        }
      }
    }

    // Require at least one real crossing so every word (after the seed word)
    // is actually connected to the rest of the grid.
    if (crossings === 0) return null;

    return { row, col, direction, crossings };
  }

  place(entryId: string, candidate: Candidate, row: number, col: number, direction: CellDirection): void {
    const dr = direction === 'down' ? 1 : 0;
    const dc = direction === 'across' ? 1 : 0;
    for (let k = 0; k < candidate.letters.length; k++) {
      this.cells[row + dr * k][col + dc * k] = candidate.letters[k];
    }
    this.placed.push({
      entryId,
      letters: candidate.letters,
      row,
      col,
      direction,
      number: 0, // assigned later
      length: candidate.letters.length,
    });
  }

  checkedCellRatio(): number {
    const bbox = this.boundingBox();
    if (!bbox) return 0;
    let active = 0;
    let checked = 0;
    for (let r = bbox.minRow; r <= bbox.maxRow; r++) {
      for (let c = bbox.minCol; c <= bbox.maxCol; c++) {
        if (this.cells[r][c] === null) continue;
        active++;
        const acrossNeighbors = this.at(r, c - 1) !== null || this.at(r, c + 1) !== null;
        const downNeighbors = this.at(r - 1, c) !== null || this.at(r + 1, c) !== null;
        if (acrossNeighbors && downNeighbors) checked++;
      }
    }
    return active === 0 ? 0 : checked / active;
  }

  boundingBox(): { minRow: number; maxRow: number; minCol: number; maxCol: number } | null {
    let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.cells[r][c] !== null) {
          minRow = Math.min(minRow, r);
          maxRow = Math.max(maxRow, r);
          minCol = Math.min(minCol, c);
          maxCol = Math.max(maxCol, c);
        }
      }
    }
    if (minRow === Infinity) return null;
    return { minRow, maxRow, minCol, maxCol };
  }

  /** True if every active cell is reachable from the first placed word (no isolated islands). */
  isConnected(): boolean {
    if (this.placed.length === 0) return false;
    const visited = new Set<string>();
    const start = this.placed[0];
    const stack: [number, number][] = [[start.row, start.col]];
    const bbox = this.boundingBox()!;
    while (stack.length) {
      const [r, c] = stack.pop()!;
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      if (this.at(r, c) === null) continue;
      visited.add(key);
      stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }
    let totalActive = 0;
    for (let r = bbox.minRow; r <= bbox.maxRow; r++) {
      for (let c = bbox.minCol; c <= bbox.maxCol; c++) {
        if (this.cells[r][c] !== null) totalActive++;
      }
    }
    return visited.size === totalActive;
  }
}

function assignNumbersAndTrim(grid: WorkingGrid): { cells: GridCell[][]; placed: PlacedWord[]; size: number } {
  const bbox = grid.boundingBox();
  if (!bbox) throw new Error('empty grid');
  const { minRow, maxRow, minCol, maxCol } = bbox;
  const size = Math.max(maxRow - minRow + 1, maxCol - minCol + 1);

  const cells: GridCell[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => ({ row: r, col: c, active: false }) as GridCell),
  );

  let nextNumber = 1;
  const numberAt = new Map<string, number>();

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      if (grid.cells[r][c] === null) continue;
      const rr = r - minRow;
      const cc = c - minCol;
      cells[rr][cc].active = true;

      const startsAcross = grid.at(r, c - 1) === null && grid.at(r, c + 1) !== null;
      const startsDown = grid.at(r - 1, c) === null && grid.at(r + 1, c) !== null;
      if (startsAcross || startsDown) {
        const key = `${r},${c}`;
        if (!numberAt.has(key)) {
          numberAt.set(key, nextNumber++);
        }
        cells[rr][cc].number = numberAt.get(key);
      }
    }
  }

  const placed: PlacedWord[] = grid.placed.map((w) => {
    const key = `${w.row},${w.col}`;
    return {
      ...w,
      row: w.row - minRow,
      col: w.col - minCol,
      number: numberAt.get(key)!,
    };
  }).sort((a, b) => a.number - b.number || (a.direction > b.direction ? 1 : -1));

  return { cells, placed, size };
}

/** Deterministic: same seed + same word list always yields the same grid. */
export function generatePuzzle(options: GenerateOptions): PuzzleGridWithSolution {
  const { seed, difficulty, words, maxAttempts = 8, minCheckedCellRatio = 0.6, maxWords = 18 } = options;
  const rules = DIFFICULTY_RULES[difficulty];
  const size = rules.gridSize;

  const candidates: Candidate[] = words
    .map((w) => ({ id: w.id, letters: segmentToCells(normalizeArabic(w.answer)) }))
    .filter((c) => c.letters.length >= rules.minLen && c.letters.length <= rules.maxLen)
    // dedupe identical answers
    .filter((c, idx, arr) => arr.findIndex((o) => o.letters.join('') === c.letters.join('')) === idx);

  if (candidates.length < 3) {
    throw new Error(`Not enough candidate words (${candidates.length}) for difficulty "${difficulty}"`);
  }

  const baseSeedInt = hashSeed(seed);
  let best: WorkingGrid | null = null;
  let bestRatio = -1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const rng = mulberry32(baseSeedInt + attempt * 7919);
    const ordered = shuffle(candidates, rng).sort((a, b) => b.letters.length - a.letters.length);

    const grid = new WorkingGrid(size);
    const center = Math.floor(size / 2);
    const first = ordered[0];
    const startCol = Math.max(0, Math.min(size - first.letters.length, center - Math.floor(first.letters.length / 2)));
    grid.place(first.id, first, center, startCol, 'across');

    for (let i = 1; i < ordered.length && grid.placed.length < maxWords; i++) {
      const placement = grid.findBestPlacement(ordered[i], rng);
      if (placement) {
        grid.place(ordered[i].id, ordered[i], placement.row, placement.col, placement.direction);
      }
    }

    if (grid.placed.length < 4 || !grid.isConnected()) continue;
    const ratio = grid.checkedCellRatio();
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = grid;
    }
    if (ratio >= minCheckedCellRatio) break;
  }

  if (!best) {
    throw new Error('Puzzle generator failed to produce a connected grid — widen the word pool.');
  }

  const { cells, placed, size: trimmedSize } = assignNumbersAndTrim(best);

  const solutionByCell: string[][] = Array.from({ length: trimmedSize }, () => Array(trimmedSize).fill(''));
  for (const w of placed) {
    const dr = w.direction === 'down' ? 1 : 0;
    const dc = w.direction === 'across' ? 1 : 0;
    for (let k = 0; k < w.letters.length; k++) {
      solutionByCell[w.row + dr * k][w.col + dc * k] = w.letters[k];
    }
  }

  return {
    id: `${difficulty}-${seed}`,
    seed,
    size: trimmedSize,
    difficulty,
    cells,
    words: placed,
    solutionByCell,
    createdAt: new Date().toISOString(),
  };
}
