import { generatePuzzle, stripSolution } from '@anc/shared';
import type { Difficulty, GeneratorWordInput, PuzzleGrid, PuzzleGridWithSolution } from '@anc/shared';
import { prisma } from '../db.js';

let wordBankCache: Map<Difficulty, GeneratorWordInput[]> | null = null;

/** Loads the verified word bank from the DB once per process and caches it in memory. */
export async function loadWordBank(): Promise<Map<Difficulty, GeneratorWordInput[]>> {
  if (wordBankCache) return wordBankCache;
  const rows = await prisma.wordEntry.findMany({ where: { verified: true } });
  const byDifficulty = new Map<Difficulty, GeneratorWordInput[]>([
    ['easy', []], ['medium', []], ['hard', []],
  ]);
  for (const row of rows) {
    const diff = row.difficulty as Difficulty;
    byDifficulty.get(diff)!.push({ id: row.id, answer: row.answer });
  }
  wordBankCache = byDifficulty;
  return byDifficulty;
}

export function invalidateWordBankCache(): void {
  wordBankCache = null;
}

/**
 * Look up a pregenerated grid from the pool (see scripts/pregenerate-pool.ts)
 * for sub-second matchmaking; falls back to generating fresh on-the-fly if
 * the pool is empty for this difficulty (e.g. a dev box that never ran the
 * pregenerate script).
 */
export async function getGridForMatch(seed: string, difficulty: Difficulty): Promise<PuzzleGridWithSolution> {
  const poolCount = await prisma.puzzleGrid.count({ where: { difficulty } });
  if (poolCount > 0) {
    const skip = Math.floor(Math.random() * poolCount);
    const row = await prisma.puzzleGrid.findFirst({ where: { difficulty }, skip, take: 1 });
    if (row) {
      const grid = JSON.parse(row.gridJson) as PuzzleGrid;
      const solution = JSON.parse(row.solutionJson) as { solutionByCell: string[][]; words: PuzzleGridWithSolution['words'] };
      return { ...grid, id: `${row.id}-${seed}`, words: solution.words, solutionByCell: solution.solutionByCell };
    }
  }

  const bank = await loadWordBank();
  return generatePuzzle({ seed, difficulty, words: bank.get(difficulty) ?? [] });
}

export function toClientGrid(grid: PuzzleGridWithSolution): PuzzleGrid {
  return stripSolution(grid);
}
