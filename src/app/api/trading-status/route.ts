import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await admin.from('system_settings').select('value').eq('key', 'trading_active').single()
  return NextResponse.json(
    {
      active: data?.value === 'true',
      _debug: { raw: data?.value, error: error?.message, url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 40) }
    },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache' } }
  )
}
