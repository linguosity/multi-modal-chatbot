import { cookies as getCookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

export async function createSupabaseServerClient() {
  const store = await getCookies();          // ✅ await here

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,   // 1
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // 2
    {                                        // 3: options object opens
      cookies: {
        get(name: string) {
          return store.get(name)?.value ?? null;
        },
        set(name: string, value: string, options?: CookieOptions) {
          try { store.set({ name, value, ...options }); } catch {}
        },
        remove(name: string, options?: CookieOptions) {
          try { store.delete({ name, ...options }); } catch {}
        }
      }
    }                                        // ← options object closes
  );                                         // ← createServerClient call closes
}                                            // ← function closes (file ends)