# Testing Guide for Linguosity

This project uses both Jest for unit tests and Playwright for E2E tests, organized in separate directories to avoid conflicts.

## Directory Structure

- `/tests/` - Unit tests with Jest
  - `/tests/api/auth/signin.test.ts` - Tests for auth API handlers
  - More unit tests to be added here

- `/e2e/` - End-to-end tests with Playwright
  - `/e2e/auth.spec.ts` - Tests for auth flows
  - More E2E tests to be added here

## Setup

1. Install dependencies:
```bash
pnpm install --save-dev ts-jest @testing-library/react @types/jest
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run specific test file
pnpm exec jest tests/api/auth/signin.test.ts
```

### E2E Tests

```bash
# Start the development server
pnpm dev

# In another terminal, run E2E tests
pnpm test:e2e

# Run specific test file
pnpm exec playwright test auth.spec.ts

# Run with headed browser (to watch the test)
pnpm exec playwright test --headed
```

## Configuration

- `jest.config.js` - Configured to only match `*.test.ts` patterns in the `/tests/` directory
- `playwright.config.ts` - Configured to run tests from the `/e2e/` directory 

## Debugging Auth Loops

When dealing with auth loops:

1. Start with Jest unit tests to validate API route handlers work correctly
2. Use Playwright E2E tests to verify the full flow (login → redirect → protected page)
3. Add logging in middleware.ts and auth routes to trace the flow
4. Use browser developer tools to inspect cookies and network requests

## Common Auth Issues

- Cookie handling: Check middleware and auth route cookie management
- Redirect timing: Ensure redirects happen at the right moment
- Server vs client state: Check for mismatched auth states
- CORS issues: Verify credentials mode and cookie settings

## Best Practices

1. Test auth logic at both unit and E2E levels
2. Keep test files separate by purpose (API, UI, etc.)
3. Mock external dependencies in unit tests
4. Use proper selectors in E2E tests that won't break with UI changes
5. Implement visual testing for complex UI components