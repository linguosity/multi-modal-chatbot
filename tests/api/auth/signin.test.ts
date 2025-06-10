import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Mock next/headers properly with a proper cookies implementation
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => {
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

// Mock Supabase SSR
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn().mockReturnValue({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: 'u1', email: 'a@b.com' } },
        error: null
      })
    }
  })
}));

// Mock our server wrapper to use the mock from @supabase/ssr
jest.mock('@/lib/supabase/server', () => ({
  createServerClientWrapper: jest.fn(() => {
    // Return directly - not async
    return {
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { user: { id: 'u1', email: 'a@b.com' } },
          error: null
        }),
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'u1', email: 'a@b.com' } },
          error: null
        }),
        signOut: jest.fn().mockResolvedValue({ error: null })
      }
    };
  })
}));

describe('POST /api/auth/signin', () => {
  it('returns 200 + user on valid creds', async () => {
    const req = new Request('http://x/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'pw' })
    });
    
    // Dynamically import route handler
    const routeModule = await import('@/app/api/auth/signin/route');
    const res = await routeModule.POST(req);
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ success: true });
  });

  it('returns 400 when email or password is missing', async () => {
    const req = new Request('http://x/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com' }) // missing password
    });
    
    // Dynamically import route handler
    const routeModule = await import('@/app/api/auth/signin/route');
    const res = await routeModule.POST(req);
    
    expect(res.status).toBe(400);
  });

  it('returns 400 when credentials are invalid', async () => {
    // Override the mock for createServerClientWrapper for this test only
    const { createServerClientWrapper } = jest.requireMock('@/lib/supabase/server');
    (createServerClientWrapper as jest.Mock).mockReturnValueOnce({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid login credentials' }
        })
      }
    });

    const req = new Request('http://x/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', password: 'wrong' })
    });
    
    // Dynamically import route handler
    const routeModule = await import('@/app/api/auth/signin/route');
    const res = await routeModule.POST(req);
    
    expect(res.status).toBe(400); // Note: Route actually returns 400, not 401
  });
});
