'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from './button';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  };

  return <Button onClick={handleSignOut}>Sign Out</Button>;
}
