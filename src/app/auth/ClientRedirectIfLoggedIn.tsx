// src/app/auth/ClientRedirectIfLoggedIn.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabaseTypes'

export function ClientRedirectIfLoggedIn({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    console.log('🔍 ClientRedirectIfLoggedIn: Checking auth status');
    const supabase = createClientComponentClient<Database>()

    async function checkSession() {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        console.log('🔍 Auth session data:', data ? 'Found' : 'Not found', error ? `Error: ${error.message}` : '');
        
        if (data.session) {
          console.log('🔍 User is authenticated, redirecting to dashboard');
          setIsAuthenticated(true)
          // Add a small delay to ensure the router is ready
          setTimeout(() => {
            router.push('/dashboard')
          }, 100)
        } else {
          console.log('🔍 User is not authenticated, showing login page');
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('⚠️ Error checking session:', error);
      } finally {
        setLoading(false)
        console.log('🔍 Auth check completed');
      }
    }

    checkSession()
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔍 Auth state changed:', event);
      if (event === 'SIGNED_IN' && session) {
        console.log('🔍 User signed in, redirecting to dashboard');
        router.push('/dashboard')
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router]);

  // If still loading, show loading indicator
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="mb-4 text-xl font-medium">Linguosity</div>
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  // If authenticated, show a redirecting message (though we should rarely see this)
  if (isAuthenticated) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="mb-4 text-xl font-medium">Linguosity</div>
        <div className="animate-pulse text-gray-500">Redirecting to dashboard...</div>
      </div>
    );
  }

  // Otherwise, show the login/signup form
  return <>{children}</>;
}