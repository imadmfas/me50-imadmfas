import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { usernameKey, validateUsernameFormat } from '@anc/shared';
import { prisma } from '../db.js';
import { signAccessToken, signRefreshToken, setAuthCookies } from '../auth.js';

export const usernameRouter = Router();

function suggestAlternatives(base: string): string[] {
  const suffixes = ['_' + Math.floor(10 + Math.random() * 90), '' + Math.floor(100 + Math.random() * 900), '_x'];
  return suffixes.map((s) => `${base}${s}`.slice(0, 20));
}

const checkSchema = z.object({ u: z.string().min(1).max(20) });

usernameRouter.get('/check', async (req, res) => {
  const parsed = checkSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ status: 'invalid', reason: 'query' });
    return;
  }
  const { u } = parsed.data;
  const format = validateUsernameFormat(u);
  if (!format.ok) {
    res.json({ status: 'invalid', reason: format.reason });
    return;
  }
  const key = usernameKey(u);
  const existing = await prisma.user.findUnique({ where: { usernameKey: key } });
  if (existing) {
    res.json({ status: 'taken', suggestions: suggestAlternatives(u) });
    return;
  }
  res.json({ status: 'available' });
});

const claimSchema = z.object({ username: z.string().min(1).max(20) });

usernameRouter.post('/claim', async (req, res) => {
  const parsed = claimSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_body' });
    return;
  }
  const { username } = parsed.data;
  const format = validateUsernameFormat(username);
  if (!format.ok) {
    res.status(422).json({ error: 'invalid_username', reason: format.reason });
    return;
  }
  const key = usernameKey(username);

  try {
    // Atomic claim: the pre-check above is advisory only. The DB unique
    // constraint on username_key is the real source of truth, so a race
    // between two clients claiming the same normalized name resolves
    // deterministically to "one wins, one gets P2002" instead of both
    // succeeding.
    const user = await prisma.user.create({
      data: {
        username,
        usernameKey: key,
        avatarSeed: key,
      },
    });
    await prisma.rating.createMany({
      data: [
        { userId: user.id, difficulty: 'easy', value: 1200 },
        { userId: user.id, difficulty: 'medium', value: 1200 },
        { userId: user.id, difficulty: 'hard', value: 1200 },
      ],
    });

    const accessToken = signAccessToken({ sub: user.id, username: user.username });
    const refreshToken = signRefreshToken(user.id);
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({ id: user.id, username: user.username });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(409).json({ error: 'username_taken', suggestions: suggestAlternatives(username) });
      return;
    }
    throw err;
  }
});
