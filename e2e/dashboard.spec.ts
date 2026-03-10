import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('unauthenticated access to /dashboard redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('unauthenticated access to /dashboard/general redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard/general');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('unauthenticated access to /dashboard/security redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard/security');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('unauthenticated access to /dashboard/activity redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard/activity');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('unauthenticated access to /dashboard/usage redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard/usage');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('unauthenticated access to /dashboard/billing redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('unauthenticated access to /dashboard/notifications redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard/notifications');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('unauthenticated access to /dashboard/integrations redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard/integrations');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('sign-in page is reachable from dashboard redirect', async ({ page }) => {
    await page.goto('/dashboard');
    // After redirect to sign-in, form elements should be present
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
