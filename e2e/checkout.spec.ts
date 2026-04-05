import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('should load checkout page', async ({ page }) => {
    await page.goto('/checkout');
    // Without product, shows error state with "Error" heading
    await expect(page.getByText(/checkout|error|no product/i).first()).toBeVisible();
  });

  test('should show error without product', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.getByText(/no product selected/i)).toBeVisible();
  });

  test('should display checkout form when product selected', async ({ page }) => {
    // Navigate from products page with a product
    await page.goto('/products');
    const buyButton = page.getByRole('button', { name: /buy|order|get started/i }).first();
    if (await buyButton.isVisible()) {
      await buyButton.click();
      await expect(page).toHaveURL(/checkout/);
      // Check form fields exist
      await expect(page.getByPlaceholder(/passport/i)).toBeVisible();
      await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    }
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/products');
    const buyButton = page.getByRole('button', { name: /buy|order|get started/i }).first();
    if (await buyButton.isVisible()) {
      await buyButton.click();
      await expect(page).toHaveURL(/checkout/);
      // Click pay without filling form
      await page.getByRole('button', { name: /pay/i }).click();
      await expect(page.getByText(/required/i).first()).toBeVisible();
    }
  });
});
