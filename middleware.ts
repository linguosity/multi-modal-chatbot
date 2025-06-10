console.log('[MIDDLEWARE] File loading');

import { type NextRequest, NextResponse } from 'next/server'
// import { updateSession }   from '@/lib/supabase/middleware'

console.log('[MIDDLEWARE] Imports complete');

export async function middleware(request: NextRequest) {
  // Temporarily disable middleware to debug
  console.log(`[MIDDLEWARE] Processing request: ${request.nextUrl.pathname}`)
  return NextResponse.next()
  // return await updateSession(request)
}

export const config = {
  // Temporarily simplify matcher to debug
  matcher: ["/((?!.*\\.).*)", "/api/(.*)"],
  // Original matcher commented out:
  // matcher: [
  //   /*
  //    * Match all request paths except for the ones starting with:
  //    * - api/auth (auth API routes)
  //    * - auth (auth pages)
  //    * - _next/static (static files)
  //    * - _next/image (image optimization files)
  //    * - favicon.ico (favicon file)
  //    */
  //   '/((?!api/auth|auth|_next/static|_next/image|favicon.ico).*)',
  // ],
}