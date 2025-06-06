import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabaseTypes'

// Browser client for client-side operations
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Default client instance for backward compatibility
export const supabase = createClient()