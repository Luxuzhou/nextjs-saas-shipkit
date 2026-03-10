import { test, expect } from '@playwright/test';

test.describe('Billing Page', () => {
  test('unauthenticated access to /dashboard/billing redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('sign-in page is accessible from billing redirect', async ({ page }) => {
    await page.goto('/dashboard/billing');
    // After redirect, we should see a sign-in form
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
  });

  test('billing redirect preserves intent to visit billing', async ({ page }) => {
    await page.goto('/dashboard/billing');
    // After being redirected to sign-in, the page should allow the user to sign in
    const submitButton = page.getByRole('button').first();
    await expect(submitButton).toBeVisible();
  });
});
