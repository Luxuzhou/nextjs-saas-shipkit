import { test, expect } from '@playwright/test';

test.describe('Forgot Password', () => {
  test('forgot password page loads', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page).toHaveURL(/forgot-password/);
  });

  test('forgot password page has email input', async ({ page }) => {
    await page.goto('/forgot-password');
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
  });

  test('forgot password page has submit button', async ({ page }) => {
    await page.goto('/forgot-password');
    const submitButton = page.getByRole('button');
    await expect(submitButton.first()).toBeVisible();
  });

  test('forgot password page has link back to sign-in', async ({ page }) => {
    await page.goto('/forgot-password');
    const signInLink = page.getByRole('link', { name: /sign in|back|login/i });
    await expect(signInLink).toBeVisible();
  });

  test('forgot password form submission with empty email shows error or stays on page', async ({ page }) => {
    await page.goto('/forgot-password');
    const submitButton = page.getByRole('button').first();
    await submitButton.click();
    // Should stay on the forgot-password page or show validation
    await expect(page).toHaveURL(/forgot-password/);
  });

  test('reset password page loads', async ({ page }) => {
    await page.goto('/reset-password');
    // The page may redirect or show a form - both are valid
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });
});
