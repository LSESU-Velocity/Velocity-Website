import { expect, test, type Page } from '@playwright/test';
import { FLAGSHIP_INTEREST_FORM_URL } from '../../lib/eventsCatalog';

const FORM_PATTERN = 'https://docs.google.com/forms/**';
const formHtml = `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body><h1>Test interest form</h1><form method="post" action="${FLAGSHIP_INTEREST_FORM_URL.replace('/viewform', '/formResponse')}">
    <label>Full name <input name="name" required autocomplete="name"></label>
    <label>Email <input name="email" type="email" required autocomplete="email"></label>
    <button type="submit">Submit interest</button>
  </form></body></html>`;
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Register your interest' });
const frame = (page: Page) => page.frameLocator('dialog iframe');
const banner = (page: Page) => page.getByRole('button', { name: /Register your interest/ });
const close = (page: Page) => page.getByRole('button', { name: 'Close interest form' });

test.beforeEach(async ({ context }) => {
  // No test writes to the live response sheet or depends on Google's uptime.
  await context.route(FORM_PATTERN, async (route) => {
    await route.fulfill({ contentType: 'text/html', body: formHtml });
  });
  await context.route(/https:\/\/(fonts\.(googleapis|gstatic)\.com|images\.unsplash\.com)\//, (route) => route.abort());
});

test('opens on demand, preserves URLs, and cleans up repeated closes', async ({ page }) => {
  await page.goto('/privacy?utm_source=test&campaign=a%2Bb#details');
  await expect(page.locator('iframe')).toHaveCount(0);
  for (let attempt = 0; attempt < 3; attempt++) {
    await banner(page).click();
    await expect(dialog(page)).toBeVisible();
    await expect(frame(page).getByLabel('Full name')).toBeVisible();
    await expect(page.locator('dialog iframe')).toHaveCount(1);
    expect(new URL(page.url()).hash).toBe('#details');
    expect(new URL(page.url()).searchParams.get('campaign')).toBe('a+b');
    await close(page).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(banner(page)).toBeFocused();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
    await expect(page.locator('#root')).not.toHaveAttribute('aria-hidden', 'true');
    await expect(page).toHaveURL('/privacy?utm_source=test&campaign=a%2Bb#details');
  }
});

test('deep links, reload, back and forward retain a working modal', async ({ page }) => {
  await page.goto('/privacy?utm_source=social');
  await banner(page).click();
  await page.reload();
  await expect(frame(page).getByLabel('Email')).toBeVisible();
  await page.goBack();
  await expect(dialog(page)).toHaveCount(0);
  await page.goForward();
  await expect(frame(page).getByLabel('Email')).toBeVisible();
  await close(page).click();
  await expect(page).toHaveURL('/privacy?utm_source=social');
});

test('a stalled embed times out, retries manually and accepts a late load', async ({ page }) => {
  const releases: Array<() => void> = [];
  let requests = 0;
  await page.route(FORM_PATTERN, async (route) => {
    requests++;
    await new Promise<void>((resolve) => releases.push(resolve));
    await route.fulfill({ contentType: 'text/html', body: formHtml }).catch(() => {});
  });
  await page.clock.install();
  await page.goto('/privacy?interest=1', { waitUntil: 'domcontentloaded' });
  await expect(dialog(page)).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Loading the form');
  await page.clock.fastForward(12_001);
  await expect(page.getByRole('status')).toContainText('taking longer');
  await expect(page.getByRole('link', { name: 'Open form in new tab' })).toBeVisible();
  await page.getByRole('button', { name: 'Retry form' }).click();
  await expect(page.getByRole('status')).toContainText('Loading the form');
  await expect.poll(() => requests).toBe(2);
  releases.forEach((release) => release());
  await expect(frame(page).getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('status')).not.toContainText('taking longer');
});

test('a network-blocked embed always offers both direct navigation options', async ({ page }) => {
  await page.route(FORM_PATTERN, (route) => route.abort('blockedbyclient'));
  await page.goto('/privacy?interest=1');
  const newTab = page.getByRole('link', { name: 'Open form in new tab' });
  await expect(newTab).toBeVisible();
  await expect(newTab).toHaveAttribute('href', FLAGSHIP_INTEREST_FORM_URL);
  await expect(newTab).toHaveAttribute('target', '_blank');
  await expect(newTab).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.getByRole('link', { name: 'Open in this tab' })).toHaveAttribute('href', FLAGSHIP_INTEREST_FORM_URL);
  await close(page).click();
  await expect(dialog(page)).toHaveCount(0);
});

test('frame-policy rejection cannot hide the recovery controls', async ({ page }) => {
  await page.route(FORM_PATTERN, (route) => route.fulfill({
    contentType: 'text/html', body: 'Embedding denied', headers: { 'Content-Security-Policy': "frame-ancestors 'none'" },
  }));
  await page.goto('/privacy?interest=1');
  await expect(page.getByRole('link', { name: 'Open form in new tab' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry form' })).toBeVisible();
  await expect(page.getByRole('status')).not.toContainText(/success|submitted|ready/i);
});

test('direct links navigate without a script popup', async ({ page, context }) => {
  await page.goto('/privacy?interest=1');
  const popupPromise = context.waitForEvent('page');
  await page.getByRole('link', { name: 'Open form in new tab' }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(FLAGSHIP_INTEREST_FORM_URL);
  await popup.close();
  await expect(dialog(page)).toBeVisible();
  await page.getByRole('link', { name: 'Open in this tab' }).click();
  await expect(page).toHaveURL(FLAGSHIP_INTEREST_FORM_URL);
});

test('offline/online transitions preserve entered answers and never auto-reload', async ({ page, context }) => {
  let requests = 0;
  await page.route(FORM_PATTERN, (route) => {
    requests++;
    return route.fulfill({ contentType: 'text/html', body: formHtml });
  });
  await page.goto('/privacy?interest=1');
  await frame(page).getByLabel('Full name').fill('Test Builder');
  await context.setOffline(true);
  await expect(page.getByRole('status')).toContainText('offline');
  await context.setOffline(false);
  await expect(page.getByRole('status')).not.toContainText('offline');
  await expect(frame(page).getByLabel('Full name')).toHaveValue('Test Builder');
  expect(requests).toBe(1);
});

test('validation and submission stay inside the iframe without reloading it', async ({ page }) => {
  const submissions: string[] = [];
  await page.route(FORM_PATTERN, (route) => {
    if (route.request().method() === 'POST') {
      submissions.push(route.request().postData() ?? '');
      return route.fulfill({ contentType: 'text/html', body: '<h1>Interest received</h1>' });
    }
    return route.fulfill({ contentType: 'text/html', body: formHtml });
  });
  await page.goto('/privacy?interest=1');
  await frame(page).getByRole('button', { name: 'Submit interest' }).click();
  expect(submissions).toHaveLength(0);
  await frame(page).getByLabel('Full name').fill('Test Builder');
  await frame(page).getByLabel('Email').fill('invalid-email');
  await frame(page).getByRole('button', { name: 'Submit interest' }).click();
  expect(submissions).toHaveLength(0);
  await frame(page).getByLabel('Email').fill('browser-test@example.invalid');
  await frame(page).getByRole('button', { name: 'Submit interest' }).click();
  await expect(frame(page).getByRole('heading', { name: 'Interest received' })).toBeVisible();
  expect(submissions).toHaveLength(1);
  await expect(dialog(page)).toBeVisible();
  await expect(page.getByRole('status')).not.toContainText('Loading');
});

test('Escape only closes the top modal and releases stacked scroll locks', async ({ page }) => {
  await page.goto('/events?event=global-build-2027&utm_source=test&interest=1');
  await expect(dialog(page)).toBeVisible();
  await close(page).press('Escape');
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Close event brief' })).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  expect(new URL(page.url()).searchParams.get('event')).toBe('global-build-2027');
  await page.getByRole('button', { name: 'Register interest', exact: true }).click();
  await close(page).click();
  await page.getByRole('button', { name: 'Close event brief' }).click();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

test('focus cycles within the modal and the close control stays keyboard accessible', async ({ page }) => {
  await page.goto('/privacy?interest=1');
  await expect(close(page)).toBeFocused();
  await close(page).press('Shift+Tab');
  await expect(page.getByRole('link', { name: 'Need help? Email us' })).toBeFocused();
  await page.getByRole('link', { name: 'Need help? Email us' }).press('Tab');
  await expect(close(page)).toBeFocused();
  await frame(page).getByLabel('Full name').fill('Keyboard visitor');
  await frame(page).getByRole('button', { name: 'Submit interest' }).press('Tab');
  // WebKit can skip links according to the platform's keyboard-navigation
  // preference. Either way, leaving the frame must reach the modal's controls.
  await expect.poll(() => dialog(page).evaluate((element) => {
    const focused = document.activeElement;
    return element.contains(focused) && focused?.tagName !== 'IFRAME';
  })).toBe(true);
});

test('older webviews without native dialog support still expose the form and close', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { value: undefined, configurable: true });
  });
  await page.goto('/privacy?interest=1');
  await expect(dialog(page)).toBeVisible();
  await expect(frame(page).getByLabel('Email')).toBeVisible();
  await close(page).press('Escape');
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.locator('#root')).not.toHaveAttribute('inert', '');
});

test('homepage image loading cannot delay a deep-linked form', async ({ page }) => {
  await page.route('**/webp-sequence/**', (route) => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?interest=1', { waitUntil: 'domcontentloaded' });
  await expect(dialog(page)).toHaveCSS('opacity', '1');
  await expect(frame(page).getByLabel('Email')).toBeVisible();
  await expect(page.locator('dialog iframe')).toHaveCSS('filter', 'none');
});

test('small portrait and landscape viewports keep the form and recovery reachable', async ({ page }, testInfo) => {
  await page.goto('/privacy?interest=1');
  for (const viewport of [{ width: 320, height: 568 }, { width: 667, height: 375 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await expect(close(page)).toBeInViewport();
    await expect(page.getByRole('link', { name: 'Open form in new tab' })).toBeInViewport();
    const bounds = await page.locator('dialog iframe').boundingBox();
    expect(bounds?.width).toBeGreaterThan(250);
    expect(bounds?.height).toBeGreaterThan(150);
    expect(await dialog(page).evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  await page.screenshot({ path: testInfo.outputPath('interest-mobile.png') });
});

test('the initial HTML provides a form link with JavaScript disabled', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/?interest=1`);
  await expect(page.getByRole('link', { name: 'Open interest form' })).toHaveAttribute('href', FLAGSHIP_INTEREST_FORM_URL);
  await expect(page.getByRole('link', { name: 'Open interest form' })).toBeVisible();
  await context.close();
});

test('a failed app bundle still leaves a direct registration link', async ({ page }) => {
  await page.route('**/assets/*.js', (route) => route.abort());
  await page.goto('/?interest=1');
  await expect(page.getByRole('link', { name: 'Open interest form' })).toBeVisible();
});
