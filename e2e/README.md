# E2E Testing with Playwright

This directory contains end-to-end tests using Playwright to validate the application's functionality through the browser.

## Setup

Playwright is already set up in the project. The main configuration is in `playwright.config.ts` in the root directory, which is configured to look for tests in this `e2e/` folder.

## Running Tests

```bash
# Start the development server
pnpm dev

# In another terminal, run all E2E tests
pnpm test:e2e

# Run a specific test file
pnpm exec playwright test auth.spec.ts

# Run with headed browser (to watch the test)
pnpm exec playwright test --headed

# Run with debug mode
pnpm exec playwright test --debug
```

## Test Files

- `auth.spec.ts`: Tests the authentication flow
  - Successful login redirects to dashboard
  - Invalid credentials show an error message
- `example.spec.ts`: Example Playwright tests
  - Tests title on the Playwright website
  - Tests navigation to the "Get started" page

## Debug Tips

1. Use the `--headed` flag to see the browser during test execution
2. Use the `--debug` flag for step-by-step debugging
3. Add `await page.pause()` in your test to pause at a specific point
4. Check console logs with `page.on('console', msg => console.log(msg.text()))`
5. Take screenshots with `await page.screenshot({ path: 'screenshot.png' })`

## Common Issues

- Selector issues: Verify selectors match the actual DOM elements
- Timing issues: Use `waitForSelector`, `waitForURL`, or explicit waits
- Authentication issues: Check cookie handling, redirect logic
- Flaky tests: Add proper waits and assertions, avoid race conditions