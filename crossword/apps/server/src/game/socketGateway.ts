import type { Server, Socket } from 'socket.io';
import { z } from 'zod';
import type { Difficulty } from '@anc/shared';
import { RECONNECT_WINDOW_SECONDS, updateElo, stripSolution } from '@anc/shared';
import { prisma } from '../db.js';
import { verifyAccessToken } from '../auth.js';
import { Matchmaker, type QueueEntry } from './matchmaking.js';
import {
  createMatchState, submitWord, requestHint, toSnapshot, finalizeWinner, type MatchState,
} from './matchEngine.js';
import { getGridForMatch } from './puzzlePool.js';

const db = prisma;

const matchmaker = new Matchmaker();
const activeMatches = new Map<string, MatchState>();
const socketsByUserId = new Map<string, Socket>();
const disconnectTimers = new Map<string, NodeJS.Timeout>(); // key: matchId:userId
const matchTimeouts = new Map<string, NodeJS.Timeout>();
const botTimers = new Map<string, NodeJS.Timeout[]>(); // matchId -> pending bot move timers

function cookieHeaderToMap(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

async function authenticateSocket(socket: Socket): Promise<{ userId: string; username: string } | null> {
  const cookies = cookieHeaderToMap(socket.handshake.headers.cookie);
  const token = cookies['anc_access'];
  if (!token) return null;
  try {
    const payload = verifyAccessToken(token);
    return { userId: payload.sub, username: payload.username };
  } catch {
    return null;
  }
}

async function buildMatch(matchId: string, difficulty: Difficulty, players: QueueEntry[], opts: { isDaily?: boolean; isBotMatch?: boolean; seed?: string } = {}) {
  const seed = opts.seed ?? matchId;
  const grid = await getGridForMatch(seed, difficulty);
  const entryIds = grid.words.map((w) => w.entryId);
  const entries = await prisma.wordEntry.findMany({ where: { id: { in: entryIds } } });
  const words = entries.map((e) => ({
    id: e.id, answer: e.answer, answerNormalized: e.answerNormalized, length: e.length,
    clue: e.clue, clueEn: e.clueEn ?? undefined, category: e.category as never, difficulty: e.difficulty as never,
    factCard: e.factCard, source: e.source, verified: e.verified, tags: JSON.parse(e.tagsJson),
  }));

  const puzzleGridRow = await prisma.puzzleGrid.upsert({
    where: { id: grid.id },
    update: {},
    create: {
      id: grid.id, seed, difficulty, size: grid.size,
      gridJson: JSON.stringify(stripSolution(grid)),
      solutionJson: JSON.stringify({ solutionByCell: grid.solutionByCell, words: grid.words }),
    },
  });

  const matchRow = await prisma.match.create({
    data: {
      puzzleGridId: puzzleGridRow.id,
      difficulty,
      isDaily: opts.isDaily ?? false,
      isBotMatch: opts.isBotMatch ?? false,
      players: {
        create: players.map((p) => ({ userId: p.userId, ratingBefore: p.rating })),
      },
    },
  });

  const match = createMatchState({
    matchId: matchRow.id,
    difficulty,
    grid,
    words,
    players: players.map((p) => ({ userId: p.userId, username: p.username, socketId: p.socketId, ratingBefore: p.rating })),
    isDaily: opts.isDaily,
    isBotMatch: opts.isBotMatch,
  });

  activeMatches.set(match.matchId, match);
  scheduleMatchTimeout(match);
  return match;
}

const BOT_USER_PREFIX = 'bot-';
/** Seeded once in prisma/seed.ts so bot MatchPlayer rows satisfy the User FK constraint. */
export const BOT_PRACTICE_USER_ID = 'bot-practice';

/**
 * Human-paced practice bot: schedules solving each unsolved word at a
 * randomized delay instead of instantly, so it never behaves as an
 * omniscient perfect player. Delay scales with word length and difficulty.
 */
function startBotAI(io: Server, match: MatchState, botUserId: string) {
  const timers: NodeJS.Timeout[] = [];
  const baseDelayMs: Record<string, number> = { easy: 4500, medium: 6500, hard: 9000 };
  let cumulativeMs = 1500;

  const order = [...match.grid.words].sort(() => Math.random() - 0.5);
  for (const word of order) {
    const thinkingMs = baseDelayMs[match.difficulty] + word.length * 700 + Math.random() * 4000;
    cumulativeMs += thinkingMs;
    const timer = setTimeout(() => {
      const current = activeMatches.get(match.matchId);
      if (!current || current.status !== 'active' || current.solvedEntryIds.has(word.entryId)) return;
      const dr = word.direction === 'down' ? 1 : 0;
      const dc = word.direction === 'across' ? 1 : 0;
      const letters: string[] = [];
      for (let k = 0; k < word.length; k++) {
        letters.push(current.grid.solutionByCell[word.row + dr * k][word.col + dc * k]);
      }
      const result = submitWord(current, botUserId, word.entryId, letters);
      if (result.outcome === 'correct' || result.outcome === 'incorrect') {
        io.to(match.matchId).emit('match:wordResult', { userId: botUserId, entryId: word.entryId, ...result });
        io.to(match.matchId).emit('match:state', toSnapshot(current));
        if (result.outcome === 'correct' && result.matchNowComplete) endMatch(match.matchId, 'completed');
      }
    }, cumulativeMs);
    timers.push(timer);
  }
  botTimers.set(match.matchId, timers);
}

function scheduleMatchTimeout(match: MatchState) {
  const delay = Math.max(0, match.endsAtMs - Date.now());
  const t = setTimeout(() => endMatch(match.matchId, 'timeout'), delay);
  matchTimeouts.set(match.matchId, t);
}

async function endMatch(matchId: string, reason: 'timeout' | 'completed' | 'abandoned') {
  const match = activeMatches.get(matchId);
  if (!match || match.status !== 'active') return;
  match.status = reason === 'abandoned' ? 'abandoned' : 'finished';
  match.finishedAtMs = Date.now();
  const timeout = matchTimeouts.get(matchId);
  if (timeout) clearTimeout(timeout);
  matchTimeouts.delete(matchId);
  for (const t of botTimers.get(matchId) ?? []) clearTimeout(t);
  botTimers.delete(matchId);

  const winner = finalizeWinner(match);
  match.winnerUserId = winner;

  const players = Array.from(match.players.values());
  const ratingDeltas: Record<string, { before: number; after: number }> = {};

  if (players.length === 2) {
    const [a, b] = players;
    const outcome: 0 | 0.5 | 1 = winner === 'draw' ? 0.5 : winner === a.userId ? 1 : 0;
    const { newA, newB } = updateElo(a.ratingBefore, b.ratingBefore, outcome);
    ratingDeltas[a.userId] = { before: a.ratingBefore, after: newA };
    ratingDeltas[b.userId] = { before: b.ratingBefore, after: newB };

    for (const [p, newRating] of [[a, newA], [b, newB]] as const) {
      if (!p.userId.startsWith('bot-')) {
        await db.rating.upsert({
          where: { userId_difficulty: { userId: p.userId, difficulty: match.difficulty } },
          update: { value: newRating },
          create: { userId: p.userId, difficulty: match.difficulty, value: newRating },
        }).catch(() => void 0);
        await db.matchPlayer.updateMany({
          where: { matchId, userId: p.userId },
          data: { score: p.score, wordsCompleted: p.wordsCompleted, hintsUsed: p.hintsUsed, won: winner === p.userId, ratingAfter: newRating },
        }).catch(() => void 0);
      }
    }
  }

  await db.match.update({ where: { id: matchId }, data: { status: match.status, endedAt: new Date() } }).catch(() => void 0);

  for (const p of players) {
    const socket = socketsByUserId.get(p.userId);
    socket?.emit('match:ended', {
      matchId,
      reason,
      difficulty: match.difficulty,
      winnerUserId: winner,
      players: players.map((pl) => ({ userId: pl.userId, username: pl.username, score: pl.score, wordsCompleted: pl.wordsCompleted })),
      ratingDeltas,
    });
  }

  setTimeout(() => activeMatches.delete(matchId), 5 * 60 * 1000);
}

const submitWordSchema = z.object({ matchId: z.string(), entryId: z.string(), letters: z.array(z.string()).max(10) });
const hintSchema = z.object({ matchId: z.string(), entryId: z.string() });
const joinQueueSchema = z.object({ difficulty: z.enum(['easy', 'medium', 'hard']) });
const cursorSchema = z.object({ matchId: z.string(), entryId: z.string().nullable() });
const reactionSchema = z.object({ matchId: z.string(), emoji: z.string().max(8) });

export function registerSocketGateway(io: Server): void {
  io.use(async (socket, next) => {
    const auth = await authenticateSocket(socket);
    if (!auth) {
      next(new Error('unauthenticated'));
      return;
    }
    socket.data.userId = auth.userId;
    socket.data.username = auth.username;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const userId: string = socket.data.userId;
    socketsByUserId.set(userId, socket);

    // Cancel any pending disconnect-forfeit timer for this user across all their matches.
    for (const [key, timer] of disconnectTimers) {
      if (key.endsWith(`:${userId}`)) {
        clearTimeout(timer);
        disconnectTimers.delete(key);
        const [matchId] = key.split(':');
        const match = activeMatches.get(matchId);
        const player = match?.players.get(userId);
        if (player) {
          player.connected = true;
          player.disconnectedAtMs = null;
          player.socketId = socket.id;
          socket.join(matchId);
          socket.emit('match:state', toSnapshot(match!));
          const opponent = Array.from(match!.players.values()).find((p) => p.userId !== userId);
          if (opponent) socketsByUserId.get(opponent.userId)?.emit('match:opponentReconnected', { userId });
        }
      }
    }

    socket.on('queue:join', async (raw, ack) => {
      const parsed = joinQueueSchema.safeParse(raw);
      if (!parsed.success) return ack?.({ error: 'invalid' });
      const { difficulty } = parsed.data;
      const rating = await db.rating.findUnique({ where: { userId_difficulty: { userId, difficulty } } });
      matchmaker.join({
        userId, username: socket.data.username, socketId: socket.id, difficulty,
        rating: rating?.value ?? 1200, joinedAtMs: Date.now(),
      });
      ack?.({ ok: true });
    });

    socket.on('queue:cancel', () => matchmaker.leaveAll(userId));

    socket.on('queue:acceptBot', async (raw, ack) => {
      const parsed = joinQueueSchema.safeParse(raw);
      if (!parsed.success) return ack?.({ error: 'invalid' });
      const { difficulty } = parsed.data;
      matchmaker.leave(difficulty, userId);
      const rating = await db.rating.findUnique({ where: { userId_difficulty: { userId, difficulty } } });
      const human: QueueEntry = { userId, username: socket.data.username, socketId: socket.id, difficulty, rating: rating?.value ?? 1200, joinedAtMs: Date.now() };
      const bot: QueueEntry = { userId: BOT_PRACTICE_USER_ID, username: 'الروبوت المدرّب', socketId: 'bot', difficulty, rating: rating?.value ?? 1200, joinedAtMs: Date.now() };
      const match = await buildMatch(crypto.randomUUID(), difficulty, [human, bot], { isBotMatch: true });
      socket.join(match.matchId);
      socket.emit('match:found', { matchId: match.matchId });
      socket.emit('match:state', toSnapshot(match));
      startBotAI(io, match, BOT_PRACTICE_USER_ID);
      ack?.({ ok: true, matchId: match.matchId });
    });

    socket.on('daily:join', async (_raw, ack) => {
      const today = new Date().toISOString().slice(0, 10);
      const seed = `daily-${today}`;
      const existing = Array.from(activeMatches.values()).find(
        (m) => m.isDaily && m.grid.seed === seed && m.players.has(userId),
      );
      if (existing) {
        socket.join(existing.matchId);
        socket.emit('match:state', toSnapshot(existing));
        return ack?.({ ok: true, matchId: existing.matchId });
      }
      const human: QueueEntry = { userId, username: socket.data.username, socketId: socket.id, difficulty: 'medium', rating: 1200, joinedAtMs: Date.now() };
      const match = await buildMatch(crypto.randomUUID(), 'medium', [human], { isDaily: true, seed });
      socket.join(match.matchId);
      socket.emit('match:state', toSnapshot(match));
      ack?.({ ok: true, matchId: match.matchId });
    });

    socket.on('match:submitWord', async (raw, ack) => {
      const parsed = submitWordSchema.safeParse(raw);
      if (!parsed.success) return ack?.({ error: 'invalid' });
      const { matchId, entryId, letters } = parsed.data;
      const match = activeMatches.get(matchId);
      if (!match || match.status !== 'active') return ack?.({ error: 'match_not_active' });

      const result = submitWord(match, userId, entryId, letters);
      ack?.(result);
      if (result.outcome === 'correct' || result.outcome === 'incorrect') {
        io.to(matchId).emit('match:wordResult', { userId, entryId, ...result });
        io.to(matchId).emit('match:state', toSnapshot(match));
        if (result.outcome === 'correct' && result.matchNowComplete) {
          await endMatch(matchId, 'completed');
        }
      }
    });

    socket.on('match:hint', (raw, ack) => {
      const parsed = hintSchema.safeParse(raw);
      if (!parsed.success) return ack?.({ error: 'invalid' });
      const match = activeMatches.get(parsed.data.matchId);
      if (!match || match.status !== 'active') return ack?.({ error: 'match_not_active' });
      const result = requestHint(match, userId, parsed.data.entryId);
      ack?.(result);
      if (result.outcome === 'revealed') {
        io.to(parsed.data.matchId).emit('match:state', toSnapshot(match));
      }
    });

    socket.on('match:cursor', (raw) => {
      const parsed = cursorSchema.safeParse(raw);
      if (!parsed.success) return;
      socket.to(parsed.data.matchId).emit('match:opponentCursor', { userId, entryId: parsed.data.entryId });
    });

    socket.on('match:reaction', (raw) => {
      const parsed = reactionSchema.safeParse(raw);
      if (!parsed.success) return;
      socket.to(parsed.data.matchId).emit('match:reaction', { userId, emoji: parsed.data.emoji });
    });

    socket.on('disconnect', () => {
      socketsByUserId.delete(userId);
      matchmaker.leaveAll(userId);
      for (const match of activeMatches.values()) {
        if (match.status !== 'active') continue;
        const player = match.players.get(userId);
        if (!player) continue;
        player.connected = false;
        player.disconnectedAtMs = Date.now();
        const opponent = Array.from(match.players.values()).find((p) => p.userId !== userId);
        if (opponent) socketsByUserId.get(opponent.userId)?.emit('match:opponentDisconnected', { userId });

        const key = `${match.matchId}:${userId}`;
        const timer = setTimeout(() => endMatch(match.matchId, 'abandoned'), RECONNECT_WINDOW_SECONDS * 1000);
        disconnectTimers.set(key, timer);
      }
    });
  });

  // Matchmaking sweep.
  setInterval(async () => {
    try {
    for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
      const pairs = matchmaker.tryMatchPairs(difficulty);
      for (const [a, b] of pairs) {
        const match = await buildMatch(crypto.randomUUID(), difficulty, [a, b]);
        for (const p of [a, b]) {
          const s = socketsByUserId.get(p.userId);
          s?.join(match.matchId);
          s?.emit('match:found', { matchId: match.matchId });
          s?.emit('match:state', toSnapshot(match));
        }
      }

      for (const entry of matchmaker.playersEligibleForBot(difficulty)) {
        socketsByUserId.get(entry.userId)?.emit('queue:botOffer');
      }
    }
    } catch (err) {
      console.error('[sweep] error', err);
    }
  }, 2000);
}

export function getActiveMatch(matchId: string): MatchState | undefined {
  return activeMatches.get(matchId);
}

export { matchmaker };
