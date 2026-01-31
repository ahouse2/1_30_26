import { test, expect } from '@playwright/test';

test('loads home page', async ({ page }) => {
  // Navigate to root path. The Playwright config sets baseURL to localhost:5173.
  const response = await page.goto('/');
  // Ensure the server responds OK
  expect(response?.ok()).toBeTruthy();
  // A lightweight sanity check that the page renders something
  const html = await page.content();
  expect(html.length).toBeGreaterThan(1000);
});
