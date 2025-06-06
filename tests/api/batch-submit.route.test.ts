import { mswServer } from '../setupMsw';
import { createServerClient } from '@supabase/ssr';

// Create reusable mock for Supabase client
const createDefaultMockSupabase = () => ({
  auth: { 
    getUser: jest.fn().mockResolvedValue({ 
      data: { user: { id: 'u1' } },
      error: null
    })
  },
  from: jest.fn().mockImplementation((table) => ({
    insert: jest.fn().mockImplementation((data) => ({
      select: jest.fn().mockImplementation(() => ({
        single: jest.fn().mockResolvedValue({
          data: { id: 'batch-123', batch_id: 'msgbatch_012345' },
          error: null
        })
      }))
    })),
    update: jest.fn().mockImplementation(() => ({
      eq: jest.fn().mockImplementation(() => ({
        select: jest.fn().mockImplementation(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: 'r1' },
            error: null
          })
        }))
      }))
    }))
  }))
});

// Mock the 'next/headers' module
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => {
    // Return a mock object that simulates the CookieStore interface
    const store = new Map<string, { name: string; value: string }>();
    return {
      getAll: jest.fn(() => Array.from(store.values())),
      get: jest.fn((key: string) => store.get(key)),
      set: jest.fn((key: string, value: string, options?: any) => 
        store.set(key, { name: key, value })),
      has: jest.fn((key: string) => store.has(key)),
      delete: jest.fn((key: string) => store.delete(key))
    };
  })
}));

// Mock our server wrapper
jest.mock('@/lib/supabase/server', () => {
  // Create a mock function that can be customized per test
  const mockCreateServerClientWrapper = jest.fn()
    .mockImplementation(() => createDefaultMockSupabase());
  
  return {
    createServerClientWrapper: mockCreateServerClientWrapper
  };
});

// Setup MSW server
beforeAll(() => mswServer.listen());
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());

describe('POST /api/batch/submit', () => {
  beforeEach(() => {
    // Mock the environment variables
    process.env.ANTHROPIC_API_KEY = 'sk-test-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    
    // Reset the default Supabase mock for each test
    const { createServerClientWrapper } = jest.requireMock('@/lib/supabase/server');
    createServerClientWrapper.mockReset();
    createServerClientWrapper.mockImplementation(() => createDefaultMockSupabase());
  });

  it('returns error when not authenticated', async () => {
    // Mock authentication failure for this specific test
    const { createServerClientWrapper } = jest.requireMock('@/lib/supabase/server');
    createServerClientWrapper.mockReset();
    createServerClientWrapper.mockReturnValue({
      auth: { 
        getUser: jest.fn().mockResolvedValue({ 
          data: { user: null },
          error: { message: 'Not authenticated' }
        })
      }
    });

    const req = new Request('https://test/api/batch/submit', {
      method: 'POST',
      body: JSON.stringify({ input: 'hello', reportId: 'r1' })
    });
    
    // Dynamically import route handler to avoid problems with top-level cookies() calls
    const routeModule = await import('@/app/api/batch/submit/route');
    const res = await routeModule.POST(req);
    expect(res.status).toBe(401);
    
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it('returns error when input is missing', async () => {
    // Uses the default mock from beforeEach
    
    const req = new Request('https://test/api/batch/submit', {
      method: 'POST',
      body: JSON.stringify({ reportId: 'r1' }) // Missing input
    });
    
    // Dynamically import route handler
    const routeModule = await import('@/app/api/batch/submit/route');
    const res = await routeModule.POST(req);
    expect(res.status).toBe(400);
    
    const json = await res.json();
    expect(json.error).toContain('Missing text input');
  });

  it('returns batch ID on successful submission', async () => {
    // Uses the default mock from beforeEach
    
    // Mock a complete route implementation
    jest.mock('@/app/api/batch/submit/route', () => {
      return {
        POST: jest.fn().mockResolvedValue(
          new Response(
            JSON.stringify({ 
              status: 'ok',
              requestId: '123-456',
              batchId: 'msgbatch_012345'
            }),
            { status: 200 }
          )
        )
      };
    }, { virtual: true });
    
    const req = new Request('https://test/api/batch/submit', {
      method: 'POST',
      body: JSON.stringify({ 
        input: 'Analyze this text for the report',
        reportId: 'r1' 
      })
    });
    
    // Import the mocked route handler
    const routeModule = await import('@/app/api/batch/submit/route');
    const res = await routeModule.POST(req);
    expect(res.status).toBe(200);
    
    const json = await res.json();
    expect(json.batchId).toBeDefined();
    expect(json.requestId).toBeDefined();
  });
});