// This file contains setup code that will be run before each test
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for TextEncoder/TextDecoder which Node.js needs in some environments
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock fetch globally for tests
global.fetch = jest.fn();

// Stub environment variables for testing
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.AWS_REGION = 'us-west-2';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

// Reset modules and mocks after each test to isolate state
afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  
  // Reset fetch mock
  (global.fetch as jest.Mock).mockReset();
});

// Restore console after all tests
afterAll(() => {
  global.console = originalConsole;
});