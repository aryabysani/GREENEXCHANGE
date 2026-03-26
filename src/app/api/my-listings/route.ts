import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  getServerSupabaseUrl,
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
} from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

const admin = createClient(
  getServerSupabaseUrl(),
  getSupabaseServiceRoleKey(),
  { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
)

export async function GET() {
  const cookieStore = await cookies()
  const userClient = createServerClient(
    getServerSupabaseUrl(),
    getSupabaseAnonKey(),
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data, error } = await admin
    .from('listings')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
