import { Router } from 'express';
import { prisma } from '../db.js';

export const dailyRouter = Router();

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Leaderboard for today's daily challenge — highest score first, fastest finish breaks ties. */
dailyRouter.get('/leaderboard', async (_req, res) => {
  const startOfDay = new Date(`${todayUtc()}T00:00:00.000Z`);
  const players = await prisma.matchPlayer.findMany({
    where: {
      match: { isDaily: true, startedAt: { gte: startOfDay } },
      userId: { not: { startsWith: 'bot-' } },
    },
    include: { user: { select: { username: true, avatarSeed: true } }, match: { select: { endedAt: true, startedAt: true } } },
    orderBy: [{ score: 'desc' }],
    take: 100,
  });

  const ranked = players
    .slice()
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aDuration = (a.match.endedAt?.getTime() ?? Infinity) - a.match.startedAt.getTime();
      const bDuration = (b.match.endedAt?.getTime() ?? Infinity) - b.match.startedAt.getTime();
      return aDuration - bDuration;
    })
    .map((p, i) => ({
      rank: i + 1,
      username: p.user.username,
      avatarSeed: p.user.avatarSeed,
      score: p.score,
      wordsCompleted: p.wordsCompleted,
    }));

  res.json({ date: todayUtc(), entries: ranked });
});
