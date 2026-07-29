import { normalizeArabic, segmentToCells, stripSolution } from '@anc/shared';
import type {
  ClueListItem, Difficulty, MatchSnapshot, MatchStatus, PlayerPublicState, PuzzleGridWithSolution, WordEntry,
} from '@anc/shared';
import { DIFFICULTY_RULES, SCORING } from '@anc/shared';

export interface MatchPlayerState {
  userId: string;
  username: string;
  socketId: string | null;
  connected: boolean;
  score: number;
  wordsCompleted: number;
  hintsUsed: number;
  streak: number;
  ratingBefore: number;
  disconnectedAtMs: number | null;
}

interface CellOwner {
  filled: boolean;
  filledBy: string | null; // userId of whoever placed it first
}

export interface MatchState {
  matchId: string;
  difficulty: Difficulty;
  grid: PuzzleGridWithSolution;
  wordsById: Map<string, WordEntry>; // entryId -> full WordEntry (server keeps factCard/source here)
  solvedEntryIds: Set<string>;
  cellOwners: CellOwner[][]; // [row][col]
  players: Map<string, MatchPlayerState>;
  status: MatchStatus;
  isDaily: boolean;
  isBotMatch: boolean;
  startedAtMs: number;
  endsAtMs: number;
  finishedAtMs: number | null;
  winnerUserId: string | null | 'draw';
}

export function createMatchState(params: {
  matchId: string;
  difficulty: Difficulty;
  grid: PuzzleGridWithSolution;
  words: WordEntry[];
  players: { userId: string; username: string; socketId: string | null; ratingBefore: number }[];
  isDaily?: boolean;
  isBotMatch?: boolean;
  nowMs?: number;
}): MatchState {
  const nowMs = params.nowMs ?? Date.now();
  const timeLimitSeconds = DIFFICULTY_RULES[params.difficulty].timeLimitSeconds;
  const cellOwners: CellOwner[][] = Array.from({ length: params.grid.size }, () =>
    Array.from({ length: params.grid.size }, () => ({ filled: false, filledBy: null })),
  );

  return {
    matchId: params.matchId,
    difficulty: params.difficulty,
    grid: params.grid,
    wordsById: new Map(params.words.map((w) => [w.id, w])),
    solvedEntryIds: new Set(),
    cellOwners,
    players: new Map(
      params.players.map((p) => [
        p.userId,
        {
          userId: p.userId,
          username: p.username,
          socketId: p.socketId,
          connected: true,
          score: 0,
          wordsCompleted: 0,
          hintsUsed: 0,
          streak: 0,
          ratingBefore: p.ratingBefore,
          disconnectedAtMs: null,
        },
      ]),
    ),
    status: 'active',
    isDaily: params.isDaily ?? false,
    isBotMatch: params.isBotMatch ?? false,
    startedAtMs: nowMs,
    endsAtMs: nowMs + timeLimitSeconds * 1000,
    finishedAtMs: null,
    winnerUserId: null,
  };
}

export type SubmitWordResult =
  | { outcome: 'already_solved' }
  | { outcome: 'not_found' }
  | {
      outcome: 'correct';
      entryId: string;
      pointsAwarded: number;
      newlyFilledCells: number;
      streak: number;
      factCard: string;
      source: string;
      matchNowComplete: boolean;
    }
  | { outcome: 'incorrect'; penalty: number; streak: number };

export function submitWord(match: MatchState, userId: string, entryId: string, letters: string[], nowMs = Date.now()): SubmitWordResult {
  const player = match.players.get(userId);
  if (!player) return { outcome: 'not_found' };

  const wordSlot = match.grid.words.find((w) => w.entryId === entryId);
  const entry = match.wordsById.get(entryId);
  if (!wordSlot || !entry) return { outcome: 'not_found' };
  if (match.solvedEntryIds.has(entryId)) return { outcome: 'already_solved' };

  const normalizedInput = letters.map((l) => normalizeArabic(l));
  const dr = wordSlot.direction === 'down' ? 1 : 0;
  const dc = wordSlot.direction === 'across' ? 1 : 0;

  let allCorrect = normalizedInput.length === wordSlot.length;
  if (allCorrect) {
    for (let k = 0; k < wordSlot.length; k++) {
      const r = wordSlot.row + dr * k;
      const c = wordSlot.col + dc * k;
      if (match.grid.solutionByCell[r][c] !== normalizedInput[k]) {
        allCorrect = false;
        break;
      }
    }
  }

  if (!allCorrect) {
    player.streak = 0;
    player.score += SCORING.wrongWordPenalty;
    return { outcome: 'incorrect', penalty: SCORING.wrongWordPenalty, streak: player.streak };
  }

  let newlyFilledCells = 0;
  for (let k = 0; k < wordSlot.length; k++) {
    const r = wordSlot.row + dr * k;
    const c = wordSlot.col + dc * k;
    const owner = match.cellOwners[r][c];
    if (!owner.filled) {
      owner.filled = true;
      owner.filledBy = userId;
      newlyFilledCells++;
    }
  }

  player.streak = Math.min(player.streak + 1, 100);
  const multiplier = Math.min(1 + player.streak * SCORING.streakStep, SCORING.maxStreakMultiplier);
  const letterPoints = Math.round(newlyFilledCells * SCORING.pointsPerFirstLetter * multiplier);
  const bonus = Math.round(SCORING.wordCompleteBonus * multiplier);
  const pointsAwarded = letterPoints + bonus;

  player.score += pointsAwarded;
  player.wordsCompleted += 1;
  match.solvedEntryIds.add(entryId);

  const matchNowComplete = match.solvedEntryIds.size === match.grid.words.length;
  if (matchNowComplete) {
    match.winnerUserId = userId; // tie-break rule: completer of the last shared word wins ties
  }

  return {
    outcome: 'correct',
    entryId,
    pointsAwarded,
    newlyFilledCells,
    streak: player.streak,
    factCard: entry.factCard,
    source: entry.source,
    matchNowComplete,
  };
}

export type HintResult =
  | { outcome: 'no_hints_left' }
  | { outcome: 'already_solved' }
  | { outcome: 'not_found' }
  | { outcome: 'revealed'; row: number; col: number; letter: string; cost: number };

export function requestHint(match: MatchState, userId: string, entryId: string): HintResult {
  const player = match.players.get(userId);
  if (!player) return { outcome: 'not_found' };
  if (player.hintsUsed >= SCORING.hintsPerMatch) return { outcome: 'no_hints_left' };
  if (match.solvedEntryIds.has(entryId)) return { outcome: 'already_solved' };

  const wordSlot = match.grid.words.find((w) => w.entryId === entryId);
  if (!wordSlot) return { outcome: 'not_found' };

  const dr = wordSlot.direction === 'down' ? 1 : 0;
  const dc = wordSlot.direction === 'across' ? 1 : 0;
  for (let k = 0; k < wordSlot.length; k++) {
    const r = wordSlot.row + dr * k;
    const c = wordSlot.col + dc * k;
    if (!match.cellOwners[r][c].filled) {
      match.cellOwners[r][c] = { filled: true, filledBy: userId };
      player.hintsUsed += 1;
      player.score -= SCORING.hintCost;
      return { outcome: 'revealed', row: r, col: c, letter: match.grid.solutionByCell[r][c], cost: SCORING.hintCost };
    }
  }
  return { outcome: 'already_solved' };
}

export function computeClueList(match: MatchState): ClueListItem[] {
  return match.grid.words
    .map((w) => {
      const entry = match.wordsById.get(w.entryId)!;
      return {
        number: w.number,
        direction: w.direction,
        clue: entry.clue,
        length: w.length,
        entryId: w.entryId,
        solved: match.solvedEntryIds.has(w.entryId),
      };
    })
    .sort((a, b) => a.number - b.number || (a.direction > b.direction ? 1 : -1));
}

export function toPublicPlayers(match: MatchState): PlayerPublicState[] {
  return Array.from(match.players.values()).map((p) => ({
    userId: p.userId,
    username: p.username,
    score: p.score,
    wordsCompleted: p.wordsCompleted,
    hintsUsed: p.hintsUsed,
    connected: p.connected,
  }));
}

function computeRevealedCells(match: MatchState) {
  const revealed: { row: number; col: number; letter: string; filledBy: string }[] = [];
  for (let r = 0; r < match.cellOwners.length; r++) {
    for (let c = 0; c < match.cellOwners[r].length; c++) {
      const owner = match.cellOwners[r][c];
      if (owner.filled && owner.filledBy) {
        revealed.push({ row: r, col: c, letter: match.grid.solutionByCell[r][c], filledBy: owner.filledBy });
      }
    }
  }
  return revealed;
}

export function toSnapshot(match: MatchState, nowMs = Date.now()): MatchSnapshot {
  return {
    matchId: match.matchId,
    status: match.status,
    difficulty: match.difficulty,
    // stripSolution (not a manual spread) is load-bearing here — a plain
    // {...match.grid} would carry solutionByCell straight to the client.
    grid: stripSolution(match.grid),
    clues: computeClueList(match),
    players: toPublicPlayers(match),
    revealedCells: computeRevealedCells(match),
    timeLimitSeconds: DIFFICULTY_RULES[match.difficulty].timeLimitSeconds,
    serverNowMs: nowMs,
    startedAtMs: match.startedAtMs,
    endsAtMs: match.endsAtMs,
  };
}

/** Decide the match winner given current state — called at time-out or full completion. */
export function finalizeWinner(match: MatchState): string | 'draw' {
  if (match.winnerUserId) return match.winnerUserId;
  const players = Array.from(match.players.values());
  if (players.length < 2) return players[0]?.userId ?? 'draw';
  const [a, b] = players;
  if (a.score === b.score) return 'draw';
  return a.score > b.score ? a.userId : b.userId;
}
