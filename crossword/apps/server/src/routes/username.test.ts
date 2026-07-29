import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../db.js';

const app = createApp();

describe('username claim + availability (integration)', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('reports a fresh username as available', async () => {
    const res = await request(app).get('/api/username/check').query({ u: `متاح_${Date.now()}` });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('available');
  });

  it('rejects reserved and malformed usernames without hitting the DB', async () => {
    const reserved = await request(app).get('/api/username/check').query({ u: 'admin' });
    expect(reserved.body).toEqual({ status: 'invalid', reason: 'reserved' });

    const tooShort = await request(app).get('/api/username/check').query({ u: 'ab' });
    expect(tooShort.body).toEqual({ status: 'invalid', reason: 'length' });
  });

  it('claims a username, sets auth cookies, and rejects the same normalized name again', async () => {
    // Kept short (username max length is 20) so appending a tatweel below still fits.
    const username = `م_${Date.now().toString().slice(-6)}`;
    const first = await request(app).post('/api/username/claim').send({ username });
    expect(first.status).toBe(201);
    expect(first.headers['set-cookie']).toBeTruthy();

    // Same normalized key with tatweel (a valid, allowed character) inserted —
    // usernameKey() strips it, so this must collide rather than create a duplicate.
    const withTatweel = username.replace(/^(.)/, '$1ـ');
    const second = await request(app).post('/api/username/claim').send({ username: withTatweel });
    expect(second.status).toBe(409);
    expect(second.body.error).toBe('username_taken');
    expect(second.body.suggestions).toHaveLength(3);
  });

  it('claims two concurrent identical usernames atomically — exactly one succeeds', async () => {
    const username = `سباق_${Date.now()}`;
    const [a, b] = await Promise.all([
      request(app).post('/api/username/claim').send({ username }),
      request(app).post('/api/username/claim').send({ username }),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([201, 409]);
  });
});
