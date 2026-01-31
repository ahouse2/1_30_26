import { defineConfig, devices } from '@playwright/test';

// Playwright configuration for end-to-end tests.
// Uses the frontend's dev server as a webServer to run tests against.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: 0,
  // Base URL is used by tests that rely on relative paths.
  use: {
    baseURL: 'http://localhost:5173',
  },
  // Spin up the frontend dev server before running tests. This command
  // runs from the repo root, so switch into the frontend folder.
  webServer: {
    command: 'bash -lc "cd frontend && npm run dev"',
    port: 5173,
    timeout: 120000,
    reuseExistingServer: false
  },
  project: [
    { name: 'Chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
