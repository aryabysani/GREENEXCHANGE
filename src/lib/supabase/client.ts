import { createBrowserClient } from '@supabase/ssr'
import { getPublicSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/env'

export function createClient() {
  return createBrowserClient(
    getPublicSupabaseUrl(),
    getSupabaseAnonKey()
  )
}
