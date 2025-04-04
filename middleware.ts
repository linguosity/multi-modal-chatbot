import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabaseTypes'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Default response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Initialize Supabase client
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // This is a workaround for middleware support
          response.cookies.set({ name, value, ...options })
          return response
        },
        remove(name: string, options: any) {
          // This is a workaround for middleware support
          response.cookies.set({ name, value: '', ...options })
          return response
        },
      },
    }
  )

  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  
  // Get user ID from session or default to 'user-1' for dev purposes
  // In a production app, you would require a valid session for protected routes
  const userId = session?.user?.id || 'user-1';
  
  // Redirect /reports routes to /dashboard/userId/reports
  if (pathname === '/reports' || pathname.startsWith('/reports/')) {
    const newUrl = request.nextUrl.clone();
    
    if (pathname === '/reports') {
      newUrl.pathname = `/dashboard/${userId}/reports`;
    } else if (pathname.startsWith('/reports/')) {
      // Handle sub-routes like /reports/text-editor-test
      if (pathname === '/reports/text-editor-test') {
        newUrl.pathname = `/dashboard/${userId}/reports/new`;
      } else {
        // Extract report ID if present
        const pathParts = pathname.split('/');
        if (pathParts.length >= 3) {
          const reportId = pathParts[2];
          newUrl.pathname = `/dashboard/${userId}/reports/${reportId}`;
        } else {
          newUrl.pathname = `/dashboard/${userId}/reports`;
        }
      }
    }
    
    return NextResponse.redirect(newUrl);
  }
  
  // Redirect root to dashboard
  if (pathname === '/') {
    const newUrl = request.nextUrl.clone();
    newUrl.pathname = '/dashboard';
    return NextResponse.redirect(newUrl);
  }
  
  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
  ];

  // Auth routes (login, register, etc.)
  const authRoutes = [
    '/login',
    '/register',
  ];

  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // In a real production app, you might want to uncomment this to enforce authentication
  // For now, we'll keep it commented to allow development without auth
  
  // Redirect unauthenticated users away from protected routes to login
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  
  return response;
}

// Match routes to apply middleware to - expanded to include auth routes
export const config = {
  matcher: ['/', '/reports', '/reports/:path*', '/login', '/register', '/dashboard/:path*'],
};