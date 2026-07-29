# CONTENT.md — the word bank

## What's shipped vs. the target

The product spec asks for a 1,200-entry bank (500 easy / 450 medium / 250
hard, ≤15% per category across 14 categories). This build ships a **111-entry
curated starter set** — a representative, quality-first slice, not the full
target. It is meant to prove the pipeline (content → validated build →
generator → live puzzle) end-to-end, not to be the final content library.

Actual shipped distribution (`pnpm --filter @anc/shared run build:wordbank`
prints this on every build):

- By difficulty: 64 easy · 31 medium · 16 hard
- By category: 7–9 entries each across physics, chemistry, biology,
  medicine, astronomy, mathematics, logic, linguistics, philosophy,
  geography, history, computing, economics, law — every category comfortably
  under the 15% cap.

The difficulty split skews easier than the target 42/37/21% split. That's a
direct consequence of prioritizing entries I could source and phrase with
real confidence in this pass; reaching the target ratio is content work, not
an engineering blocker — see "Growing the bank" below.

## Source of truth and the build pipeline

Human-authored content lives in
`packages/shared/src/wordbank/raw.ts` (`answer`, `clue`, `category`,
`difficulty`, `factCard`, `source`, `verified`, `tags` — nothing else).
**`answerNormalized` and `length` are never hand-typed.** They're computed by
`packages/shared/scripts/build-wordbank.ts` from the same normalizer the
generator and match validator use, so a miscounted Arabic letter can't ship
silently. That script also enforces, and fails the build on:

- length outside the assigned difficulty's range (easy 3–5, medium 5–7, hard 6–10)
- duplicate normalized answers anywhere in the bank
- duplicate clue text anywhere in the bank (a coarse `clue_ambiguity_check` —
  see "Ambiguity checking" below for what it doesn't catch)
- any category exceeding 15% of the shipped (verified) bank

Run it after editing content:

```bash
pnpm --filter @anc/shared run build:wordbank
```

It writes `packages/shared/src/wordbank/wordbank.json`, which
`apps/server/prisma/seed.ts` loads into the `WordEntry` table.

## Verification policy

Every shipped entry states a mainstream, textbook-level fact with a named
reference (a specific classic text — e.g. *الخصائص*, ابن جني; a widely used
textbook — e.g. Halliday & Resnick, Campbell Biology, Chang's *Chemistry*; or
an institutional source — NASA, USGS, the Arabic Language Academy in Cairo's
*المعجم الوسيط*, Encyclopaedia Britannica). None are invented, and none cite a
source I couldn't actually point to. That said, sources here are cited at
the **reference-work level** (title/publisher/organization), not
pinpoint-cited to a specific edition and page number — that level of rigor
needs a subject-matter editor with the physical or licensed digital text in
hand, which is outside what an AI-authored content pass can respectably
claim. **Before a public launch, get a domain-expert editorial pass on every
entry against a specific edition**, particularly for the `hard` tier where
clues lean on derivational/etymological subtlety.

Any entry I wasn't confident enough to stand behind was left out rather than
shipped with `verified: false` filler — the build script already excludes
unverified entries from the seed, so `raw.ts` contains no dead weight.

## Difficulty rubric (encoded, not vibes)

From `packages/shared/src/constants.ts`:

- **Easy** — 3–5 letters, high-frequency term, direct definitional clue.
- **Medium** — 5–7 letters, specialist term, one inferential step.
- **Hard** — 6–10 letters, precise technical term, formal-definition or
  derivational/etymological clue.

The generator (`packages/shared/src/generator.ts`) filters candidates by
these length bounds per difficulty before placing them, so a grid never
mixes a hard-tier answer into an easy puzzle.

## Ambiguity checking

`build-wordbank.ts`'s `clue_ambiguity_check` is a coarse pass: it only
catches two entries sharing **identical clue text**. It does not (yet) catch
two *different* clues that could both plausibly point to the same answer, or
two different answers with the same length that a genuinely ambiguous clue
could fit — that requires either a semantic-similarity pass or per-puzzle
runtime validation (checking, for a given generated grid, whether any two
placed clues are cross-satisfiable). Flagged as a real gap, not silently
glossed over.

## Growing the bank toward 1,200

1. Add entries to `raw.ts` following the existing per-entry shape.
2. Run `build:wordbank` — fix anything it flags.
3. Re-run `pnpm --filter @anc/server run pregenerate-pool` (raise `POOL_SIZE`)
   so the larger word pool actually reaches players via cached grids.
4. Get the editorial/verification pass described above before flipping any
   new entries to `verified: true` in a production deploy.
