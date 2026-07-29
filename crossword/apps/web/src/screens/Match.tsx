import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CrosswordGrid } from '../components/CrosswordGrid';
import { ArabicKeyboard } from '../components/ArabicKeyboard';
import { ClueRail } from '../components/ClueRail';
import { MatchHud } from '../components/MatchHud';
import { GlassPanel } from '../components/GlassPanel';
import { useMatchStore } from '../store/useMatchStore';
import { useAuthStore } from '../store/useAuthStore';
import { useT } from '../i18n';
import { audioMixer } from '../audio/AudioMixer';
import { getSocket } from '../lib/socket';

const REACTIONS = ['👏', '🔥', '😅', '🤔', '💪', '😂'];

export function Match() {
  const navigate = useNavigate();
  const t = useT();
  const { me } = useAuthStore();
  const snapshot = useMatchStore((s) => s.snapshot);
  const selectedEntryId = useMatchStore((s) => s.selectedEntryId);
  const localBuffer = useMatchStore((s) => s.localBuffer);
  const activeCellIndex = useMatchStore((s) => s.activeCellIndex);
  const shakeEntryId = useMatchStore((s) => s.shakeEntryId);
  const opponentCursorEntryId = useMatchStore((s) => s.opponentCursorEntryId);
  const lastFactCard = useMatchStore((s) => s.lastFactCard);
  const matchEnded = useMatchStore((s) => s.matchEnded);
  const { selectWord, typeLetter, backspace, requestHint, clickCell } = useMatchStore();

  const [reactionFeed, setReactionFeed] = useState<{ id: number; emoji: string; mine: boolean }[]>([]);

  // Full physical-keyboard support: type Arabic letters directly, Backspace
  // to delete, Enter to force-submit. RTL arrow-key semantics are handled
  // for free — ArrowRight/ArrowLeft aren't intercepted, so native caret/tab
  // order already matches the visual RTL layout.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Backspace') {
        e.preventDefault();
        backspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
      } else if (/^[ء-ي]$/.test(e.key)) {
        e.preventDefault();
        audioMixer.unlock();
        audioMixer.play('key', { pitchVariance: 0.03 });
        typeLetter(e.key);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Test-only hook: exposes the current matchId to the Playwright E2E suite
  // (see /crossword/e2e). Never enabled in production builds.
  useEffect(() => {
    if (import.meta.env.DEV && snapshot) {
      (window as unknown as { __ancMatchId?: string }).__ancMatchId = snapshot.matchId;
    }
  }, [snapshot]);

  useEffect(() => {
    const socket = getSocket();
    const onReaction = (evt: { userId: string; emoji: string }) => {
      setReactionFeed((f) => [...f.slice(-4), { id: Date.now(), emoji: evt.emoji, mine: false }]);
    };
    socket.on('match:reaction', onReaction);
    return () => {
      socket.off('match:reaction', onReaction);
    };
  }, []);

  useEffect(() => {
    if (matchEnded) {
      const won = matchEnded.winnerUserId === me?.id;
      audioMixer.play(matchEnded.winnerUserId === 'draw' ? 'wordComplete' : won ? 'victory' : 'defeat');
      navigate('/results');
    }
  }, [matchEnded, me, navigate]);

  const selectedWord = useMemo(
    () => snapshot?.grid.words.find((w) => w.entryId === selectedEntryId) ?? null,
    [snapshot, selectedEntryId],
  );
  const opponentWord = useMemo(
    () => snapshot?.grid.words.find((w) => w.entryId === opponentCursorEntryId) ?? null,
    [snapshot, opponentCursorEntryId],
  );

  function sendReaction(emoji: string) {
    if (!snapshot) return;
    getSocket().emit('match:reaction', { matchId: snapshot.matchId, emoji });
    setReactionFeed((f) => [...f.slice(-4), { id: Date.now(), emoji, mine: true }]);
  }

  function handleKey(letter: string) {
    audioMixer.unlock();
    audioMixer.play('key', { pitchVariance: 0.03 });
    typeLetter(letter);
  }

  if (!snapshot || !me) {
    return <div className="grid min-h-[60vh] place-items-center text-text-lo">جارٍ تحميل المباراة…</div>;
  }

  const hintsLeft = 2 - (snapshot.players.find((p) => p.userId === me.id)?.hintsUsed ?? 0);

  return (
    <div className="flex flex-col gap-3">
      <MatchHud snapshot={snapshot} myUserId={me.id} clockOffsetMs={snapshot.serverNowMs - Date.now()} />

      <CrosswordGrid
        grid={snapshot.grid}
        revealedCells={snapshot.revealedCells}
        selectedWord={selectedWord}
        localBuffer={localBuffer}
        activeCellIndex={activeCellIndex}
        opponentCursorWord={opponentWord}
        myUserId={me.id}
        onCellClick={clickCell}
        shakeEntryId={shakeEntryId}
      />

      <ClueRail clues={snapshot.clues} selectedEntryId={selectedEntryId} onSelect={(id) => {
        const word = snapshot.grid.words.find((w) => w.entryId === id);
        if (word) selectWord(word);
      }} />

      <ArabicKeyboard onKey={handleKey} onBackspace={backspace} onEnter={() => { }} />

      <div className="flex items-center justify-between">
        <button
          onClick={requestHint}
          disabled={hintsLeft <= 0 || !selectedEntryId}
          className="glass-panel flex items-center gap-1 px-4 py-2 text-sm text-neon-lime disabled:opacity-40"
        >
          💡 {t('match.hint')} ({hintsLeft})
        </button>
        <div className="flex gap-1">
          {REACTIONS.map((e) => (
            <button key={e} onClick={() => sendReaction(e)} className="text-xl">{e}</button>
          ))}
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
        <AnimatePresence>
          {reactionFeed.map((r) => (
            <motion.span
              key={r.id}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -40, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="text-3xl"
            >
              {r.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {lastFactCard && (
          <motion.div
            key={lastFactCard.clue}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="pointer-events-none fixed inset-x-4 bottom-24 z-30"
          >
            <GlassPanel glow="lime" className="p-4 text-sm">
              <p className="font-bold text-neon-lime">هل تعلم؟</p>
              <p className="mt-1 text-text-hi">{lastFactCard.factCard}</p>
              <p className="mt-1 text-xs text-text-lo">{lastFactCard.source}</p>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
