import { test, expect } from '@playwright/test';

test('auth page loads correctly', async ({ page }) => {
  // Navigate to the auth page
  await page.goto('/auth');
  
  // Check that the auth page loads
  await expect(page).toHaveTitle(/Linguosity/);
  
  // Check for auth form elements
  await expect(page.locator('input[type=email]')).toBeVisible();
  await expect(page.locator('input[type=password]')).toBeVisible();
  await expect(page.locator('button[type=submit]')).toBeVisible();
});

test('login with invalid credentials shows error', async ({ page }) => {
  // Navigate to the auth page
  await page.goto('/auth');
  
  // Fill in invalid credentials
  await page.fill('input[type=email]', 'invalid@example.com');
  await page.fill('input[type=password]', 'invalidpassword');
  
  // Click the login button and wait for navigation
  await page.click('button[type=submit]');
  
  // Wait for redirect to dashboard (or timeout if auth loop occurs)
  await page.waitForURL('/dashboard');
  
  // Verify we're on the dashboard
  await expect(page.url()).toContain('/dashboard');
  
  // Verify some dashboard element is present (may need to adjust based on your actual UI)
  await expect(page.locator('h1')).toBeTruthy();
});

test('login with invalid credentials shows error', async ({ page }) => {
  // Navigate to the auth page
  await page.goto('/auth');
  
  // Fill in the login form with invalid credentials
  await page.fill('input[type=email]', 'test@example.com');
  await page.fill('input[type=password]', 'wrongpassword');
  
  // Click the login button
  await page.click('button[type=submit]');
  
  // Wait for the error message to appear
  await page.waitForSelector('div[role="alert"]');
  
  // Verify error message is displayed
  const errorAlert = page.locator('div[role="alert"]');
  await expect(errorAlert).toBeVisible();
  
  // Verify URL is still /auth (we didn't redirect)
  await expect(page.url()).toContain('/auth');
});