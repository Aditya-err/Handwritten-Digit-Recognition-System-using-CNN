import { test, expect } from '@playwright/test';

/**
 * E2E smoke tests for the Digit Recognition application.
 *
 * Prerequisites:
 *   - Backend running:  cd backend && uvicorn app.main:app --reload
 *   - Frontend running: cd frontend && npm run dev
 */

test.describe('Application Smoke Tests', () => {
  test('page loads and canvas is present', async ({ page }) => {
    await page.goto('/');

    // The page title should match what's in index.html
    await expect(page).toHaveTitle(/Neural Network Visualizer/);

    // The drawing canvas should be rendered with the correct aria-label (added in T003)
    const canvas = page.getByRole('img', { name: 'Drawing canvas for digit recognition' });
    await expect(canvas).toBeVisible();
  });

  test('API health endpoint resolves', async ({ request }) => {
    // Hit the backend health endpoint directly
    const response = await request.get('http://localhost:8000/api/v1/health');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    // The health endpoint should return a status field
    expect(body).toHaveProperty('status');
  });

  test('sidebar navigation is visible', async ({ page }) => {
    await page.goto('/');

    // The sidebar should be present
    const sidebar = page.locator('nav, [class*="sidebar"], aside').first();
    await expect(sidebar).toBeVisible();
  });
});
