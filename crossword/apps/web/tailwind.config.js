/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        glass: {
          fill: 'var(--glass-fill)',
          stroke: 'var(--glass-stroke)',
        },
        neon: {
          cyan: 'var(--neon-cyan)',
          violet: 'var(--neon-violet)',
          lime: 'var(--neon-lime)',
          rose: 'var(--neon-rose)',
        },
        text: {
          hi: 'var(--text-hi)',
          lo: 'var(--text-lo)',
        },
      },
      fontFamily: {
        display: ['"Cairo"', '"IBM Plex Sans Arabic"', 'sans-serif'],
        body: ['"Rubik"', '"IBM Plex Sans Arabic"', 'sans-serif'],
        grid: ['"Noto Naskh Arabic"', '"IBM Plex Sans Arabic"', 'sans-serif'],
      },
      backdropBlur: {
        glass: '22px',
      },
      boxShadow: {
        'neon-cyan': '0 0 12px rgba(34,211,238,0.55), 0 0 32px rgba(34,211,238,0.25)',
        'neon-violet': '0 0 12px rgba(168,85,247,0.55), 0 0 32px rgba(168,85,247,0.25)',
        'neon-lime': '0 0 12px rgba(163,230,53,0.55), 0 0 32px rgba(163,230,53,0.25)',
        'neon-rose': '0 0 12px rgba(251,113,133,0.55), 0 0 32px rgba(251,113,133,0.25)',
        glass: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
      },
    },
  },
  plugins: [],
};
