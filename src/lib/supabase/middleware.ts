import { createServerClient }      from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  console.log(`Middleware: Processing request for ${request.nextUrl.pathname}`)
  
  // Skip middleware for auth routes to prevent blocking
  if (
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/login')
  ) {
    console.log(`Middleware: Skipping auth check for ${request.nextUrl.pathname}`)
    return NextResponse.next({ request })
  }
  
  let response = NextResponse.next({ request })
  
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Supabase auth timeout')), 5000)
    )
    
    const authPromise = supabase.auth.getUser()
    
    const result = await Promise.race([authPromise, timeoutPromise]) as { data: { user: any }, error: any }
    
    const { data: { user }, error } = result

    console.log(`Middleware: User authenticated: ${!!user}, Path: ${request.nextUrl.pathname}, Error: ${error?.message || 'none'}`)

    // Redirect unauthenticated users to /auth
    if (!user) {
      console.log(`Middleware: Redirecting to /auth from ${request.nextUrl.pathname}`)
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.error('Middleware: Error checking auth:', error)
    // On error, redirect to auth page
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  return response
}