import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  getServerSupabaseUrl,
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
} from '@/lib/supabase/env'

const admin = createClient(
  getServerSupabaseUrl(),
  getSupabaseServiceRoleKey()
)

export async function GET() {
  const cookieStore = await cookies()
  const userClient = createServerClient(
    getServerSupabaseUrl(),
    getSupabaseAnonKey(),
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ user: null })

  const { data: profile } = await admin
    .from('profiles')
    .select('carbon_balance, is_banned, team_username')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ user: { id: user.id, ...profile } })
}
