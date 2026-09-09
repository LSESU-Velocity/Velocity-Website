import { expect, test } from '@playwright/test';
import { FLAGSHIP_INTEREST_FORM_URL } from '../../lib/eventsCatalog';

// Opt-in read-only smoke checks against Google. Kept out of CI so external
// network availability cannot make the deterministic regression suite flaky.
test.beforeEach(async ({ context }) => {
  await context.route('https://docs.google.com/forms/**/formResponse*', (route) => route.abort());
});

test('the live form is accessible directly without a Google account', async ({ page }) => {
  await page.goto(FLAGSHIP_INTEREST_FORM_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Submit', exact: true })).toBeVisible({ timeout: 20_000 });
  expect(await page.getByRole('textbox').count()).toBeGreaterThanOrEqual(3);
});

test('the live form renders within the production modal', async ({ page }) => {
  await page.goto('/privacy?interest=1', { waitUntil: 'domcontentloaded' });
  const embedded = page.frameLocator('dialog iframe');
  await expect(embedded.getByRole('button', { name: 'Submit', exact: true })).toBeVisible({ timeout: 20_000 });
  expect(await embedded.getByRole('textbox').count()).toBeGreaterThanOrEqual(3);
  await expect(page.getByRole('link', { name: 'Open form in new tab' })).toBeVisible();
});
