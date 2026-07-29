import jwt from 'jsonwebtoken';
import type { Response, Request, NextFunction } from 'express';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'dev-only-access-secret-change-me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'dev-only-refresh-secret-change-me';
const ACCESS_TTL = process.env.JWT_ACCESS_TTL ?? '15m';
const REFRESH_TTL = process.env.JWT_REFRESH_TTL ?? '30d';

export interface AccessTokenPayload {
  sub: string; // userId
  username: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL as jwt.SignOptions['expiresIn'] });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, REFRESH_SECRET, { expiresIn: REFRESH_TTL as jwt.SignOptions['expiresIn'] });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, REFRESH_SECRET) as { sub: string };
}

const isProd = process.env.NODE_ENV === 'production';

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie('anc_access', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });
  res.cookie('anc_refresh', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('anc_access', { path: '/' });
  res.clearCookie('anc_refresh', { path: '/api/auth' });
}

export interface AuthedRequest extends Request {
  auth?: AccessTokenPayload;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.anc_access;
  if (!token) {
    res.status(401).json({ error: 'unauthenticated' });
    return;
  }
  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'invalid_token' });
  }
}
