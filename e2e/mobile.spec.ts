import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  test('homepage should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /bali|esim|sim/i })).toBeVisible();
  });

  test('products page should work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/products');
    await expect(page.locator('text=/Bali Unlimited|Nano SIM/').first()).toBeVisible();
  });

  test('checkout form should be usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/products');
    const buyButton = page.getByRole('button', { name: /buy|order|get started/i }).first();
    if (await buyButton.isVisible()) {
      await buyButton.click();
      await expect(page).toHaveURL(/checkout/);
      await expect(page.getByPlaceholder(/passport/i)).toBeVisible();
    }
  });
});
