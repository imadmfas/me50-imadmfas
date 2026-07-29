# ASSETS.md — fonts, audio, and their licenses

## Fonts

All loaded via Google Fonts (`index.html`, `font-display: swap`), each under
the SIL Open Font License 1.1 (free for commercial use, no attribution
required beyond keeping the license notice with the font files themselves):

| Font | Role | License |
|---|---|---|
| [Cairo](https://fonts.google.com/specimen/Cairo) | Arabic display headings | OFL 1.1 |
| [Rubik](https://fonts.google.com/specimen/Rubik) | Body text (Latin + Arabic fallback) | OFL 1.1 |
| [IBM Plex Sans Arabic](https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic) | UI text, keyboard | OFL 1.1 |
| [Noto Naskh Arabic](https://fonts.google.com/noto/specimen/Noto+Naskh+Arabic) | Crossword grid letters (isolated-glyph legibility) | OFL 1.1 |

## Audio (SFX)

Every sound effect shipped in `apps/web/public/audio/` is **self-generated**
by `apps/web/scripts/generate-sfx.mjs` — plain sine/triangle/square wave
synthesis with a short attack/release envelope, written directly to WAV via
raw PCM buffers. No external samples, no copyrighted material, nothing to
license. Regenerate with:

```bash
cd apps/web && node scripts/generate-sfx.mjs
```

| File | Used for |
|---|---|
| `key.wav` | on-screen/physical keyboard tap (pitch-varied ±3% at playback) |
| `correct.wav` | a correct letter |
| `wrong.wav` | a rejected/incorrect submission |
| `wordComplete.wav` | finishing a word |
| `hint.wav` | using a hint |
| `opponentScored.wav` | the opponent completes a word (quieter, distinct) |
| `tick.wav` | countdown ticks in the match's final seconds |
| `matchFound.wav` | matchmaking success |
| `victory.wav` / `defeat.wav` | results screen |

**Known gap:** the product spec calls for three seamless ambient **music**
loops (lobby / match / results) with a Howler-based crossfading mixer. The
mixer plumbing (`AudioMixer`, volume sliders, mute) is built and ready, but
no music loops are shipped — synthesizing a convincing ambient bed
procedurally is a much bigger lift than short SFX stings, and licensing real
royalty-free tracks requires a human pass on license terms per track. Treat
this as the next content task: drop three loop files into
`apps/web/public/audio/` (e.g. `lobby.mp3`, `match.mp3`, `results.mp3`),
document their license here, and wire them into `AudioMixer`.

## App icon

`apps/web/public/icon.svg` is an original, hand-authored SVG (simple neon
tile motif) — not a photo, not a font glyph, no external asset. Manifest
icons currently reference this single SVG for all sizes/purposes. Production
should export real PNG rasters at the standard PWA sizes (192×192, 512×512,
plus a maskable-safe-zone variant) — SVG-only manifest icons work in
Chromium/Firefox but Safari's PWA install flow is pickier about raster PNGs.
