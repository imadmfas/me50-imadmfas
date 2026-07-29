/**
 * Pregenerates a pool of validated crossword grids per difficulty and
 * caches them in the PuzzleGrid table for sub-second matchmaking (server
 * picks a random cached grid instead of running the generator inline).
 *
 * Demo default: 25 grids/difficulty (75 total) so this runs in seconds
 * during local dev. The product spec's target is 2,000+/difficulty —
 * scale that up by raising POOL_SIZE and running this as a CI/cron job;
 * the generator itself has no ceiling, this script is just how often you
 * choose to run it.
 */
import { PrismaClient } from '@prisma/client';
import { generatePuzzle } from '../../../packages/shared/src/generator.js';
import { stripSolution } from '../../../packages/shared/src/types.js';
import type { Difficulty } from '../../../packages/shared/src/types.js';

const prisma = new PrismaClient();
const POOL_SIZE = Number(process.env.POOL_SIZE ?? 25);
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

async function main() {
  for (const difficulty of DIFFICULTIES) {
    const words = await prisma.wordEntry.findMany({ where: { verified: true, difficulty } });
    if (words.length < 4) {
      console.warn(`[pool] skipping ${difficulty}: only ${words.length} verified words (need >= 4)`);
      continue;
    }
    const generatorWords = words.map((w) => ({ id: w.id, answer: w.answer }));

    let created = 0;
    for (let i = 0; i < POOL_SIZE; i++) {
      const seed = `pool-${difficulty}-${i}`;
      try {
        const grid = generatePuzzle({ seed, difficulty, words: generatorWords });
        await prisma.puzzleGrid.upsert({
          where: { id: grid.id },
          update: {},
          create: {
            id: grid.id,
            seed,
            difficulty,
            size: grid.size,
            gridJson: JSON.stringify(stripSolution(grid)),
            solutionJson: JSON.stringify({ solutionByCell: grid.solutionByCell, words: grid.words }),
          },
        });
        created++;
      } catch (err) {
        console.warn(`[pool] ${difficulty} seed ${i} failed: ${(err as Error).message}`);
      }
    }
    console.log(`[pool] ${difficulty}: ${created}/${POOL_SIZE} grids cached`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
