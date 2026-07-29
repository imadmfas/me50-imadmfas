import type { Difficulty } from '@anc/shared';
import { MATCHMAKING } from '@anc/shared';

export interface QueueEntry {
  userId: string;
  username: string;
  socketId: string;
  difficulty: Difficulty;
  rating: number;
  joinedAtMs: number;
}

export class Matchmaker {
  private queues = new Map<Difficulty, QueueEntry[]>([['easy', []], ['medium', []], ['hard', []]]);

  join(entry: QueueEntry): void {
    this.leave(entry.difficulty, entry.userId);
    this.queues.get(entry.difficulty)!.push(entry);
  }

  leave(difficulty: Difficulty, userId: string): QueueEntry | null {
    const q = this.queues.get(difficulty)!;
    const idx = q.findIndex((e) => e.userId === userId);
    if (idx === -1) return null;
    const [removed] = q.splice(idx, 1);
    return removed;
  }

  leaveAll(userId: string): void {
    for (const difficulty of this.queues.keys()) this.leave(difficulty, userId);
  }

  private ratingWindowFor(waitedMs: number): number {
    const widenSteps = Math.floor(waitedMs / (MATCHMAKING.widenIntervalSeconds * 1000));
    return Math.min(
      MATCHMAKING.initialRatingWindow + widenSteps * MATCHMAKING.widenAmount,
      MATCHMAKING.maxRatingWindow,
    );
  }

  /** Scans a single difficulty queue and returns pairs ready to be matched, removing them from the queue. */
  tryMatchPairs(difficulty: Difficulty, nowMs = Date.now()): [QueueEntry, QueueEntry][] {
    const q = this.queues.get(difficulty)!;
    const pairs: [QueueEntry, QueueEntry][] = [];
    const matched = new Set<string>();

    // Oldest-first: give the longest-waiting player the widest window and the first shot at pairing.
    const sorted = [...q].sort((a, b) => a.joinedAtMs - b.joinedAtMs);

    for (let i = 0; i < sorted.length; i++) {
      const a = sorted[i];
      if (matched.has(a.userId)) continue;
      const windowA = this.ratingWindowFor(nowMs - a.joinedAtMs);
      for (let j = i + 1; j < sorted.length; j++) {
        const b = sorted[j];
        if (matched.has(b.userId)) continue;
        const windowB = this.ratingWindowFor(nowMs - b.joinedAtMs);
        const window = Math.max(windowA, windowB);
        if (Math.abs(a.rating - b.rating) <= window) {
          pairs.push([a, b]);
          matched.add(a.userId);
          matched.add(b.userId);
          break;
        }
      }
    }

    for (const [a, b] of pairs) {
      this.leave(difficulty, a.userId);
      this.leave(difficulty, b.userId);
    }

    return pairs;
  }

  /** Players who've waited past the bot-offer threshold and are still queued. */
  playersEligibleForBot(difficulty: Difficulty, nowMs = Date.now()): QueueEntry[] {
    return this.queues.get(difficulty)!.filter((e) => nowMs - e.joinedAtMs >= MATCHMAKING.botOfferAfterSeconds * 1000);
  }

  queueLength(difficulty: Difficulty): number {
    return this.queues.get(difficulty)!.length;
  }
}
