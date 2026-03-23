import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await admin
    .from('listings')
    .select('*, seller:profiles(team_username)')
    .in('status', ['live', 'partial'])
    .eq('is_hidden', false)
    .order('price_per_credit', { ascending: true })

  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data ?? [])
}
