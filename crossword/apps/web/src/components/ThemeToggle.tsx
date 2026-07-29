import { useRef } from 'react';
import { useSettingsStore, resolveEffectiveTheme } from '../store/useSettingsStore';

export function ThemeToggle() {
  const theme = useSettingsStore((s) => s.theme);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const btnRef = useRef<HTMLButtonElement>(null);
  const effective = resolveEffectiveTheme(theme);

  function toggle() {
    const next = effective === 'dark' ? 'light' : 'dark';
    // Not all browsers implement the View Transitions API yet (Safari/Firefox
    // lag Chrome/Edge) — feature-detect via `in` rather than typing it, since
    // the ambient lib.dom.d.ts version varies across TS/toolchain versions.
    const startViewTransition = (document as Document & Record<string, unknown>).startViewTransition as
      | ((cb: () => void) => { ready: Promise<void> })
      | undefined;
    const btn = btnRef.current;

    if (!btn || reducedMotion || !startViewTransition) {
      setTheme(next);
      return;
    }

    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = startViewTransition.call(document, () => setTheme(next));
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
        { duration: 500, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
      );
    });
  }

  return (
    <button
      ref={btnRef}
      onClick={toggle}
      aria-label={effective === 'dark' ? 'التبديل إلى المظهر الفاتح' : 'التبديل إلى المظهر الداكن'}
      className="grid h-11 w-11 place-items-center rounded-full glass-panel text-xl"
    >
      <span aria-hidden="true">{effective === 'dark' ? '🌙' : '☀️'}</span>
    </button>
  );
}
