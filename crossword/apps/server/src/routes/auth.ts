import { Router } from 'express';
import { prisma } from '../db.js';
import {
  requireAuth,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  type AuthedRequest,
} from '../auth.js';

export const authRouter = Router();

authRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.sub },
    include: { ratings: true },
  });
  if (!user) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  res.json({
    id: user.id,
    username: user.username,
    avatarSeed: user.avatarSeed,
    countryCode: user.countryCode,
    bio: user.bio,
    xp: user.xp,
    level: user.level,
    streakDays: user.streakDays,
    ratings: Object.fromEntries(user.ratings.map((r) => [r.difficulty, r.value])),
  });
});

authRouter.post('/refresh', async (req, res) => {
  const token = req.cookies?.anc_refresh;
  if (!token) {
    res.status(401).json({ error: 'no_refresh_token' });
    return;
  }
  try {
    const payload = verifyRefreshToken(token);
    const session = await prisma.session.findUnique({ where: { refreshToken: token } });
    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({ error: 'session_expired' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      res.status(401).json({ error: 'user_not_found' });
      return;
    }
    const accessToken = signAccessToken({ sub: user.id, username: user.username });
    const newRefreshToken = signRefreshToken(user.id);
    await prisma.session.update({
      where: { id: session.id },
      data: { refreshToken: newRefreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });
    setAuthCookies(res, accessToken, newRefreshToken);
    res.json({ ok: true });
  } catch {
    res.status(401).json({ error: 'invalid_refresh_token' });
  }
});

authRouter.post('/logout', async (req, res) => {
  const token = req.cookies?.anc_refresh;
  if (token) {
    await prisma.session.deleteMany({ where: { refreshToken: token } });
  }
  clearAuthCookies(res);
  res.json({ ok: true });
});
