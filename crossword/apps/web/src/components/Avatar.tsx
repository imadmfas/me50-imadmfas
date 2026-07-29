const NEON_PALETTE = ['#22D3EE', '#A855F7', '#A3E635', '#FB7185', '#38BDF8', '#F472B6'];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic geometric neon avatar generated from a hash seed (username-derived) — no external service. */
export function Avatar({ seed, size = 48 }: { seed: string; size?: number }) {
  const h = hashString(seed);
  const colorA = NEON_PALETTE[h % NEON_PALETTE.length];
  const colorB = NEON_PALETTE[(h >> 3) % NEON_PALETTE.length];
  const rotation = h % 360;
  const shapeSeed = (h >> 6) % 3;

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="صورة رمزية">
      <defs>
        <linearGradient id={`grad-${h}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colorA} />
          <stop offset="100%" stopColor={colorB} />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="#0B0E1F" />
      <g transform={`rotate(${rotation} 24 24)`}>
        {shapeSeed === 0 && <rect x="10" y="10" width="28" height="28" rx="8" fill={`url(#grad-${h})`} opacity="0.9" />}
        {shapeSeed === 1 && <circle cx="24" cy="24" r="15" fill={`url(#grad-${h})`} opacity="0.9" />}
        {shapeSeed === 2 && <polygon points="24,8 40,40 8,40" fill={`url(#grad-${h})`} opacity="0.9" />}
      </g>
    </svg>
  );
}
