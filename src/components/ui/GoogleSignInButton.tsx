'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from './button'; // Assuming you have a button component

export function GoogleSignInButton() {
  const supabase = createClient();

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  return <Button onClick={handleSignIn}>Sign in with Google</Button>;
}
