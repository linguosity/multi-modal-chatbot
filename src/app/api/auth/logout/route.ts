// src/app/api/auth/logout/route.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabaseTypes';

// Default cookie options to ensure consistency
const cookieOptions = {
  path: "/",
  maxAge: 0, // Expire immediately for logout
  sameSite: "none" as const, // Enable cross-site refresh
  secure: true, // Required with SameSite=None
  httpOnly: true
};

export async function POST() {
  try {
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
    
    // Let Supabase handle cookie clearing properly
    await supabase.auth.signOut();
    
    // Return simple no-content response
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('[Logout API] Error:', error);
    
    // Return error response
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}