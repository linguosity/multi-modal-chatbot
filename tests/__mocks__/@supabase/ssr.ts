// Mock for @supabase/ssr
export const createServerClient = jest.fn().mockImplementation(() => ({
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null
    }),
    getSession: jest.fn().mockResolvedValue({
      data: { session: { user: { id: 'user-123', email: 'test@example.com' } } },
      error: null
    }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null
    }),
    signOut: jest.fn().mockResolvedValue({ error: null })
  }, // <--- ADD COMMA HERE
  from: jest.fn().mockImplementation((table) => ({
    select: jest.fn().mockImplementation(() => ({
      eq: jest.fn().mockImplementation(() => ({
        single: jest.fn().mockResolvedValue({
          data: { id: 'record-123', user_id: 'user-123' },
          error: null
        }),
        order: jest.fn().mockImplementation(() => ({
          data: [{ id: 'record-123', user_id: 'user-123' }],
          error: null
        }))
      }))
    })), // <--- ADD COMMA HERE (after select property)
    insert: jest.fn().mockImplementation(() => ({
      select: jest.fn().mockImplementation(() => ({
        single: jest.fn().mockResolvedValue({
          data: { id: 'new-record-123', user_id: 'user-123' },
          error: null
        })
      }))
    })), // <--- ADD COMMA HERE (after insert property)
    update: jest.fn().mockImplementation(() => ({
      eq: jest.fn().mockImplementation(() => ({
        data: { id: 'record-123', updated_at: new Date().toISOString() },
        error: null
      })),
      select: jest.fn().mockImplementation(() => ({
        single: jest.fn().mockResolvedValue({
          data: { id: 'record-123', updated_at: new Date().toISOString() },
          error: null
        })
      }))
    })) // No comma needed after the last property (update)
  })) // Closes 'from' implementation object
})); // Closes createServerClient mock

// createBrowserClient seems syntactically correct, assuming it only needs the auth part.
export const createBrowserClient = jest.fn().mockImplementation(() => ({
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null
    }),
    getSession: jest.fn().mockResolvedValue({
      data: { session: { user: { id: 'user-123', email: 'test@example.com' } } },
      error: null
    }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null
    }),
    signOut: jest.fn().mockResolvedValue({ error: null })
  }
}));