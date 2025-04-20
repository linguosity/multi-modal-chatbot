// src/app/auth/callback/route.ts
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // <<< Import your SERVER client factory
// No need to import createBrowserClient or Database type here if factory handles it

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/dashboard'; // Get next path or default

    console.log(`[Auth Callback] Received request for path: ${requestUrl.pathname} with code: ${code ? 'present' : 'missing'}`);

    if (code) {
        const cookieStore = await cookies(); // Must await cookies() in Next 15+
        const supabase = await createClient(cookieStore); // Use your server client factory

        if (!supabase) {
            console.error("[Auth Callback] Failed to create Supabase client");
            // Redirect to an error state on your auth page
            return NextResponse.redirect(new URL('/auth?error=Server+Configuration+Error', request.url));
        }

        console.log("[Auth Callback] Exchanging code for session...");
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error("[Auth Callback] Error exchanging code:", error.message);
             // Redirect back to auth page with error message
            return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent('Could not sign in: ' + error.message)}`, request.url));
        }

         console.log("[Auth Callback] Code exchanged successfully. Redirecting to:", next);
         // Redirect to the intended destination (or dashboard) after successful exchange
         return NextResponse.redirect(new URL(next, request.url));

    } else {
        console.error("[Auth Callback] No code found in request URL.");
         // Redirect back to auth page if no code is present
         return NextResponse.redirect(new URL(`/auth?error=Authorization+code+missing.`, request.url));
    }
}