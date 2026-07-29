import { create } from 'zustand';
import type { MatchSnapshot, WordSlot } from '@anc/shared';
import { getSocket } from '../lib/socket';
import { audioMixer } from '../audio/AudioMixer';
import { useAuthStore } from './useAuthStore';
import { appendLearnHistory } from '../lib/learnHistory';

interface WordResultEvent {
  userId: string;
  entryId: string;
  outcome: 'correct' | 'incorrect';
  pointsAwarded?: number;
  factCard?: string;
  source?: string;
  penalty?: number;
}

interface MatchEndedEvent {
  matchId: string;
  reason: string;
  difficulty: 'easy' | 'medium' | 'hard';
  winnerUserId: string | 'draw';
  players: { userId: string; username: string; score: number; wordsCompleted: number }[];
  ratingDeltas: Record<string, { before: number; after: number }>;
}

interface MatchStoreState {
  snapshot: MatchSnapshot | null;
  selectedEntryId: string | null;
  selectedDirection: 'across' | 'down';
  localBuffer: Record<string, string>;
  activeCellIndex: number;
  shakeEntryId: string | null;
  opponentCursorEntryId: string | null;
  lastFactCard: { clue: string; factCard: string; source: string } | null;
  solvedFactCards: { entryId: string; clue: string; factCard: string; source: string }[];
  matchEnded: MatchEndedEvent | null;
  queueStatus: 'idle' | 'queued' | 'botOffered';
  botOfferDifficulty: string | null;

  bindSocketListeners: () => () => void;
  selectWord: (word: WordSlot) => void;
  typeLetter: (letter: string) => void;
  backspace: () => void;
  submit: () => void;
  requestHint: () => void;
  clickCell: (row: number, col: number) => void;
  joinQueue: (difficulty: 'easy' | 'medium' | 'hard') => void;
  cancelQueue: () => void;
  acceptBot: (difficulty: 'easy' | 'medium' | 'hard') => void;
  joinDaily: () => void;
  reset: () => void;
}

function wordAt(snapshot: MatchSnapshot | null, entryId: string | null): WordSlot | null {
  if (!snapshot || !entryId) return null;
  return snapshot.grid.words.find((w) => w.entryId === entryId) ?? null;
}

export const useMatchStore = create<MatchStoreState>((set, get) => ({
  snapshot: null,
  selectedEntryId: null,
  selectedDirection: 'across',
  localBuffer: {},
  activeCellIndex: 0,
  shakeEntryId: null,
  opponentCursorEntryId: null,
  lastFactCard: null,
  solvedFactCards: [],
  matchEnded: null,
  queueStatus: 'idle',
  botOfferDifficulty: null,

  bindSocketListeners: () => {
    const socket = getSocket();

    const onState = (snap: MatchSnapshot) => {
      set((s) => {
        // Auto-select the first unsolved word initially, and auto-advance
        // once the selected word gets solved (by either player, since the
        // grid is shared) so typing can continue onto the next clue.
        let selectedEntryId = s.selectedEntryId;
        const currentIsSolved = selectedEntryId ? snap.clues.find((c) => c.entryId === selectedEntryId)?.solved : false;
        if (!selectedEntryId || currentIsSolved) {
          selectedEntryId = snap.clues.find((c) => !c.solved)?.entryId ?? null;
          return { snapshot: snap, selectedEntryId, queueStatus: 'idle', localBuffer: {}, activeCellIndex: 0 };
        }
        return { snapshot: snap, selectedEntryId, queueStatus: 'idle' };
      });
    };
    const onWordResult = (evt: WordResultEvent) => {
      const myId = useAuthStore.getState().me?.id;
      const isMine = evt.userId === myId;
      if (evt.outcome === 'incorrect') {
        if (isMine) audioMixer.play('wrong');
        set({ shakeEntryId: evt.entryId, localBuffer: {}, activeCellIndex: 0 });
        setTimeout(() => set((s) => (s.shakeEntryId === evt.entryId ? { shakeEntryId: null } : {})), 400);
      } else {
        audioMixer.play(isMine ? 'wordComplete' : 'opponentScored');
        const clueText = get().snapshot?.clues.find((c) => c.entryId === evt.entryId)?.clue ?? '';
        set((s) => ({
          localBuffer: isMine ? {} : s.localBuffer,
          activeCellIndex: isMine ? 0 : s.activeCellIndex,
          lastFactCard: evt.factCard ? { clue: evt.entryId, factCard: evt.factCard, source: evt.source ?? '' } : s.lastFactCard,
          solvedFactCards: evt.factCard
            ? [...s.solvedFactCards, { entryId: evt.entryId, clue: clueText, factCard: evt.factCard, source: evt.source ?? '' }]
            : s.solvedFactCards,
        }));
        if (isMine && evt.factCard) {
          appendLearnHistory({ entryId: evt.entryId, clue: clueText, factCard: evt.factCard, source: evt.source ?? '' });
        }
        setTimeout(() => set((s) => (s.lastFactCard?.clue === evt.entryId ? { lastFactCard: null } : {})), 6000);
      }
    };
    const onCursor = (evt: { userId: string; entryId: string | null }) => {
      set({ opponentCursorEntryId: evt.entryId });
    };
    const onEnded = (evt: MatchEndedEvent) => set({ matchEnded: evt });
    const onQueueBotOffer = () => set({ queueStatus: 'botOffered' });

    socket.on('match:state', onState);
    socket.on('match:wordResult', onWordResult);
    socket.on('match:opponentCursor', onCursor);
    socket.on('match:ended', onEnded);
    socket.on('queue:botOffer', onQueueBotOffer);

    return () => {
      socket.off('match:state', onState);
      socket.off('match:wordResult', onWordResult);
      socket.off('match:opponentCursor', onCursor);
      socket.off('match:ended', onEnded);
      socket.off('queue:botOffer', onQueueBotOffer);
    };
  },

  selectWord: (word) => {
    set({ selectedEntryId: word.entryId, selectedDirection: word.direction, localBuffer: {}, activeCellIndex: 0 });
    const snap = get().snapshot;
    if (snap) getSocket().emit('match:cursor', { matchId: snap.matchId, entryId: word.entryId });
  },

  typeLetter: (letter) => {
    const { snapshot, selectedEntryId, activeCellIndex } = get();
    const word = wordAt(snapshot, selectedEntryId);
    if (!word || activeCellIndex >= word.length) return;
    const dr = word.direction === 'down' ? 1 : 0;
    const dc = word.direction === 'across' ? 1 : 0;
    const r = word.row + dr * activeCellIndex;
    const c = word.col + dc * activeCellIndex;
    set((s) => ({
      localBuffer: { ...s.localBuffer, [`${r},${c}`]: letter },
      activeCellIndex: Math.min(activeCellIndex + 1, word.length),
    }));
    if (activeCellIndex + 1 >= word.length) get().submit();
  },

  backspace: () => {
    const { snapshot, selectedEntryId, activeCellIndex } = get();
    const word = wordAt(snapshot, selectedEntryId);
    if (!word) return;
    const newIndex = Math.max(0, activeCellIndex - 1);
    const dr = word.direction === 'down' ? 1 : 0;
    const dc = word.direction === 'across' ? 1 : 0;
    const r = word.row + dr * newIndex;
    const c = word.col + dc * newIndex;
    set((s) => {
      const buf = { ...s.localBuffer };
      delete buf[`${r},${c}`];
      return { localBuffer: buf, activeCellIndex: newIndex };
    });
  },

  submit: () => {
    const { snapshot, selectedEntryId, localBuffer } = get();
    const word = wordAt(snapshot, selectedEntryId);
    if (!snapshot || !word) return;
    const dr = word.direction === 'down' ? 1 : 0;
    const dc = word.direction === 'across' ? 1 : 0;
    const letters: string[] = [];
    for (let k = 0; k < word.length; k++) {
      const r = word.row + dr * k;
      const c = word.col + dc * k;
      letters.push(localBuffer[`${r},${c}`] ?? '');
    }
    if (letters.some((l) => !l)) return; // incomplete — wait for more input
    getSocket().emit('match:submitWord', { matchId: snapshot.matchId, entryId: word.entryId, letters });
  },

  requestHint: () => {
    const { snapshot, selectedEntryId } = get();
    if (!snapshot || !selectedEntryId) return;
    getSocket().emit('match:hint', { matchId: snapshot.matchId, entryId: selectedEntryId });
  },

  clickCell: (row, col) => {
    const { snapshot } = get();
    if (!snapshot) return;
    const across = snapshot.grid.words.find((w) => {
      if (w.direction !== 'across') return false;
      return row === w.row && col >= w.col && col < w.col + w.length;
    });
    const down = snapshot.grid.words.find((w) => {
      if (w.direction !== 'down') return false;
      return col === w.col && row >= w.row && row < w.row + w.length;
    });
    const current = get().selectedEntryId;
    let word = across ?? down;
    if (current === across?.entryId && down) word = down;
    else if (current === down?.entryId && across) word = across;
    if (word) get().selectWord(word);
  },

  joinQueue: (difficulty) => {
    set({ queueStatus: 'queued', botOfferDifficulty: difficulty });
    getSocket().emit('queue:join', { difficulty });
  },
  cancelQueue: () => {
    getSocket().emit('queue:cancel');
    set({ queueStatus: 'idle', botOfferDifficulty: null });
  },
  acceptBot: (difficulty) => {
    getSocket().emit('queue:acceptBot', { difficulty });
  },
  joinDaily: () => {
    getSocket().emit('daily:join', {});
  },

  reset: () =>
    set({
      snapshot: null, selectedEntryId: null, localBuffer: {}, activeCellIndex: 0,
      shakeEntryId: null, opponentCursorEntryId: null, lastFactCard: null, matchEnded: null,
      queueStatus: 'idle', botOfferDifficulty: null,
    }),
}));
