import type { Category, Difficulty } from './types.js';

export const CATEGORIES: Category[] = [
  'physics', 'chemistry', 'biology', 'medicine', 'astronomy', 'mathematics',
  'logic', 'linguistics', 'philosophy', 'geography', 'history', 'computing',
  'economics', 'law',
];

/** No category may exceed this share of the shipped word bank. */
export const MAX_CATEGORY_SHARE = 0.15;

export const DIFFICULTY_RULES: Record<Difficulty, { minLen: number; maxLen: number; gridSize: number; timeLimitSeconds: number }> = {
  easy: { minLen: 3, maxLen: 5, gridSize: 9, timeLimitSeconds: 5 * 60 },
  medium: { minLen: 5, maxLen: 7, gridSize: 11, timeLimitSeconds: 8 * 60 },
  hard: { minLen: 6, maxLen: 10, gridSize: 13, timeLimitSeconds: 12 * 60 },
};

export const SCORING = {
  pointsPerFirstLetter: 10,
  wordCompleteBonus: 40,
  wrongWordPenalty: -5,
  maxStreakMultiplier: 2,
  streakStep: 0.2, // multiplier grows by this much per consecutive correct word, capped at max
  hintCost: 25,
  hintsPerMatch: 2,
} as const;

export const MATCHMAKING = {
  initialRatingWindow: 50,
  maxRatingWindow: 400,
  widenIntervalSeconds: 5, // widen the window every 5s
  widenAmount: 70,
  botOfferAfterSeconds: 45,
} as const;

export const RECONNECT_WINDOW_SECONDS = 60;
export const HEARTBEAT_INTERVAL_SECONDS = 5;

export const ELO_K_FACTOR = 32;

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

/** outcome: 1 = A won, 0.5 = draw, 0 = A lost */
export function updateElo(ratingA: number, ratingB: number, outcome: 0 | 0.5 | 1): { newA: number; newB: number } {
  const expectedA = expectedScore(ratingA, ratingB);
  const expectedB = 1 - expectedA;
  const newA = Math.round(ratingA + ELO_K_FACTOR * (outcome - expectedA));
  const newB = Math.round(ratingB + ELO_K_FACTOR * ((1 - outcome) - expectedB));
  return { newA, newB };
}
