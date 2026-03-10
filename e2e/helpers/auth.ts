import { type Page } from '@playwright/test';

/**
 * Creates a test user by navigating to the sign-up page and filling the form.
 */
export async function createTestUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/sign-up');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign up|create account|get started/i }).click();
}

/**
 * Logs in as an existing user by navigating to the sign-in page and filling the form.
 */
export async function loginAs(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in|login/i }).click();
}

/**
 * Logs out the current user by looking for a sign-out button or link.
 */
export async function logout(page: Page): Promise<void> {
  // Try to find sign-out in a menu or directly on the page
  const signOutButton = page.getByRole('button', { name: /sign out|log out|logout/i });
  if (await signOutButton.isVisible()) {
    await signOutButton.click();
    return;
  }

  // Try link variant
  const signOutLink = page.getByRole('link', { name: /sign out|log out|logout/i });
  if (await signOutLink.isVisible()) {
    await signOutLink.click();
  }
}
