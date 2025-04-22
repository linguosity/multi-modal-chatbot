// src/app/api/auth/signin/route.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabaseTypes';

// Default cookie options to ensure consistency
const cookieOptions = {
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 1 week
  sameSite: "none" as const, // Enable cross-site refresh
  secure: true, // Required with SameSite=None
  httpOnly: true,
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Await the cookie store for read/write
    const cookieStore = await cookies();

    // Initialize Supabase client using the server-side SSR helper
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
            });
          },
        },
        cookieOptions,
      }
    );

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Signin API] Error:', error.message);

      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: `Authentication failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[Signin API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
