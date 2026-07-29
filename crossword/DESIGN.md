# DESIGN.md — tokens, glass/neon system, motion spec

## Design tokens

Defined as CSS custom properties in `apps/web/src/index.css`, consumed
through Tailwind's `theme.extend.colors` (`tailwind.config.js`) so both raw
CSS and utility classes read the same source of truth.

```css
/* Dark (default) */
--bg-base: #06070E;
--bg-gradient: radial-gradient(120% 120% at 20% 0%, #131A3A 0%, #06070E 60%);
--glass-fill: rgba(255,255,255,0.06);
--glass-stroke: rgba(255,255,255,0.14);
--glass-blur: 22px;
--neon-cyan: #22D3EE;
--neon-violet: #A855F7;
--neon-lime: #A3E635;
--neon-rose: #FB7185;
--text-hi: #F8FAFC;
--text-lo: rgba(248,250,252,0.62);

/* Light — swapped in via :root[data-theme="light"] */
--bg-base: #F4F6FF;
--glass-fill: rgba(255,255,255,0.55);
--glass-stroke: rgba(15,23,42,0.10);
--text-hi: #0F172A;
--text-lo: rgba(15,23,42,0.64);
```

Theme resolution (`useSettingsStore` + `App.tsx`'s `useApplyThemeAndLocale`):
`theme` is `dark | light | system`; `system` reads
`prefers-color-scheme` live via a `matchMedia` listener and writes the
resolved value to `<html data-theme>`. Tailwind's `darkMode` is configured
against that same attribute (`['class', '[data-theme="dark"]']`), so utility
classes and raw CSS never disagree about which theme is active.

**Neon color semantics** (paired with icon/shape, never color alone — see
Accessibility below): cyan = your actions/score, violet = opponent, lime =
correct/revealed-by-you, rose = incorrect/danger.

## Glass panel recipe

`.glass-panel` in `index.css`:

```css
background: var(--glass-fill);
backdrop-filter: blur(var(--glass-blur)) saturate(140%);
border: 1px solid var(--glass-stroke);
box-shadow: 0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08);
border-radius: 20px;
```

with a `@supports not (backdrop-filter: blur(1px))` fallback that swaps to
an opaque `color-mix` tint instead of relying on blur. `GlassPanel.tsx`
wraps this as a component with an optional `glow` prop (`cyan | violet |
lime | rose | none`) mapping to `shadow-neon-*` Tailwind utilities.

## Motion

Framer Motion throughout, default spring `{ stiffness: 260, damping: 26,
mass: 0.9 }` — used consistently for button taps, tile fills, and panel
entrances so the whole app shares one physical "feel."

**Implemented:**
- **Page transitions** (`PageTransition.tsx`): outgoing screen scales to
  0.94 + blurs 8px, incoming rises from y+24, opacity 0→1, 420ms
  cubic-bezier — wired per-route in `App.tsx` via `AnimatePresence`.
- **Theme toggle**: View Transitions API (`document.startViewTransition`)
  driving a circular `clip-path` wipe from the toggle button's origin,
  500ms; falls back to an instant swap where the API isn't supported
  (Safari/Firefox at time of writing) or `prefers-reduced-motion` is set.
- **Grid tiles**: spring scale/opacity on letter entry, shake animation
  (±6px, 180ms) on a rejected word, numbered-cell layout via the same
  spring.
- **Matchmaking**: two counter-rotating rings (CSS `rotate` via Framer's
  `animate`), no canvas particle work.
- **Score changes**: `motion.p` keyed on score value tweens on every
  update; floating reaction emoji rise-and-fade (`AnimatePresence` list).
- **Results**: staggered reveal, animated bar comparison for score, rating
  delta.
- **Reduced motion**: `useSettingsStore.reducedMotion` (defaults from
  `prefers-reduced-motion: reduce`) short-circuits `PageTransition` to an
  instant swap and is checked before the View Transition theme wipe; a
  global CSS block also forces near-zero animation durations as a hard
  floor for anything that doesn't check the flag explicitly.

**Not implemented (flagged, not silently dropped):**
- GPU-pooled canvas particle bursts on word completion (spec: 12–18
  sparks). The current "reward" moment is the spring/opacity fill + SFX
  only — a real particle system needs its own render loop and object pool,
  which didn't fit this pass.
- Automatic blur/particle reduction when the `requestAnimationFrame` budget
  is exceeded (an actual perf-adaptive quality knob, not just the static
  reduced-motion flag).
- Conic-gradient rotating border on the active word's tiles (currently a
  static violet wash + cyan ring on the active cell instead).

## Accessibility

- `role="grid"` on the crossword container, `aria-rowindex`/`aria-colindex`
  on cells, `aria-label` announcing each numbered cell.
- All interactive controls are real `<button>`s with visible
  `:focus-visible` outlines (2px solid neon-cyan, global in `index.css`).
- On-screen keyboard keys and nav items are ≥44px touch targets.
- Color is never the only signal: correct/incorrect/opponent states pair a
  color with position (which tile), an icon (💡/✓/✕), or text.
- `prefers-reduced-motion` is honored both at the CSS layer (global floor)
  and the JS layer (`PageTransition`, theme toggle).

**Not implemented:** screen-reader live-region announcements for clue
changes and score events, and a full keyboard-only navigation audit (arrow
keys currently rely on native tab order rather than custom RTL grid
arrow-key semantics). Flagged for the accessibility pass a real launch
needs.
