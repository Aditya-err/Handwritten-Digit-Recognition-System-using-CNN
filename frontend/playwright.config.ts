import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration.
 *
 * Assumes the Vite dev server (port 5173) and FastAPI backend (port 8000)
 * are already running when E2E tests are executed.
 */
export default defineConfig({
  testDir: './e2e',
  /* Maximum time one test can run */
  timeout: 30_000,
  /* Run tests sequentially in CI for stability */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry once on failure */
  retries: 1,
  /* Reporter */
  reporter: 'list',
  /* Shared settings for all projects */
  use: {
    /* Base URL so we can use relative paths in tests */
    baseURL: 'http://localhost:5173',
    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',
    /* Collect trace on first retry */
    trace: 'on-first-retry',
  },
  /* Run tests in Chromium only */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
