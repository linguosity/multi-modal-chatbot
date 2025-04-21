// src/app/api/auth/logout/route.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabaseTypes';

export async function POST() {
  try {
    // Create Supabase client using the server client
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.delete(name, options);
          },
        },
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