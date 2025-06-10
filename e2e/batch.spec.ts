import { test, expect } from '@playwright/test';

test('batch processing workflow', async ({ page }) => {
  // Login first (this assumes the auth.spec.ts test passes)
  await page.goto('/auth');
  await page.fill('input[type=email]', 'brandon.c.brewer@gmail.com');
  await page.fill('input[type=password]', '12345678');
  await page.click('button[type=submit]');
  await page.waitForURL('/dashboard');
  
  // Navigate to the reports page
  await page.click('a[href="/dashboard/reports"]');
  
  // Create a new report if none exists
  if (await page.getByText('Create Your First Report').isVisible()) {
    await page.click('text=Create Your First Report');
  } else {
    // Click on the first report or create a new one
    await page.click('a[href^="/dashboard/reports/"]');
  }
  
  // Wait for the report editor to load
  await page.waitForSelector('.report-editor-container', { timeout: 10000 });
  
  // Find the textarea for batch input and enter text
  const editorPanel = await page.locator('form >> textarea');
  await editorPanel.fill('This is a test input for batch processing. The student shows receptive language difficulties.');
  
  // Submit the batch request
  await page.click('button:has-text("Process")');
  
  // Verify batch status appears
  const batchStatus = await page.waitForSelector('text=Processing report', { timeout: 10000 });
  expect(batchStatus).toBeTruthy();
  
  // Note: In a real test, we would intercept network requests and mock responses
  // However, for this basic test, we're just verifying the UI flow
  
  // Test can be expanded to check for success/failure states
  // This might timeout in a real environment since batch processing takes time
});

test('error handling in batch workflow', async ({ page }) => {
  // Login first
  await page.goto('/auth');
  await page.fill('input[type=email]', 'brandon.c.brewer@gmail.com');
  await page.fill('input[type=password]', '12345678');
  await page.click('button[type=submit]');
  await page.waitForURL('/dashboard');
  
  // Navigate to reports
  await page.click('a[href="/dashboard/reports"]');
  
  // Get to a report edit page
  if (await page.getByText('Create Your First Report').isVisible()) {
    await page.click('text=Create Your First Report');
  } else {
    await page.click('a[href^="/dashboard/reports/"]');
  }
  
  // Intercept the batch submit request and mock an error response
  await page.route('**/api/batch/submit', async route => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Simulated API error' })
    });
  });
  
  // Enter text and submit
  const editorPanel = await page.locator('form >> textarea');
  await editorPanel.fill('This should trigger an error response');
  await page.click('button:has-text("Process")');
  
  // Check for error message
  const errorMessage = await page.waitForSelector('text=Simulated API error', { timeout: 10000 });
  expect(errorMessage).toBeTruthy();
});