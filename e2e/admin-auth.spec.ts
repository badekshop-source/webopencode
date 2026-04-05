import { test, expect } from '@playwright/test';

test.describe('Admin Auth', () => {
  test('should redirect to admin login when accessing admin without auth', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/admin\/login/);
  });

  test('should load admin login page', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByRole('heading', { name: /admin|login/i })).toBeVisible();
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel(/email/i).fill('invalid@test.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible();
  });
});
