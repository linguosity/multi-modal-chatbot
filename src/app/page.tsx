'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  useEffect(() => {
    // Temporarily disable root page auth redirect to prevent conflicts
    // Let middleware and auth pages handle redirects
    console.log("Root page loaded - letting middleware handle auth redirects");
    
    // Simple redirect to dashboard for now - middleware will handle auth
    router.replace('/dashboard');
  }, [router]);
  
  // Simple loading screen
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mb-4 font-medium text-xl">Linguosity</div>
      <div className="animate-pulse text-gray-500">Redirecting...</div>
    </div>
  );
}