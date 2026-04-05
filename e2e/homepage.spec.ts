import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/badekshop/i);
  });

  test('should display hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /bali|esim|sim/i })).toBeVisible();
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /products/i })).toBeVisible();
  });
});
