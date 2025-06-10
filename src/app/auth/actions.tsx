// src/app/auth/actions.tsx
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabaseTypes'

// Helper to get origin URL safely on server
function getSiteURL() {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ?? // Set this in .env.local
    process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel
    'http://localhost:3000'; // Default if not set
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  // Make sure to include trailing `/`
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  return url;
}

/**
 * Server action for user login
 */
export async function loginUser(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Input validation
    if (!email || !password) {
      return { error: 'Email and password are required' };
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error: 'Please enter a valid email address' };
    }

    // Create a server client with centralized cookie handling
    const supabase = await createClient();

    if (!supabase) {
      return { error: 'Authentication service unavailable. Please try again.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error) {
      // Provide user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Invalid email or password. Please check your credentials and try again.' };
      }
      if (error.message.includes('Email not confirmed')) {
        return { error: 'Please check your email and confirm your account before signing in.' };
      }
      if (error.message.includes('Too many requests')) {
        return { error: 'Too many login attempts. Please wait a moment before trying again.' };
      }
      
      return { error: 'Login failed. Please try again.' };
    }

    if (!data.user) {
      return { error: 'Authentication failed. Please try again.' };
    }

    return { success: true, user: data.user };
    
  } catch (error) {
    console.error('[Login Action] Unexpected error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/** 
 * Server action for sign-in with redirect
 */
export async function signInAction(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return redirect('/auth?error=missing_credentials')
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return redirect(`/auth?error=${encodeURIComponent(error.message)}`)
  }

  // on success:
  redirect('/dashboard')
}

/**
 * Server action for user signup
 */
export async function signupUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  
  // Create a server client with centralized cookie handling
  const supabase = await createClient();

  // Basic validation
  if (!email || !password) {
    return { error: 'Email and password are required' };
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' };
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }

  if (!supabase) {
      return { error: 'Supabase client could not be initialized.' };
  }

  // Ensure NEXT_PUBLIC_SITE_URL is set in your .env.local
  const origin = getSiteURL();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Use helper function for robust URL generation
      emailRedirectTo: `${origin}auth/callback`,
    }
  });

  if (error) {
    console.error('[Signup Action Error]', error.message);
    // Check for specific errors like user already registered
    if (error.message.includes('User already registered')) {
         return { error: 'An account with this email already exists. Please sign in.' };
    }
    return { error: `Signup failed: ${error.message}` };
  }

  // Handle specific case where user exists but email isn't confirmed
  // Note: data.user might exist even if identities is empty if confirmation is needed
  if (data.user && data.user.identities && data.user.identities.length === 0) {
     // This might indicate email confirmation is needed, not necessarily an error
     console.log('[Signup Action] User created, requires email confirmation:', email);
     // You might want a specific success message indicating confirmation needed
     // The form currently redirects to /register/confirmation, so maybe just return success
     // return { success: true, confirmationNeeded: true };
  }

  console.log('[Signup Action] Success for:', email);
  return { success: true, user: data.user };
}

/**
 * Server action for user logout
 */
export async function logoutUser() {
  console.log('[Logout Action] Starting logout process');
  
  // Create a server client with centralized cookie handling
  const supabase = await createClient();

  if (!supabase) {
    console.error('[Logout Action] Supabase client could not be initialized');
    return { error: 'Logout failed: Server error' };
  }

  try {
    // Use signOut with scope: 'local' to only sign out on this device
    const { error } = await supabase.auth.signOut({ scope: 'local' });

    if (error) {
      console.error('[Logout Action] Error during signOut:', error.message);
      return { error: `Logout failed: ${error.message}` };
    }

    // No need to manually clear cookies - the createServerClientWrapper handles this properly
    // when signOut is called with scope: 'local'
    console.log('[Logout Action] Auth cookies cleared by Supabase');

    console.log('[Logout Action] User successfully signed out');
    
    // Return success instead of redirecting
    // This lets the client handle the redirect to avoid potential issues
    return { success: true };
  } catch (e) {
    console.error('[Logout Action] Unexpected error during logout:', e);
    return { error: 'Logout failed due to an unexpected error' };
  }
}

/**
 * Get the current authenticated user (often used in Server Components/Pages)
 */
export async function getCurrentUser() {
  // Create a server client with centralized cookie handling
  const supabase = await createClient();

  if (!supabase) {
     console.error('[getCurrentUser Error] Supabase client failed');
     return null; // Or throw an error
  }

  try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
          console.error('[getCurrentUser Error]', error.message);
          return null;
      }

      return data?.user ?? null; // Return user or null

  } catch (catchError: any) {
       console.error('[getCurrentUser Catch Error]', catchError.message);
       return null;
  }
}