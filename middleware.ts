// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabaseTypes' // Ensure this path is correct

// Define protected paths (add more if needed)
const protectedRoutes = ['/dashboard', '/dashboard/reports', '/api/batch'];
// Define the consolidated auth route
const authRoutes = ['/auth'];
// Define other public routes explicitly if needed (add '/' if you want special handling outside the main logic)
const publicRoutes = ['/forgot-password', '/reset-password', '/register/confirmation'];

// Default cookie options to ensure consistency
const defaultCookieOptions: CookieOptions = {
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 1 week
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production"
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] Request for: ${pathname}`);

  // OPTIMIZATION: Fast path for dashboard - if we have valid cookies, just let it through
  // This prevents unnecessary auth checks that might interfere with RSC
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
    // Check basic cookie existence first without validation
    const hasAuthCookie = request.cookies.has('sb-access-token') || 
                         request.cookies.has('sb-refresh-token');
    
    if (hasAuthCookie) {
      console.log(`[Middleware] Fast path: Auth cookie found for ${pathname}`);
      return NextResponse.next();
    }
  }

  // Standard response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    // Create Supabase client with error handling
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            try {
              return request.cookies.get(name)?.value;
            } catch (e) {
              console.error(`[Middleware] Error getting cookie ${name}:`, e);
              return undefined;
            }
          },
          async set(name: string, value: string, options: CookieOptions) {
            try {
              const mergedOptions = { ...defaultCookieOptions, ...options };
              request.cookies.set({ name, value, ...mergedOptions });
              // Re-create response AFTER modifying request cookies
              response = NextResponse.next({ request: { headers: request.headers } });
              response.cookies.set({ name, value, ...mergedOptions });
            } catch (e) {
              console.error(`[Middleware] Error setting cookie ${name}:`, e);
            }
          },
          async remove(name: string, options: CookieOptions) {
            try {
              // First delete from request
              request.cookies.delete(name);
              
              // Then create a new response and delete from it
              response = NextResponse.next({ 
                request: { headers: request.headers } 
              });
              
              // Delete with same options that were passed in
              const mergedOptions = { ...defaultCookieOptions, ...options };
              response.cookies.delete(name, mergedOptions);
            } catch (e) {
              console.error(`[Middleware] Error removing cookie ${name}:`, e);
            }
          },
        },
      }
    );

    // CRITICAL: Use getSession() to trigger the automatic token refresh
    // This handles token rotation for expired but valid sessions
    try {
      // getSession() automatically refreshes the token if needed
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[Middleware] Session error:', error.message);
      } else if (data.session) {
        console.log('[Middleware] Session refreshed successfully');
      }
    } catch (sessionError) {
      console.error('[Middleware] Session update error:', sessionError);
    }

    // After session refresh, use getUser() for auth checks
    let isAuthenticated = false;
    let user = null;
    
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('[Middleware] Auth error:', error.message);
      } else {
        user = data.user;
        isAuthenticated = !!user;
      }
    } catch (e) {
      console.error('[Middleware] Auth exception:', e);
    }
    
    console.log(`[Middleware] Auth state for ${pathname}: ${isAuthenticated ? 'Logged in' : 'Not logged in'}`);
    
    // SIMPLIFIED ROUTE HANDLING:
    
    // 1. Redirect from root path based on auth state
    if (pathname === '/') {
      if (isAuthenticated) {
        console.log('[Middleware] User logged in, redirecting to dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else {
        console.log('[Middleware] User not logged in, redirecting to auth');
        return NextResponse.redirect(new URL('/auth', request.url));
      }
    }
    
    // 2. Handle /reports redirects
    if (pathname === '/reports' || pathname.startsWith('/reports/')) {
      if (!isAuthenticated) {
        return NextResponse.redirect(new URL('/auth', request.url));
      }
      
      // Simplify report paths
      const newUrl = request.nextUrl.clone();
      if (pathname === '/reports') {
        newUrl.pathname = '/dashboard/reports';
      } else if (pathname === '/reports/text-editor-test') {
        newUrl.pathname = '/dashboard/reports/new';
      } else {
        const pathParts = pathname.split('/');
        if (pathParts.length >= 3) {
          const reportId = pathParts[2];
          newUrl.pathname = `/dashboard/reports/${reportId}`;
        } else {
          newUrl.pathname = '/dashboard/reports';
        }
      }
      
      return NextResponse.redirect(newUrl);
    }
    
    // 3. Redirect logged-in users away from auth pages
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
    if (isAuthenticated && isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // 4. Redirect non-logged-in users away from protected areas
    // Skip if already handled by fast path
    if (!pathname.startsWith('/dashboard/') && !pathname.startsWith('/api/')) {
      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
      if (!isAuthenticated && isProtectedRoute) {
        return NextResponse.redirect(new URL('/auth', request.url));
      }
    }
    
    // Allow through if no redirects were triggered
    return response;
    
  } catch (e) {
    // Global error handler
    console.error('[Middleware] Error:', e);
    
    // For dashboard paths, always let them through on error to avoid breaking RSCs
    if (pathname.startsWith('/dashboard/')) {
      return NextResponse.next();
    }
    
    return response;
  }
}

// --- Matcher ---
export const config = {
  matcher: [
    '/',
    '/auth',                       // Auth routes
    '/auth/:path*',                
    '/reports',                    
    '/reports/:path*',             
    '/dashboard',                  
    '/dashboard/reports',          
    '/dashboard/reports/:path*',   
    '/dashboard/:path*',           
    '/api/batch/:path*',           
    '/api/reports'                 
  ],
};