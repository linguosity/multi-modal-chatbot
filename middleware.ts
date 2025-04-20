// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabaseTypes' // Ensure this path is correct

// Define protected paths (add more if needed)
const protectedRoutes = ['/dashboard', '/api/batch'];
// Define the consolidated auth route
const authRoutes = ['/auth'];
// Define other public routes explicitly if needed (add '/' if you want special handling outside the main logic)
const publicRoutes = ['/forgot-password', '/reset-password', '/register/confirmation'];

export async function middleware(request: NextRequest) {
  console.log(`[Middleware] Received request for: ${request.nextUrl.pathname}`); // Log entry

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return request.cookies.get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          // console.log(`[Middleware] Setting cookie: ${name}`); // Uncomment for deep cookie debug
          request.cookies.set({ name, value, ...options });
          // Re-create response AFTER modifying request cookies
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        async remove(name: string, options: CookieOptions) {
          // console.log(`[Middleware] Removing cookie: ${name}`); // Uncomment for deep cookie debug
          request.cookies.delete(name);
           // Re-create response AFTER modifying request cookies
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.delete(name);
        },
      },
    }
  );

  // It's crucial to await getUser to ensure the session is refreshed/validated
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();

  // Log potential errors during getUser
  if (getUserError) {
    console.error('[Middleware] Error fetching user:', getUserError.message);
  }

  const isAuthenticated = !!user;
  const { pathname } = request.nextUrl;
  const userId = user?.id; // Only available if authenticated

  // --- Log Auth Status ---
  console.log(`[Middleware] Path: ${pathname}, Authenticated: ${isAuthenticated}`);
  // --- End Log Auth Status ---


  // --- Special Redirect Logic ---
  if (pathname === '/reports' || pathname.startsWith('/reports/')) {
    console.log("[Middleware] Handling '/reports' path");
    if (!isAuthenticated) {
      console.log("[Middleware] Unauthenticated on '/reports', redirecting to /auth...");
      return NextResponse.redirect(new URL('/auth', request.url));
    }
    if (userId) {
      console.log("[Middleware] Authenticated on '/reports', calculating dynamic redirect...");
      // ... (rest of your dynamic redirect logic for /reports) ...
        const newUrl = request.nextUrl.clone();
        if (pathname === '/reports') {
          newUrl.pathname = `/dashboard/${userId}/reports`;
        } else if (pathname.startsWith('/reports/')) {
          if (pathname === '/reports/text-editor-test') {
            newUrl.pathname = `/dashboard/${userId}/reports/new`;
          } else {
            const pathParts = pathname.split('/');
            if (pathParts.length >= 3) {
              const reportId = pathParts[2];
              newUrl.pathname = `/dashboard/${userId}/reports/${reportId}`;
            } else {
              newUrl.pathname = `/dashboard/${userId}/reports`;
            }
          }
        }
        console.log(`[Middleware] Redirecting '/reports' to ${newUrl.pathname}`);
        return NextResponse.redirect(newUrl);
    } else {
        console.log("[Middleware] Authenticated on '/reports' but no userId found, redirecting to /dashboard");
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // --- Root Path Logic ---
  if (pathname === '/') {
    console.log("[Middleware] Handling '/' path");
    if (!isAuthenticated) {
      console.log("[Middleware] Unauthenticated on '/', redirecting to /auth...");
      return NextResponse.redirect(new URL('/auth', request.url));
    }
    // If logged in, redirect root to dashboard
    console.log("[Middleware] Authenticated on '/', redirecting to /dashboard...");
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // --- General Protection Logic ---
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // 1. Redirect authenticated users away from auth routes
  if (isAuthenticated && isAuthRoute) {
    console.log(`[Middleware] Authenticated user on auth route '${pathname}', redirecting to /dashboard...`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Redirect unauthenticated users away from protected routes
  if (!isAuthenticated && isProtectedRoute) {
     console.log(`[Middleware] Unauthenticated user on protected route '${pathname}', redirecting to /auth...`);
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // --- Allow request if no other condition matched ---
  console.log(`[Middleware] Allowing request for '${pathname}' to continue.`);
  return response;
}

// --- Matcher ---
// Ensure this matches the paths you want the middleware to run on
export const config = {
  matcher: [
    '/',
    '/auth',          // Add explicit auth route
    '/reports',       // Add explicit reports route
    '/dashboard',     // Add explicit dashboard route
    '/reports/:path*', // Catches /reports/*
    '/auth/:path*',    // Catches /auth/* (like /auth/callback)
    '/dashboard/:path*',// Catches /dashboard/*
    '/api/batch/:path*' // Catches /api/batch and /api/batch/*
    // Add specific paths if the wildcards are too broad or too narrow
    // Using negative lookahead to exclude assets (alternative):
    // '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};