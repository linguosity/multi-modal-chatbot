/**
 * Unified Supabase client exports following current best practices
 * Based on https://supabase.com/docs/guides/auth/server-side/nextjs
 * 
 * Note: Only exports client-side safe modules by default
 * Import server client directly: import { createClient } from '@/lib/supabase/server'
 */

// Re-export client creators from client module only (safe for client components)
export { createClient as createBrowserClient, supabase } from './client'

// Default export for general use (browser client)
export { createClient, supabase as default } from './client'

// Types
export type { Database } from '@/types/supabaseTypes'