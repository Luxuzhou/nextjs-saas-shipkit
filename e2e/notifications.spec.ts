import { test, expect } from '@playwright/test';

test.describe('Notifications Page', () => {
  test('unauthenticated access to /dashboard/notifications redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('sign-in page is accessible from notifications redirect', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    // After redirect, we should see a sign-in form
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
  });
});
