// src/app/auth/page.tsx
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AuthClient from './AuthClient'

export default async function AuthPage() {
  console.log('Auth Page: Server component rendering')
  // Initialize your SSR Supabase client
  const supabase = await createClient()

  // Fetch the verified user (never use getSession() on the server)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  console.log(`Auth Page: User authenticated: ${!!user}, Error: ${error?.message || 'none'}`)

  // If there's an authenticated user, send them to the dashboard
  if (user) {
    console.log('Auth Page: User found, redirecting to /dashboard')
    redirect('/dashboard')
  }

  // Otherwise, show the AuthClient (login/signup) UI
  return <AuthClient />
}