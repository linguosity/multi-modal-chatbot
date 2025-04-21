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
  httpOnly: true
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
    
    // Initialize Supabase client using the server client
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookies().get(name)?.value,
          set: (name, value, options) => cookies().set({ name, value, ...options }),
          remove: (name, options) => cookies().delete(name, options)
        }
      }
    );
    
    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('[Signin API] Error:', error.message);
      
      // Return appropriate error response
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
    
    // Return success response
    return NextResponse.json(
      { 
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
          // Include only safe user data to return to the client
        } 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Signin API] Unexpected error:', error);
    
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}