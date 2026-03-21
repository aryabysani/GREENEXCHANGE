import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: single, error } = await admin.from('system_settings').select('value').eq('key', 'trading_active').single()
  const { data: all } = await admin.from('system_settings').select('*')
  return NextResponse.json(
    {
      active: single?.value === 'true',
      _debug: { raw: single?.value, error: error?.message, allRows: all, url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 40) }
    },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache' } }
  )
}
