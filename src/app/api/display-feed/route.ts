import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
)

export async function GET() {
  try {
    // 1. Fetch Listings (Sells)
    const { data: listings } = await admin
      .from('listings')
      .select('id, credits_amount, filled_quantity, price_per_credit, seller_id')
      .eq('status', 'live')
      .order('price_per_credit', { ascending: true })
    
    // 2. Fetch Buy Orders (Bids)
    const { data: bids } = await admin
      .from('buy_orders')
      .select('id, quantity, filled_quantity, price_per_credit, buyer_id')
      .in('status', ['open', 'partial'])
      .order('price_per_credit', { ascending: false })

    // 3. Fetch Recent Trades
    const { data: txs } = await admin
      .from('transactions')
      .select('id, credits_amount, price_per_credit, total_price, created_at, seller_id, buyer_id')
      .order('created_at', { ascending: false })
      .limit(10)

    // 4. Batch fetch profiles for all unique IDs
    const allIds = Array.from(new Set([
      ...(listings ?? []).map(l => l.seller_id),
      ...(bids ?? []).map(b => b.buyer_id),
      ...(txs ?? []).flatMap(t => [t.seller_id, t.buyer_id])
    ].filter(Boolean)))

    let nameMap: Record<string, string> = {}
    if (allIds.length > 0) {
      const { data: profs } = await admin.from('profiles').select('id, stall_name, team_username').in('id', allIds)
      for (const p of profs ?? []) {
        nameMap[p.id] = p.team_username || p.stall_name || '—'
      }
    }

    const payload = {
      sellOrders: (listings ?? []).map((l: any) => ({
        ...l,
        stall_name: nameMap[l.seller_id] ?? '—'
      })).slice(0, 50),
      buyOrders: (bids ?? []).map((b: any) => ({
        ...b,
        stall_name: nameMap[b.buyer_id] ?? '—'
      })).slice(0, 50),
      trades: (txs ?? []).map((t: any) => ({
        ...t,
        buyer_name: nameMap[t.buyer_id] ?? '—',
        seller_name: nameMap[t.seller_id] ?? '—'
      })).slice(0, 50)
    }

    return NextResponse.json(payload)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
