// This file contains setup code that will be run before each test
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for TextEncoder/TextDecoder which Node.js needs in some environments
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Stub environment variables
process.env.ANTHROPIC_API_KEY = 'test-key';

// Reset modules and mocks after each test to isolate state
afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});