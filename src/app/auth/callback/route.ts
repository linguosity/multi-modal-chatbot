// src/app/auth/callback/route.ts
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabaseTypes';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/dashboard';

    console.log(`[Auth Callback] Processing code: ${code ? 'present' : 'missing'}`);

    if (!code) {
        console.error("[Auth Callback] No auth code found");
        return NextResponse.redirect(new URL('/auth?error=No+authorization+code', request.url));
    }

    try {
        // Default cookie options to ensure consistency
        const cookieOptions = {
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            sameSite: "none" as const, // Enable cross-site refresh
            secure: true, // Required with SameSite=None
            httpOnly: true
        };
        
        // Initialize Supabase client using the route handler client
        const supabase = createRouteHandlerClient<Database>({ 
            cookies 
        }, {
            cookieOptions
        });

        // Exchange the code for a session
        console.log("[Auth Callback] Exchanging code for session...");
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error("[Auth Callback] Session exchange error:", error.message);
            return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(error.message)}`, request.url));
        }

        // Verify we got a session
        if (!data.session) {
            console.warn("[Auth Callback] No session returned");
            return NextResponse.redirect(new URL('/auth?error=Invalid+session', request.url));
        }

        console.log("[Auth Callback] Success, redirecting to:", next);
        
        // Just redirect to the next URL
        // createRouteHandlerClient has already set the cookies correctly
        return NextResponse.redirect(new URL(next, request.url));
    } catch (e) {
        console.error("[Auth Callback] Unhandled error:", e);
        // On error, always redirect to auth page
        return NextResponse.redirect(new URL('/auth?error=Authentication+failed', request.url));
    }
}