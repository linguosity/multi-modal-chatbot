// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabaseTypes';

// Define protected, auth, and public routes
const protectedRoutes = ['/dashboard', '/dashboard/reports', '/api/batch'];
const authRoutes = ['/auth'];
const publicRoutes = ['/forgot-password', '/reset-password', '/register/confirmation'];

// Default cookie options
const defaultCookieOptions: CookieOptions = {
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 1 week
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] Request for: ${pathname}`);

  // Fast path: allow dashboard/api if auth cookies present
  if (
    (pathname.startsWith('/dashboard') || pathname.startsWith('/api')) &&
    (request.cookies.has('sb-access-token') || request.cookies.has('sb-refresh-token'))
  ) {
    return NextResponse.next();
  }

  // Base response
  let response = NextResponse.next({ request: { headers: request.headers } });

  // Initialize Supabase SSR client with cookie methods
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          request.cookies.getAll().map(c => ({ name: c.name, value: c.value! })),
        setAll: cookiesToSet => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options, ...defaultCookieOptions });
          });
        },
      },
      cookieOptions: defaultCookieOptions,
    }
  );

  // Refresh session to rotate tokens if needed
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) console.error('[Middleware] Session error:', error.message);
    else if (data.session) console.log('[Middleware] Session refreshed');
  } catch (e) {
    console.error('[Middleware] Session update error:', e);
  }

  // Check authentication state
  let isAuthenticated = false;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) console.error('[Middleware] Auth error:', error.message);
    else isAuthenticated = !!data.user;
  } catch (e) {
    console.error('[Middleware] Auth exception:', e);
  }

  console.log(`[Middleware] Auth state for ${pathname}: ${
    isAuthenticated ? 'Logged in' : 'Not logged in'
  }`);

  // Redirects
  if (pathname === '/') {
    return isAuthenticated
      ? NextResponse.redirect(new URL('/dashboard', request.url))
      : NextResponse.redirect(new URL('/auth', request.url));
  }

  if (pathname === '/reports' || pathname.startsWith('/reports/')) {
    if (!isAuthenticated) return NextResponse.redirect(new URL('/auth', request.url));
    const newUrl = request.nextUrl.clone();
    if (pathname === '/reports') newUrl.pathname = '/dashboard/reports';
    else if (pathname === '/reports/text-editor-test') newUrl.pathname = '/dashboard/reports/new';
    else {
      const parts = pathname.split('/');
      newUrl.pathname = parts[2]
        ? `/dashboard/reports/${parts[2]}`
        : '/dashboard/reports';
    }
    return NextResponse.redirect(newUrl);
  }

  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (
    !pathname.startsWith('/dashboard/') &&
    !pathname.startsWith('/api/') &&
    protectedRoutes.some(route => pathname.startsWith(route)) &&
    !isAuthenticated
  ) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/auth',
    '/auth/:path*',
    '/reports',
    '/reports/:path*',
    '/dashboard',
    '/dashboard/reports',
    '/dashboard/reports/:path*',
    '/dashboard/:path*',
    '/api/batch/:path*',
    '/api/reports',
  ],
};
