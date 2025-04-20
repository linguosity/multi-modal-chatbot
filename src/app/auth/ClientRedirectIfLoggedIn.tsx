// src/components/auth/ClientRedirectIfLoggedIn.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/browser'

export function ClientRedirectIfLoggedIn() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createBrowserClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/dashboard')
      }
    })
  }, [router])

  return null
}