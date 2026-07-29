import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PuzzleGrid, RevealedCell, WordSlot } from '@anc/shared';
import clsx from '../lib/clsx';
import { useNumberFormat } from '../i18n';

interface CrosswordGridProps {
  grid: PuzzleGrid;
  revealedCells: RevealedCell[];
  selectedWord: WordSlot | null;
  localBuffer: Record<string, string>;
  activeCellIndex: number;
  opponentCursorWord: WordSlot | null;
  myUserId: string;
  onCellClick: (row: number, col: number) => void;
  shakeEntryId: string | null;
}

function key(r: number, c: number) {
  return `${r},${c}`;
}

export function CrosswordGrid({
  grid, revealedCells, selectedWord, localBuffer, activeCellIndex, opponentCursorWord, myUserId, onCellClick, shakeEntryId,
}: CrosswordGridProps) {
  const numberFmt = useNumberFormat();

  const revealedMap = useMemo(() => {
    const m = new Map<string, RevealedCell>();
    for (const rc of revealedCells) m.set(key(rc.row, rc.col), rc);
    return m;
  }, [revealedCells]);

  const selectedCells = useMemo(() => {
    const s = new Set<string>();
    if (selectedWord) {
      const dr = selectedWord.direction === 'down' ? 1 : 0;
      const dc = selectedWord.direction === 'across' ? 1 : 0;
      for (let k = 0; k < selectedWord.length; k++) s.add(key(selectedWord.row + dr * k, selectedWord.col + dc * k));
    }
    return s;
  }, [selectedWord]);

  const opponentCells = useMemo(() => {
    const s = new Set<string>();
    if (opponentCursorWord) {
      const dr = opponentCursorWord.direction === 'down' ? 1 : 0;
      const dc = opponentCursorWord.direction === 'across' ? 1 : 0;
      for (let k = 0; k < opponentCursorWord.length; k++) s.add(key(opponentCursorWord.row + dr * k, opponentCursorWord.col + dc * k));
    }
    return s;
  }, [opponentCursorWord]);

  const activeCellKey = useMemo(() => {
    if (!selectedWord) return null;
    const dr = selectedWord.direction === 'down' ? 1 : 0;
    const dc = selectedWord.direction === 'across' ? 1 : 0;
    return key(selectedWord.row + dr * activeCellIndex, selectedWord.col + dc * activeCellIndex);
  }, [selectedWord, activeCellIndex]);

  const isShaking = (row: number, col: number) => {
    if (!shakeEntryId || !selectedWord || selectedWord.entryId !== shakeEntryId) return false;
    return selectedCells.has(key(row, col));
  };

  return (
    <div
      role="grid"
      aria-label="شبكة الكلمات المتقاطعة"
      dir="rtl"
      className="mx-auto grid w-full max-w-xl gap-[3px] rounded-2xl bg-black/10 p-2"
      style={{ gridTemplateColumns: `repeat(${grid.size}, minmax(0, 1fr))`, aspectRatio: '1 / 1' }}
    >
      {grid.cells.flat().map((cell) => {
        if (!cell.active) {
          return <div key={key(cell.row, cell.col)} aria-hidden="true" />;
        }
        const k = key(cell.row, cell.col);
        const revealed = revealedMap.get(k);
        const localLetter = localBuffer[k];
        const letter = localLetter ?? revealed?.letter ?? '';
        const isSelected = selectedCells.has(k);
        const isOpponent = opponentCells.has(k) && !isSelected;
        const isActive = activeCellKey === k;
        const filledByMe = revealed?.filledBy === myUserId;
        const shake = isShaking(cell.row, cell.col);

        return (
          <motion.button
            key={k}
            type="button"
            role="gridcell"
            aria-colindex={cell.col + 1}
            aria-rowindex={cell.row + 1}
            aria-label={cell.number ? `خلية ${numberFmt(cell.number)}` : undefined}
            onClick={() => onCellClick(cell.row, cell.col)}
            animate={shake ? { x: [0, -6, 6, -6, 6, 0] } : { x: 0 }}
            transition={shake ? { duration: 0.18 } : { type: 'spring', stiffness: 260, damping: 26, mass: 0.9 }}
            whileTap={{ scale: 1.06 }}
            className={clsx(
              'relative grid place-items-center rounded-[10px] text-lg font-bold grid-cell-letter transition-colors',
              'border',
              isSelected && 'bg-neon-violet/15 border-neon-violet/60',
              isOpponent && !isSelected && 'bg-neon-violet/5 border-neon-violet/20',
              !isSelected && !isOpponent && 'bg-white/[0.04] border-glass-stroke',
              isActive && 'ring-2 ring-neon-cyan shadow-neon-cyan',
              revealed && (filledByMe ? 'text-neon-lime' : 'text-neon-cyan'),
              !revealed && 'text-text-hi',
            )}
          >
            {cell.number && (
              <span className="absolute top-0.5 right-1 text-[9px] leading-none text-text-lo">
                {numberFmt(cell.number)}
              </span>
            )}
            <AnimatePresence mode="wait">
              {letter && (
                <motion.span
                  key={letter}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 26, mass: 0.9 }}
                >
                  {letter}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
