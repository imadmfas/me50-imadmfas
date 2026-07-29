import { Router } from 'express';
import { getActiveMatch } from '../game/socketGateway.js';

/**
 * TEST-ONLY escape hatch so the Playwright E2E suite can complete a full
 * match without a human typing every answer. Never mounted when
 * NODE_ENV=production — see index.ts. Returns the answer letters for every
 * word in an active match; this would be a solution leak in production,
 * which is exactly why it's gated.
 */
export const debugRouter = Router();

debugRouter.get('/solution/:matchId', (req, res) => {
  const match = getActiveMatch(req.params.matchId);
  if (!match) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  res.json({
    words: match.grid.words.map((w) => ({
      entryId: w.entryId,
      letters: w.letters,
    })),
  });
});
