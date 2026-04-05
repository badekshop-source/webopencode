import { test, expect } from '@playwright/test';

test.describe('Order Tracking', () => {
  test('should load track order page', async ({ page }) => {
    await page.goto('/track-order');
    await expect(page.getByRole('heading', { name: /track|order/i })).toBeVisible();
  });

  test('should display tracking form', async ({ page }) => {
    await page.goto('/track-order');
    await expect(page.getByRole('textbox').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /track/i })).toBeVisible();
  });

  test('should show error for non-existent order', async ({ page }) => {
    await page.goto('/track-order');
    await page.getByRole('textbox').first().fill('nonexistent-order');
    await page.getByRole('button', { name: /track/i }).click();
    await expect(page.getByText(/not found/i)).toBeVisible();
  });
});
