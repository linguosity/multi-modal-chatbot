import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
 
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Redirect /reports routes to /dashboard/user1/reports for now
  // In production, this would check auth and get the real userID
  if (pathname === '/reports' || pathname.startsWith('/reports/')) {
    // Use a dummy userId for now
    const userId = 'user1';
    
    const newUrl = request.nextUrl.clone();
    
    if (pathname === '/reports') {
      newUrl.pathname = `/dashboard/${userId}/reports`;
    } else if (pathname.startsWith('/reports/')) {
      // Handle sub-routes like /reports/text-editor-test
      // In production, you would map reportIDs properly
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
  
  return NextResponse.next();
}

// Match routes to apply middleware to
export const config = {
  matcher: ['/', '/reports', '/reports/:path*'],
};