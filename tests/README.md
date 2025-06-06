# Unit Testing Guide

This directory contains unit tests for backend functionality. E2E tests are in the separate `/e2e` directory.

## Unit Tests

Unit tests for API routes and backend functionality are located in `tests/api` directory and use Jest.

### Running Unit Tests

```bash
# Install dependencies
pnpm install --save-dev ts-jest @testing-library/react @types/jest

# Run all unit tests
pnpm test

# Run specific test file
pnpm exec jest tests/api/auth/signin.test.ts
```

### Auth API Test Details

The signin route test (`tests/api/auth/signin.test.ts`) validates:
- Successful login returns 200 status with user info
- Missing credentials return 400 status
- Invalid credentials return 401 status

## E2E Tests

End-to-end tests using Playwright are located in the separate `/e2e` directory.

See `/e2e/README.md` for detailed instructions on running and debugging E2E tests.

## Debugging Auth Issues

When experiencing auth loops or login issues:

1. Run the unit test first to validate the API route handler works correctly
2. Run the E2E test to see if the full auth flow completes successfully
3. Check console logs in both tests for error messages
4. Verify cookie handling in middleware.ts and auth routes

## Common Auth Issues

- Missing or incorrectly set cookies
- Redirects happening before auth state is established
- Inconsistent auth check logic between server and client
- CORS issues blocking cookie transmission
- OAuth callback URL misconfiguration

## Future Test Coverage To Add

- Signup functionality
- Logout flow
- Protected route access
- OAuth authentication flows