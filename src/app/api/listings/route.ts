import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
)

export async function GET() {
  const { data: listings, error } = await admin
    .from('listings')
    .select('*')
    .neq('status', 'sold')
    .neq('status', 'removed')
    .eq('is_hidden', false)
    .order('price_per_credit', { ascending: true })

  if (error) return NextResponse.json([], { status: 200 })
  if (!listings || listings.length === 0) return NextResponse.json([])

  // Fetch seller names separately
  const sellerIds = [...new Set(listings.map((l: { seller_id: string }) => l.seller_id))]
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, team_username')
    .in('id', sellerIds)

  const nameMap: Record<string, string> = {}
  for (const p of profiles ?? []) nameMap[p.id] = p.team_username

  return NextResponse.json(
    listings.map((l: { seller_id: string }) => ({ ...l, profiles: { team_username: nameMap[l.seller_id] ?? '—' } }))
  )
}
