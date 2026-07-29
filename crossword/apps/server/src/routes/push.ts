import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { pushConfigured } from '../push.js';

export const pushRouter = Router();

pushRouter.get('/status', (_req, res) => {
  // The VAPID public key is, by design, safe to expose to any client —
  // only the private key (never sent here) needs to stay secret.
  res.json({ configured: pushConfigured, publicKey: pushConfigured ? process.env.VAPID_PUBLIC_KEY : null });
});

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

pushRouter.post('/subscribe', requireAuth, async (req: AuthedRequest, res) => {
  if (!pushConfigured) {
    res.status(503).json({ error: 'push_not_configured' });
    return;
  }
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_body' });
    return;
  }
  const { endpoint, keys } = parsed.data;
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: req.auth!.sub, p256dh: keys.p256dh, auth: keys.auth },
    create: { userId: req.auth!.sub, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });
  res.status(201).json({ ok: true });
});

pushRouter.post('/unsubscribe', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = z.object({ endpoint: z.string().url() }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_body' });
    return;
  }
  await prisma.pushSubscription.deleteMany({ where: { endpoint: parsed.data.endpoint, userId: req.auth!.sub } });
  res.json({ ok: true });
});
