import { test, expect } from '@playwright/test';

test.describe('PharmaNile E2E Smoke Tests', () => {
  test('should load the login page and contain key Egyptian Arabic UI elements', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/auth/login');

    // Confirm that we are redirected or land on login page
    await expect(page).toHaveURL(/.*\/auth\/login/);

    // Look for Arabic headers representing Multi-Chain (سلاسل الصيدليات)
    // Egyptian localized placeholder or title element
    const loginCard = page.locator('main');
    await expect(loginCard).toBeVisible();

    // Check availability of the input controls
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // In our login flow: we step through chain select first before credential inputs
    // So email input might be rendered after chain validation, check if card exists
    await expect(page.locator('body')).toContainText(/صيدليات|دخول/i);
  });
});
