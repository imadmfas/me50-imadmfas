export type Category =
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'medicine'
  | 'astronomy'
  | 'mathematics'
  | 'logic'
  | 'linguistics'
  | 'philosophy'
  | 'geography'
  | 'history'
  | 'computing'
  | 'economics'
  | 'law';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface WordEntry {
  id: string;
  answer: string; // Arabic, no diacritics, isolated-safe
  answerNormalized: string;
  length: number;
  clue: string;
  clueEn?: string;
  category: Category;
  difficulty: Difficulty;
  factCard: string;
  source: string;
  verified: boolean;
  tags: string[];
}

export type CellDirection = 'across' | 'down';

export interface GridCell {
  row: number;
  col: number;
  /** true if this cell is fillable (part of the grid), false if it's a blocked/void cell */
  active: boolean;
  /** clue number shown in the top-right of the cell, if this cell starts an entry */
  number?: number;
}

/** Server-internal placement — carries the actual letters. NEVER serialize to a client. */
export interface PlacedWord {
  entryId: string;
  letters: string[]; // one normalized, isolated-safe letter per cell, in placement order
  row: number;
  col: number;
  direction: CellDirection;
  number: number;
  length: number;
}

/** Client-safe word slot: geometry + numbering only, no letters. */
export interface WordSlot {
  entryId: string;
  row: number;
  col: number;
  direction: CellDirection;
  number: number;
  length: number;
}

/** Client-safe puzzle grid. Contains no answer letters anywhere. */
export interface PuzzleGrid {
  id: string;
  seed: string;
  size: number;
  difficulty: Difficulty;
  cells: GridCell[][];
  words: WordSlot[];
  createdAt: string;
}

/** Server-only: the grid plus the answer key. Never serialize this to a client. */
export interface PuzzleGridWithSolution extends Omit<PuzzleGrid, 'words'> {
  words: PlacedWord[];
  solutionByCell: string[][]; // row-major, isolated Arabic letter per active cell, '' for blocked
}

export function stripSolution(grid: PuzzleGridWithSolution): PuzzleGrid {
  const { solutionByCell: _solutionByCell, words, ...rest } = grid;
  return {
    ...rest,
    words: words.map(({ entryId, row, col, direction, number, length }) => ({
      entryId, row, col, direction, number, length,
    })),
  };
}

export interface ClueListItem {
  number: number;
  direction: CellDirection;
  clue: string;
  length: number;
  entryId: string;
  solved?: boolean;
}

export type MatchStatus = 'queued' | 'active' | 'finished' | 'abandoned';

export interface PlayerPublicState {
  userId: string;
  username: string;
  score: number;
  wordsCompleted: number;
  hintsUsed: number;
  connected: boolean;
}

export interface RevealedCell {
  row: number;
  col: number;
  letter: string;
  filledBy: string;
}

export interface MatchSnapshot {
  matchId: string;
  status: MatchStatus;
  difficulty: Difficulty;
  grid: PuzzleGrid;
  clues: ClueListItem[];
  players: PlayerPublicState[];
  /** Cells already filled (solved words + hints). Safe to send — never includes unsolved letters. */
  revealedCells: RevealedCell[];
  timeLimitSeconds: number;
  serverNowMs: number;
  startedAtMs: number | null;
  endsAtMs: number | null;
}
