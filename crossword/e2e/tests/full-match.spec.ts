import { test, expect, type Page } from '@playwright/test';

async function registerPlayer(page: Page, username: string) {
  await page.goto('/');
  await page.getByText('متابعة').click();
  await page.getByText('متابعة').click();
  await page.getByText('ابدأ').click();
  await page.waitForURL('**/username');
  await page.getByPlaceholder('اسمك هنا').fill(username);
  await expect(page.getByText('متاح')).toBeVisible({ timeout: 5000 });
  await page.getByText('تأكيد الاسم').click();
  await page.waitForURL('**/home', { timeout: 10000 });
}

test('two players matchmake and complete a full match', async ({ browser }) => {
  test.setTimeout(150000);
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  const suffix = Date.now().toString().slice(-6);
  await registerPlayer(pageA, `لاعبأ_${suffix}`);
  await registerPlayer(pageB, `لاعبب_${suffix}`);

  // Both pick easy and queue up.
  await pageA.getByText('سهل').click();
  await pageB.getByText('سهل').click();
  await pageA.getByText('العب الآن').click();
  await pageB.getByText('العب الآن').click();

  await pageA.waitForURL('**/match', { timeout: 30000 });
  await pageB.waitForURL('**/match', { timeout: 30000 });

  // Grid renders and both players landed in the same match.
  await expect(pageA.getByRole('grid')).toBeVisible();
  await expect(pageB.getByRole('grid')).toBeVisible();

  const matchIdA = await pageA.waitForFunction(() => (window as unknown as { __ancMatchId?: string }).__ancMatchId, null, { timeout: 10000 });
  const matchId = await matchIdA.jsonValue();
  expect(matchId).toBeTruthy();

  // Pull the real solution via the test-only debug endpoint (never exposed
  // in production — see apps/server/src/routes/debug.ts) so this test can
  // drive a full, server-validated completion without a human typing answers.
  const solutionRes = await pageA.request.get(`http://localhost:4000/api/debug/solution/${matchId}`);
  expect(solutionRes.ok()).toBeTruthy();
  const { words } = (await solutionRes.json()) as { words: { entryId: string; letters: string[] }[] };
  expect(words.length).toBeGreaterThan(0);

  // The app auto-selects the first unsolved clue and auto-advances to the
  // next one the instant the selected word is solved (see useMatchStore's
  // onState handler), so clicking the on-screen keyboard is enough — no
  // need to click individual clues. Clicks (not synthesized keydown) are
  // used because Chromium's CDP-level key synthesis for Arabic codepoints
  // isn't reliably mapped to a `key` value the app's window keydown
  // handler can read; the on-screen keys are the robust path for the test,
  // while physical-keyboard support itself is exercised manually / documented.
  async function solveWord(page: Page, letters: string[]) {
    const keyboardGroup = page.getByRole('group', { name: 'لوحة المفاتيح العربية' });
    for (const letter of letters) {
      await keyboardGroup.getByText(letter, { exact: true }).click();
    }
  }

  // Alternate solving turns between the two players so both contribute —
  // exercises the shared-grid scoring path, not just one player's session.
  for (let i = 0; i < words.length; i++) {
    const solver = i % 2 === 0 ? pageA : pageB;
    await solveWord(solver, words[i].letters);
  }

  await Promise.all([
    pageA.waitForURL('**/results', { timeout: 30000 }),
    pageB.waitForURL('**/results', { timeout: 30000 }),
  ]);

  await expect(pageA.getByText(/فزت|خسرت|تعادل/)).toBeVisible();
  await expect(pageB.getByText(/فزت|خسرت|تعادل/)).toBeVisible();

  await contextA.close();
  await contextB.close();
});
