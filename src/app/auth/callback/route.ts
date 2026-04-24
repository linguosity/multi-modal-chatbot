import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const response = NextResponse.redirect(requestUrl.origin + '/dashboard')

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            // Read from the cookie store (has the code verifier from /auth/login)
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            // Write to BOTH the cookie store and the redirect response
            cookiesToSet.forEach(({ name, value, options }) => {
              try { cookieStore.set(name, value, options) } catch {}
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Auth callback error:', error.message)
      return NextResponse.redirect(
        requestUrl.origin + '/auth?error=' + encodeURIComponent(error.message)
      )
    }

    return response
  }

  return NextResponse.redirect(requestUrl.origin + '/auth')
}
