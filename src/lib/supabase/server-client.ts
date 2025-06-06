// src/lib/supabase/server-client.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabaseTypes'

export async function createServerClientReadOnly() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          cookieStore.getAll().map((c) => ({
            name: c.name,
            value: c.value,
          })),
        // 🧯 This is defensive — logs if Supabase tries to write in the wrong context
        setAll: (cookiesToSet) => {
          console.warn('[Supabase Warning] setAll was called from a read-only context. This should only happen in route handlers or server actions.');
        },
      },
    }
  )
}