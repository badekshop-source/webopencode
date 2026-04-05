import { test, expect } from '@playwright/test';

test.describe('Products Page', () => {
  test('should load products page', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();
  });

  test('should display product listings', async ({ page }) => {
    await page.goto('/products');
    // Products are displayed in a grid, look for product names or price elements
    await expect(page.locator('text=/Bali Unlimited|Nano SIM/').first()).toBeVisible();
  });

  test('should have eSIM and SIM card options', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByRole('link', { name: 'eSIM', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Physical SIM' }).first()).toBeVisible();
  });

  test('should navigate to checkout from product', async ({ page }) => {
    await page.goto('/products');
    const buyButton = page.getByRole('button', { name: /buy|order|get started/i }).first();
    if (await buyButton.isVisible()) {
      await buyButton.click();
      await expect(page).toHaveURL(/checkout/);
    }
  });
});
