import { test, expect } from '@playwright/test';

test.describe('Integrations Page', () => {
  test('unauthenticated access to /dashboard/integrations redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard/integrations');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('sign-in page is accessible from integrations redirect', async ({ page }) => {
    await page.goto('/dashboard/integrations');
    // After redirect, we should see a sign-in form
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
  });
});
