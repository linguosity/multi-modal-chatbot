import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { Database } from '@/types/supabaseTypes';
import { redirect } from 'next/navigation';

// Default cookie options to ensure consistency across server components
const defaultCookieOptions = {
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 1 week
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production"
};

/**
 * Creates a Supabase server client using the provided cookie store
 */
export async function createClient(cookieStore: ReadonlyRequestCookies) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          try {
            const cookie = await cookieStore.get(name);
            return cookie?.value;
          } catch (error) {
            console.warn('Error getting cookie', error);
            return undefined;
          }
        },
        async set(name: string, value: string, options: any) {
          try {
            const mergedOptions = { ...defaultCookieOptions, ...options };
            cookieStore.set({ name, value, ...mergedOptions });
          } catch (error) {
            // In production, setting cookies in middleware or server actions may throw
            // This is a known issue: https://github.com/vercel/next.js/issues/49259
            console.warn('Error setting cookie', error);
          }
        },
        async remove(name: string, options: any) {
          try {
            // In Next.js server components, we should use delete instead of set with empty value
            cookieStore.delete(name);
          } catch (error) {
            console.warn('Error removing cookie', error);
          }
        },
      },
    }
  );
}

/**
 * Thoroughly checks authentication status using both getUser and getSession
 * Returns the user object if authenticated, null if not
 */
export async function getAuthenticatedUser(cookieStore: ReadonlyRequestCookies) {
  const supabase = await createClient(cookieStore);
  
  // Check both methods for maximum reliability
  const [userResponse, sessionResponse] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession()
  ]);
  
  const user = userResponse.data?.user;
  const session = sessionResponse.data?.session;
  
  // User is authenticated if either check succeeds
  if (user || session?.user) {
    // Return the user from whichever source has it
    return user || session?.user || null;
  }
  
  return null;
}

/**
 * Verifies user authentication and redirects to login if not authenticated
 * Returns the authenticated user for further use in the component
 */
export async function requireAuth(cookieStore: ReadonlyRequestCookies) {
  const user = await getAuthenticatedUser(cookieStore);
  
  if (!user) {
    redirect('/auth');
  }
  
  return user;
}

/**
 * Checks if user is authenticated and redirects to dashboard if so
 */
export async function redirectIfAuthenticated(cookieStore: ReadonlyRequestCookies) {
  const user = await getAuthenticatedUser(cookieStore);
  
  if (user) {
    redirect('/dashboard');
  }
  
  return null;
}