import { test, expect } from '@playwright/test';

test.describe('Authentication Pages', () => {
  test('sign-in page loads', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page).toHaveURL(/sign-in/);
    // The page should contain a form with email and password fields
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('sign-up page loads', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page).toHaveURL(/sign-up/);
    // The page should contain a sign-up form
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('sign-in page has link to sign-up', async ({ page }) => {
    await page.goto('/sign-in');
    const signUpLink = page.getByRole('link', { name: /sign up|create account|register/i });
    await expect(signUpLink).toBeVisible();
  });

  test('sign-up page has link to sign-in', async ({ page }) => {
    await page.goto('/sign-up');
    const signInLink = page.getByRole('link', { name: /sign in|log in|login/i });
    await expect(signInLink).toBeVisible();
  });

  test('sign-in form submission shows validation or redirects', async ({ page }) => {
    await page.goto('/sign-in');
    // Submit with empty fields to test form validation
    const submitButton = page.getByRole('button', { name: /sign in|log in|login/i });
    await submitButton.click();
    // Either stays on sign-in page or shows validation
    // We just confirm the page doesn't crash
    await expect(page).toHaveURL(/sign-in/);
  });

  test('sign-up form submission shows validation or redirects', async ({ page }) => {
    await page.goto('/sign-up');
    const submitButton = page.getByRole('button', { name: /sign up|create account|get started/i });
    await submitButton.click();
    // Either stays on sign-up page or shows validation
    await expect(page).toHaveURL(/sign-up/);
  });

  test('unauthenticated user accessing /dashboard redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    // Should be redirected to sign-in
    await expect(page).toHaveURL(/sign-in/);
  });

  test('unauthenticated user accessing /dashboard/general redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard/general');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('unauthenticated user accessing /dashboard/billing redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await expect(page).toHaveURL(/sign-in/);
  });
});
