import { test, expect } from '@playwright/test';

test.describe('Admin Pages', () => {
  test('unauthenticated access to /admin redirects or shows unauthorized', async ({ page }) => {
    await page.goto('/admin');
    // Should either redirect to sign-in or show an unauthorized page
    const url = page.url();
    const isRedirectedToSignIn = url.includes('sign-in');
    const pageText = await page.textContent('body');

    // Either redirected to sign-in, or page contains unauthorized/access denied message
    const isUnauthorized =
      pageText !== null &&
      (pageText.toLowerCase().includes('unauthorized') ||
        pageText.toLowerCase().includes('access denied') ||
        pageText.toLowerCase().includes('forbidden') ||
        pageText.toLowerCase().includes('sign in') ||
        pageText.toLowerCase().includes('log in'));

    expect(isRedirectedToSignIn || isUnauthorized).toBe(true);
  });

  test('unauthenticated access to /admin/users is protected', async ({ page }) => {
    await page.goto('/admin/users');
    const url = page.url();
    const pageText = await page.textContent('body');

    const isProtected =
      url.includes('sign-in') ||
      (pageText !== null &&
        (pageText.toLowerCase().includes('unauthorized') ||
          pageText.toLowerCase().includes('access denied') ||
          pageText.toLowerCase().includes('forbidden') ||
          pageText.toLowerCase().includes('sign in')));

    expect(isProtected).toBe(true);
  });

  test('unauthenticated access to /admin/activity is protected', async ({ page }) => {
    await page.goto('/admin/activity');
    const url = page.url();
    const pageText = await page.textContent('body');

    const isProtected =
      url.includes('sign-in') ||
      (pageText !== null &&
        (pageText.toLowerCase().includes('unauthorized') ||
          pageText.toLowerCase().includes('access denied') ||
          pageText.toLowerCase().includes('forbidden') ||
          pageText.toLowerCase().includes('sign in')));

    expect(isProtected).toBe(true);
  });

  test('unauthenticated access to /admin/subscriptions is protected', async ({ page }) => {
    await page.goto('/admin/subscriptions');
    const url = page.url();
    const pageText = await page.textContent('body');

    const isProtected =
      url.includes('sign-in') ||
      (pageText !== null &&
        (pageText.toLowerCase().includes('unauthorized') ||
          pageText.toLowerCase().includes('access denied') ||
          pageText.toLowerCase().includes('forbidden') ||
          pageText.toLowerCase().includes('sign in')));

    expect(isProtected).toBe(true);
  });

  test('unauthenticated access to /admin/roles is protected', async ({ page }) => {
    await page.goto('/admin/roles');
    const url = page.url();
    const pageText = await page.textContent('body');

    const isProtected =
      url.includes('sign-in') ||
      (pageText !== null &&
        (pageText.toLowerCase().includes('unauthorized') ||
          pageText.toLowerCase().includes('access denied') ||
          pageText.toLowerCase().includes('forbidden') ||
          pageText.toLowerCase().includes('sign in')));

    expect(isProtected).toBe(true);
  });

  test('unauthenticated access to /admin/compliance is protected', async ({ page }) => {
    await page.goto('/admin/compliance');
    const url = page.url();
    const pageText = await page.textContent('body');

    const isProtected =
      url.includes('sign-in') ||
      (pageText !== null &&
        (pageText.toLowerCase().includes('unauthorized') ||
          pageText.toLowerCase().includes('access denied') ||
          pageText.toLowerCase().includes('forbidden') ||
          pageText.toLowerCase().includes('sign in')));

    expect(isProtected).toBe(true);
  });
});
