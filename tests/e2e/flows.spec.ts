import { test, expect } from '@playwright/test';

test.describe('Main user flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing service workers/caches between runs
    await page.context().addInitScript(() => {
      (async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map(r => r.unregister()));
          }
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
          }
        } catch {}
      })();
    });
  });

  test('Organizations → Org Detail → Actor Detail', async ({ page }) => {
    await page.goto('/organizations');
    await expect(page.getByRole('heading', { name: 'Organizations' })).toBeVisible();

    // Click the first visible organization card
    const orgCards = page.locator('button:has(.text-slate-900)');
    await expect(orgCards.first()).toBeVisible();
    await orgCards.first().click();

    // Org detail page: members and heading present
    await expect(page.getByRole('heading', { name: /Members/i })).toBeVisible();

    // Try to find a member link; if not present (empty org), go back and try the next org
    let memberLink = page.locator('a[href^="/actors/"]').first();
    if (!(await memberLink.isVisible({ timeout: 3000 }).catch(() => false))) {
      await page.goBack();
      await orgCards.nth(1).click();
      await expect(page.getByRole('heading', { name: /Members/i })).toBeVisible();
      memberLink = page.locator('a[href^="/actors/"]').first();
    }
    await expect(memberLink).toBeVisible();
    await memberLink.click();

    // Actor detail: back link visible and name present
    await expect(page.getByRole('link', { name: /Back to Actors/i })).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Actors list → Actor Detail', async ({ page }) => {
    await page.goto('/actors');
    // Click first actor card
    const firstActor = page.locator('a[href^="/actors/"]').first();
    await firstActor.click();
    await expect(page.getByRole('link', { name: /Back to Actors/i })).toBeVisible();
  });

  test('Search flow', async ({ page }) => {
    await page.goto('/search?q=');
    // Prefer the page search input (not navbar) by scoping to main content
    const input = page.locator('main input[placeholder="Search by name, role, company..."]');
    await input.first().fill('a'); // minimal to trigger results
    await page.waitForTimeout(300);
    const result = page.locator('a[href^="/actors/"]').first();
    await expect(result).toBeVisible();
    await result.click();
    await expect(page.getByRole('link', { name: /Back to Actors/i })).toBeVisible();
  });
});


