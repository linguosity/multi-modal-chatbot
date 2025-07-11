import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createRouteSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value ?? null,
        set: (name, value, opts) => {
          try {
            cookieStore.set({ name, value, ...opts })
          } catch (error) {
            console.warn({ error }, 'Error setting cookie in Route Handler')
          }
        },
        remove: (name, opts) => {
          try {
            cookieStore.delete({ name, ...opts })
          } catch (error) {
            console.warn({ error }, 'Error removing cookie in Route Handler')
          }
        },
      },
    },
  )
}