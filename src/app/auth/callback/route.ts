// src/app/auth/callback/route.ts
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
        // Initialize Supabase client with error handling
        const cookieStore = await cookies();
        const supabase = await createClient(cookieStore);

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
        
        // Create a response with redirect
        const response = NextResponse.redirect(new URL(next, request.url));
        
        // Explicitly set the session cookie (belt and suspenders approach)
        // This helps in case the automatic cookie setting has issues
        // Use standardized cookie options
        const sessionKey = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL}-auth-token`;
        const accessTokenKey = 'sb-access-token';
        const refreshTokenKey = 'sb-refresh-token';
        
        // Default cookie options to ensure consistency
        const cookieOptions = {
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            sameSite: "lax" as const,
            secure: process.env.NODE_ENV === "production"
        };
        
        // Set session cookie
        response.cookies.set(sessionKey, JSON.stringify(data.session), cookieOptions);
        
        // Also explicitly set access and refresh tokens for redundancy
        if (data.session?.access_token) {
            response.cookies.set(accessTokenKey, data.session.access_token, cookieOptions);
        }
        
        if (data.session?.refresh_token) {
            response.cookies.set(refreshTokenKey, data.session.refresh_token, cookieOptions);
        }
        
        return response;
    } catch (e) {
        console.error("[Auth Callback] Unhandled error:", e);
        // On error, always redirect to auth page
        return NextResponse.redirect(new URL('/auth?error=Authentication+failed', request.url));
    }
}