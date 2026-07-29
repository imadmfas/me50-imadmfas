import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

export const leaderboardRouter = Router();

const querySchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

leaderboardRouter.get('/global', async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_query' });
    return;
  }
  const { difficulty, limit } = parsed.data;
  const rows = await prisma.rating.findMany({
    where: { difficulty, userId: { not: { startsWith: 'bot-' } } },
    orderBy: { value: 'desc' },
    take: limit,
    include: { user: { select: { username: true, avatarSeed: true, countryCode: true } } },
  });
  res.json({
    difficulty,
    entries: rows.map((r, i) => ({
      rank: i + 1,
      username: r.user.username,
      avatarSeed: r.user.avatarSeed,
      countryCode: r.user.countryCode,
      rating: r.value,
    })),
  });
});
