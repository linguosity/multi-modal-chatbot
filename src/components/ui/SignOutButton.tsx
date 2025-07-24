'use client';

import { Button } from './button';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
      }
      
      // Clear any local storage data
      localStorage.clear();
      
      // Navigate to auth page
      router.push('/auth');
      router.refresh();
      
      // Force a full page reload to ensure clean state
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
      
    } catch (error) {
      console.error('Sign out failed:', error);
      // Force navigation as fallback
      localStorage.clear();
      window.location.href = '/auth';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSignOut} 
      disabled={isLoading}
      type="button"
      variant="outline"
    >
      {isLoading ? 'Signing Out...' : 'Sign Out'}
    </Button>
  );
}
