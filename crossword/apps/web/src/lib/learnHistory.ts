export interface LearnEntry {
  entryId: string;
  clue: string;
  factCard: string;
  source: string;
  solvedAt: number;
  /** Simple spaced-repetition bookkeeping (SM-2-lite): grows on each review, review due date derived from it. */
  reviewCount: number;
  nextReviewAt: number;
}

const STORAGE_KEY = 'anc-learn-history';

/**
 * MVP simplification: solved-word history lives in localStorage, not the
 * server. The Prisma schema (MoveLog + MatchPlayer) already has everything
 * needed to move this server-side and sync across devices — see
 * CONTENT.md / README.md "Known simplifications" for the follow-up.
 */
export function getLearnHistory(): LearnEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LearnEntry[]) : [];
  } catch {
    return [];
  }
}

export function appendLearnHistory(entry: { entryId: string; clue: string; factCard: string; source: string }): void {
  const history = getLearnHistory();
  if (history.some((h) => h.entryId === entry.entryId)) return;
  const next: LearnEntry = { ...entry, solvedAt: Date.now(), reviewCount: 0, nextReviewAt: Date.now() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([next, ...history].slice(0, 500)));
  } catch {
    /* storage full/unavailable — history is a nice-to-have, not critical */
  }
}

const REVIEW_INTERVALS_DAYS = [1, 3, 7, 16, 35];

/** Call after the player reviews a card in the Learn screen. */
export function markReviewed(entryId: string): void {
  const history = getLearnHistory();
  const idx = history.findIndex((h) => h.entryId === entryId);
  if (idx === -1) return;
  const entry = history[idx];
  const days = REVIEW_INTERVALS_DAYS[Math.min(entry.reviewCount, REVIEW_INTERVALS_DAYS.length - 1)];
  history[idx] = { ...entry, reviewCount: entry.reviewCount + 1, nextReviewAt: Date.now() + days * 86400000 };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}
