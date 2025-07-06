'use client';

import { createBrowserSupabase } from '@/lib/supabase/browser'; // Adjust the import path as necessary
import { Button } from './button'; // Assuming you have a button component

export function GoogleSignInButton() {
  const supabase = createBrowserSupabase();

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
