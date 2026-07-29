import { motion } from 'framer-motion';
import clsx from '../lib/clsx';

interface ArabicKeyboardProps {
  onKey: (letter: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  disabled?: boolean;
}

// 28 base letters + hamza + seated-hamza/alif variants, laid out thumb-reachable
// (short rows, most-frequent letters centered) for mobile-first use.
// Every key fills exactly one grid cell (see useMatchStore.typeLetter), so
// there's deliberately no combined "لا" key — لا is always ل followed by ا
// as two separate keypresses, matching the two-cell segmentation rule.
const ROWS: string[][] = [
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
  ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
  ['ئ', 'ء', 'ؤ', 'ر', 'ى', 'ة', 'و', 'ز', 'ظ', 'ذ'],
];

export function ArabicKeyboard({ onKey, onBackspace, onEnter, disabled }: ArabicKeyboardProps) {
  return (
    <div
      role="group"
      aria-label="لوحة المفاتيح العربية"
      className="mx-auto flex w-full max-w-xl flex-col gap-1.5 select-none"
      dir="rtl"
    >
      {ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1.5">
          {row.map((letter) => (
            <motion.button
              key={letter}
              type="button"
              disabled={disabled}
              whileTap={{ scale: 0.9 }}
              onClick={() => onKey(letter)}
              className={clsx(
                'grid h-11 min-w-[2.25rem] flex-1 place-items-center rounded-lg glass-panel grid-cell-letter text-lg text-text-hi',
                'active:shadow-neon-cyan disabled:opacity-40',
              )}
            >
              {letter}
            </motion.button>
          ))}
        </div>
      ))}
      <div className="flex justify-center gap-1.5">
        <motion.button
          type="button"
          disabled={disabled}
          whileTap={{ scale: 0.94 }}
          onClick={onBackspace}
          aria-label="حذف"
          className="h-11 flex-[2] rounded-lg glass-panel font-display text-sm text-text-hi disabled:opacity-40"
        >
          ⌫ حذف
        </motion.button>
        <motion.button
          type="button"
          disabled={disabled}
          whileTap={{ scale: 0.94 }}
          onClick={onEnter}
          aria-label="تأكيد"
          className="h-11 flex-[2] rounded-lg border border-neon-cyan bg-neon-cyan/10 font-display text-sm text-neon-cyan shadow-neon-cyan disabled:opacity-40"
        >
          تأكيد ✓
        </motion.button>
      </div>
    </div>
  );
}
