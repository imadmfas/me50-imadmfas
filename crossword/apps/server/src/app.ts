import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';

import { usernameRouter } from './routes/username.js';
import { authRouter } from './routes/auth.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { dailyRouter } from './routes/daily.js';
import { debugRouter } from './routes/debug.js';
import { pushRouter } from './routes/push.js';

/** The Express app, importable without binding a port — used by index.ts (production) and Supertest (tests). */
export function createApp() {
  const CORS_ORIGIN = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((s) => s.trim());

  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '64kb' }));
  app.use(cookieParser());
  if (process.env.NODE_ENV !== 'test') {
    app.use(pinoHttp({ redact: ['req.headers.cookie', 'req.headers.authorization'] }));
  }

  const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false });
  app.use('/api', apiLimiter);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/username', usernameRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/leaderboard', leaderboardRouter);
  app.use('/api/daily', dailyRouter);
  app.use('/api/push', pushRouter);
  if (process.env.NODE_ENV !== 'production') {
    app.use('/api/debug', debugRouter);
  }

  // Centralized error handler — never leak stack traces or internals to clients.
  app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    req.log?.error?.({ err }, 'unhandled_error');
    res.status(500).json({ error: 'internal_error' });
  });

  return app;
}
