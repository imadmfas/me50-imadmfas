# Arabic Neon Crossword

An online, two-player, real-time Arabic crossword duel. Glassmorphism +
neon visual identity, RTL-correct Arabic word engineering, server-authoritative
multiplayer over Socket.IO, and a curated educational word bank (physics,
medicine, astronomy, logic, and more — each solved word teaches a real fact).

**Status: a working MVP vertical slice, not the full 1,200-entry /
production-scale spec.** See "What's built vs. what's stubbed" below for an
honest accounting — this README doesn't oversell it.

## Architecture

```
crossword/
├── apps/
│   ├── web/            React 18 + TS + Vite + Tailwind + Zustand + Framer Motion
│   │                    Socket.IO client, Howler audio, PWA shell
│   └── server/          Node + Express + Socket.IO, Prisma (SQLite dev / Postgres prod)
│                         matchmaking, server-authoritative match engine, REST API
├── packages/
│   └── shared/           Types, Arabic normalizer, crossword generator, word bank,
│                          scoring/Elo constants — imported by both apps and by
│                          apps/server's Prisma seed script
├── e2e/                   Playwright: one full two-browser-context match test
├── docker-compose.yml     Optional Postgres for local dev
├── ASSETS.md / CONTENT.md / DESIGN.md
└── README.md              (this file)
```

```
┌─────────────┐   REST (cookies)    ┌──────────────┐
│  apps/web    │ ──────────────────▶│  apps/server │
│  (Vite dev   │                     │  (Express)   │
│   server /   │   Socket.IO (WS)    │              │
│   static     │ ◀──────────────────▶│  matchmaking │
│   host)      │                     │  match engine│
└─────────────┘                     │  Prisma ORM  │
                                      └──────┬───────┘
                                             │
                                      ┌──────▼───────┐
                                      │ SQLite (dev) │
                                      │ / Postgres   │
                                      │  (prod)      │
                                      └──────────────┘
```

The generator (`packages/shared/src/generator.ts`) and the Arabic normalizer
(`packages/shared/src/normalizer.ts`) are the two pieces most crossword
engines get wrong for Arabic — see their doc comments and
`packages/shared/src/normalizer.test.ts` for the specific rules encoded
(alif-variant collapsing, ة/ه and ى/ي equivalence, diacritic/tatweel
stripping, لا always two cells, RTL-native grid coordinates).

## Local setup

Requires Node ≥20 and pnpm.

```bash
git clone <repo>
cd crossword
pnpm install

cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env

# SQLite by default — zero external services needed for local dev.
pnpm --filter @anc/server run prisma:generate
pnpm --filter @anc/server run seed              # loads the word bank + bot account
pnpm --filter @anc/server run pregenerate-pool  # caches ~25 grids/difficulty

pnpm --filter @anc/server dev    # http://localhost:4000
pnpm --filter @anc/web dev       # http://localhost:5173
```

Open two browser windows (or profiles) at `localhost:5173` to play a real
match against yourself, or use the bot: queue up and wait ~45s (or just
watch for the "practice bot" offer) to play against the server-side bot.

### Running the tests

```bash
pnpm --filter @anc/shared test    # normalizer + generator unit tests (25)
pnpm --filter @anc/server test    # match engine unit tests + Supertest API tests (13)
pnpm --filter @anc/web test       # component tests (4)

# E2E — needs both dev servers running (above) first:
cd e2e && pnpm install && pnpm exec playwright test
```

The E2E test spins up **two real browser contexts**, registers two users,
matchmakes them together, and collaboratively solves every word in a shared
live grid using the actual UI (on-screen keyboard clicks) end to end,
verifying both land on the results screen. It pulls the answer key through a
test-only debug endpoint (`apps/server/src/routes/debug.ts`, mounted only
when `NODE_ENV !== 'production'`) so it doesn't need a human typing answers —
that's the only thing standing between this and a fully scriptless human
playtest.

### Switching to Postgres for production

`apps/server/prisma/schema.prisma` defaults to `provider = "sqlite"` for
zero-setup local dev. For production:

1. Change the datasource block:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Point `DATABASE_URL` at your Postgres instance (Supabase/Neon both work
   — `docker-compose.yml` also spins up a local Postgres if you want to
   test the switch before deploying).
3. Run `prisma db push` (or write a real migration with `prisma migrate dev`).
4. Optional but recommended: promote `username_key` to `CITEXT` via a raw
   SQL migration for belt-and-suspenders case-insensitive uniqueness at the
   DB layer (the app already normalizes case/diacritics before comparing,
   so this is defense in depth, not a functional requirement).

SQLite doesn't support native enums or scalar arrays, which is why the
schema uses `String` fields (validated by Zod at the app boundary) instead
of Prisma `enum`/`String[]` — this keeps one schema file working on both
engines with a single provider-line change.

## Environment variables

See `apps/server/.env.example` and `apps/web/.env.example` for the full,
documented list. Nothing sensitive ships with real values — the example
files use obvious placeholders.

## Deployment

- **`apps/web`**: static Vite build (`pnpm --filter @anc/web build` →
  `apps/web/dist`) — deploy to Vercel, Netlify, or any static host. Set
  `VITE_API_URL` to your deployed server's origin.
- **`apps/server`**: `pnpm --filter @anc/server build && pnpm --filter @anc/server start`
  — deploy to Railway/Render/Fly, or any Node host. Needs `DATABASE_URL`
  (Postgres in production — see above), `JWT_ACCESS_SECRET`/
  `JWT_REFRESH_SECRET` (generate real random values, never reuse the dev
  defaults), and `CORS_ORIGIN` set to your deployed web origin.
- Web Push (VAPID) and email fallback (Resend) are both optional and
  degrade gracefully when unconfigured — see "What's built vs. stubbed."

## Scaling matchmaking: multi-instance Socket.IO

The current matchmaking queue and match state (`apps/server/src/game/
matchmaking.ts`, `matchEngine.ts`) live **entirely in a single process's
memory** (`Map`s in `socketGateway.ts`). That's correct and simple for one
server instance, and it's the honest reason this isn't "production-scale" as
shipped: it does not survive a restart, and it cannot run behind a load
balancer with more than one server instance — two players connecting to
different instances would never find each other.

The documented path to fix this (not yet implemented):

1. **Socket.IO Redis adapter** (`@socket.io/redis-adapter`) so `io.to(matchId).emit(...)`
   fans out correctly across instances — this alone fixes cross-instance
   room broadcast, but not matchmaking pairing or match-state ownership.
2. **Externalize the matchmaking queue** into Redis (a sorted set per
   difficulty, score = join time, with rating stored alongside) so any
   instance's sweep can see the full queue, not just its own process's.
3. **Externalize match state** the same way, or — simpler — use **sticky
   sessions** (route a given socket connection to the same instance for the
   lifetime of a match, e.g. via the load balancer hashing on a session/
   matchId cookie) so match state can stay in-process per-match while only
   the queue and pub/sub for cross-instance events go through Redis.
4. Move the matchmaking sweep's `setInterval` to a single elected
   instance (or a lightweight distributed lock) so pairing isn't attempted
   redundantly by every instance every 2s.

Given the in-memory design's clean separation (`Matchmaker` and
`MatchState` are already plain, dependency-injectable classes/objects with
no direct coupling to a specific process), step 2–3 are a genuine refactor
but not a rewrite — the `MatchState` shape and the `submitWord`/`requestHint`
pure functions in `matchEngine.ts` don't need to change at all; only where
they're read from and stored does.

## What's built vs. what's stubbed

Built and tested end-to-end (not just wired, actually verified working):
Arabic normalizer, RTL crossword generator (deterministic, seeded, pool
pre-caching), 111-entry verified word bank, username claim with live
availability + atomic DB-constraint-backed uniqueness, JWT cookie auth,
Socket.IO matchmaking with expanding rating windows + practice-bot fallback,
server-authoritative scoring/hints/timers on a **shared** grid (both players
race to fill the same puzzle — see `matchEngine.ts`), reconnection window,
Elo rating updates, Daily Challenge (solo, deterministic per-day seed,
its own leaderboard), all 11 screens, glass/neon design system, dark/light/
system theming with an animated View-Transitions wipe, self-synthesized SFX
+ a full Howler volume-mixer, on-screen + physical Arabic keyboard, PWA
manifest + offline-shell service worker, the mandatory developer-attribution
page, and a genuinely useful test suite (42 unit/integration tests across
three packages + one full dual-browser-context E2E match) — see the "unit
tests caught two real bugs" note below.

Stubbed or simplified, on purpose, and documented in-line where it matters:

- **Content scale**: 111 words shipped vs. the 1,200-entry target (see
  CONTENT.md).
- **Multi-instance scaling**: in-memory matchmaking/match state, single
  process only (see "Scaling matchmaking" above).
- **Push notifications**: full infrastructure exists (VAPID subscribe/
  unsubscribe endpoints, service worker push handler, an hourly
  inactivity-check cron with the day-1/3/7/14 escalation ladder and a
  10-message rotation pool) but is **inert without VAPID keys** — nobody
  configured a real deployment to test delivery against. Generate keys with
  `npx web-push generate-vapid-keys` and set them in `apps/server/.env` to
  light it up.
- **Email fallback (Resend)**: not implemented — only the env var placeholder
  exists.
- **Learn / spaced repetition**: works, but history is stored in
  `localStorage` per-device (see `apps/web/src/lib/learnHistory.ts`), not
  synced server-side — the Prisma schema (`MoveLog`, `MatchPlayer`) already
  has what's needed to move this server-side.
- **Achievements/XP/leveling**: schema and a handful of seeded achievement
  rows exist; the logic that actually *awards* them on match completion
  isn't wired up yet — `User.xp`/`level` stay at their defaults.
- **Motion polish**: canvas particle bursts and the FPS-adaptive quality
  knob described in the spec aren't implemented (see DESIGN.md).
- **Accessibility**: solid baseline (grid ARIA roles, focus rings, reduced
  motion, 44px touch targets) but no screen-reader live-region announcements
  or custom RTL arrow-key grid navigation yet (see DESIGN.md).
- **Music loops**: SFX are real (self-synthesized); ambient music loops are
  not shipped (see ASSETS.md).

### A concrete example of why the test suite matters

Writing the match-engine unit tests caught a real solution-leak bug before
this reached anyone: `toSnapshot()`'s `{...match.grid, words: [...]}` spread
was shipping the entire `solutionByCell` answer key to every connected
client, because spreading an object only overrides the keys you name — it
doesn't strip anything you forgot to mention. The fix
(`stripSolution()` — a helper that already existed in `packages/shared` for
exactly this purpose) is one line; the test that caught it is
`toSnapshot > never leaks solution letters for unsolved cells` in
`apps/server/src/game/matchEngine.test.ts`. The same bug pattern existed a
second time in the pool-caching code path (`gridJson` in both
`socketGateway.ts` and `scripts/pregenerate-pool.ts`) and got the same fix.
That's not a hypothetical "tests are good practice" — it's the actual
timeline of this build.
