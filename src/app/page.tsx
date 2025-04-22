'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabaseTypes';

export default function Home() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  useEffect(() => {
    // Don't try to redirect multiple times
    if (isRedirecting) return;
    
    setIsRedirecting(true);
    
    const checkAuth = async () => {
      try {
        const supabase = createClientComponentClient<Database>();
        
        // Check for session first
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session) {
          console.log("User has active session, redirecting to dashboard");
          router.replace('/dashboard');
          return;
        }
        
        // No session - try to get user as fallback
        try {
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData?.user) {
            console.log("Found user via getUser, redirecting to dashboard");
            router.replace('/dashboard');
            return;
          }
        } catch (userError) {
          // Ignore errors from getUser - just means not logged in
        }
        
        // If we get here, user is not logged in
        console.log("No auth detected, redirecting to login page");
        router.replace('/auth');
      } catch (error) {
        console.error("Auth check error:", error);
        
        // On error, go to login page as fallback
        router.replace('/auth');
      }
    };
    
    // Run the check
    checkAuth();
  }, [router, isRedirecting]);
  
  // Simple loading screen
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mb-4 font-medium text-xl">Linguosity</div>
      <div className="animate-pulse text-gray-500">Redirecting...</div>
    </div>
  );
}