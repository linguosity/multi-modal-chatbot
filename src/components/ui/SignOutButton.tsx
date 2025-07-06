'use client';

import { createBrowserSupabase } from '@/lib/supabase/browser';
import { Button } from './button';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const supabase = createBrowserSupabase();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/auth');
    router.refresh();
  };

  return <Button onClick={handleSignOut}>Sign Out</Button>;
}
