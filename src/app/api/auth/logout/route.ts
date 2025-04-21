// src/app/api/auth/logout/route.ts
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
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
    // Initialize Supabase client using the route handler client
    const supabase = createRouteHandlerClient<Database>({ 
      cookies 
    }, {
      cookieOptions
    });
    
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