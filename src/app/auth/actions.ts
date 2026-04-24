'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();
  const origin = (await headers()).get('origin') || 'http://localhost:3000';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return redirect('/auth?error=' + encodeURIComponent(error.message));
  }

  return redirect(data.url);
}

export async function signOut() {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, we should still redirect
    }
    
    revalidatePath('/', 'layout');
    redirect('/auth');
  } catch (error) {
    console.error('Sign out failed:', error);
    // Force redirect even if sign out fails
    redirect('/auth');
  }
}
