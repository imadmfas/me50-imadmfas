import type { ClueListItem } from '@anc/shared';
import clsx from '../lib/clsx';
import { useNumberFormat } from '../i18n';

interface ClueRailProps {
  clues: ClueListItem[];
  selectedEntryId: string | null;
  onSelect: (entryId: string) => void;
}

export function ClueRail({ clues, selectedEntryId, onSelect }: ClueRailProps) {
  const numberFmt = useNumberFormat();
  const across = clues.filter((c) => c.direction === 'across');
  const down = clues.filter((c) => c.direction === 'down');

  const renderList = (items: ClueListItem[], label: string) => (
    <div className="flex-1">
      <p className="mb-1 text-xs font-bold text-text-lo">{label}</p>
      <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto pe-1">
        {items.map((c) => (
          <li key={c.entryId}>
            <button
              onClick={() => onSelect(c.entryId)}
              className={clsx(
                'w-full rounded-lg px-2 py-1.5 text-start text-xs leading-snug transition-colors',
                selectedEntryId === c.entryId && 'bg-neon-violet/15 text-neon-violet',
                c.solved && 'text-neon-lime line-through decoration-neon-lime/60',
                selectedEntryId !== c.entryId && !c.solved && 'text-text-hi hover:bg-white/5',
              )}
            >
              <span className="ms-1 font-bold">{numberFmt(c.number)}.</span> {c.clue}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="glass-panel flex gap-3 p-3">
      {renderList(across, 'أفقي')}
      {renderList(down, 'عمودي')}
    </div>
  );
}
