'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
