import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getServerSupabaseUrl, getSupabaseServiceRoleKey } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = createClient(
    getServerSupabaseUrl(),
    getSupabaseServiceRoleKey(),
    { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
  )
  const { data: single } = await admin.from('system_settings').select('value').eq('key', 'trading_active').single()
  return NextResponse.json(
    { active: single?.value === 'true' },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache' } }
  )
}
