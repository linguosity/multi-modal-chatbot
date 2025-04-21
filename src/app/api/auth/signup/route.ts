// src/app/api/auth/signup/route.ts
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
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

// Helper to get origin URL safely on server
function getSiteURL() {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ?? // Set this in .env.local
    process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel
    'http://localhost:3000'; // Default if not set
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  // Make sure to include trailing `/`
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  return url;
}

export async function POST(request: Request) {
  try {
    const { email, password, confirmPassword } = await request.json();
    
    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }
    
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client using the route handler client
    const supabase = createRouteHandlerClient<Database>({ 
      cookies 
    }, {
      cookieOptions
    });
    
    // Generate redirect URL for email confirmation
    const origin = getSiteURL();
    
    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}auth/callback`,
      }
    });
    
    if (error) {
      console.error('[Signup API] Error:', error.message);
      
      // Check for specific errors like user already registered
      if (error.message.includes('User already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in.' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: `Signup failed: ${error.message}` },
        { status: 500 }
      );
    }
    
    // Handle specific case where user exists but email isn't confirmed
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      console.log('[Signup API] User created, requires email confirmation:', email);
      return NextResponse.json(
        { 
          success: true,
          confirmationNeeded: true,
          user: {
            id: data.user?.id,
            email: data.user?.email,
          }
        },
        { status: 200 }
      );
    }
    
    // Return success response
    return NextResponse.json(
      { 
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Signup API] Unexpected error:', error);
    
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}