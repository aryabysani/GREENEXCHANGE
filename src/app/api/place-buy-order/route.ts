import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function matchBuyOrder(buyOrderId: string, buyerId: string, totalQty: number, maxPrice: number) {
  const { data: sellOrders } = await admin
    .from('listings')
    .select('*')
    .eq('status', 'live')
    .eq('is_hidden', false)
    .lte('price_per_credit', maxPrice)
    .order('price_per_credit', { ascending: true })
    .order('created_at', { ascending: true })

  let remainingQty = totalQty

  for (const sell of sellOrders ?? []) {
    if (remainingQty <= 0) break
    const available = sell.credits_amount - (sell.filled_quantity ?? 0)
    if (available <= 0) continue
    const fillQty = Math.min(remainingQty, available)
    const tradePrice = Number(sell.price_per_credit)

    await admin.from('listings').update({
      filled_quantity: (sell.filled_quantity ?? 0) + fillQty,
      status: (sell.filled_quantity ?? 0) + fillQty >= sell.credits_amount ? 'sold' : 'live',
    }).eq('id', sell.id)

    const { data: bp } = await admin.from('profiles').select('carbon_balance').eq('id', buyerId).single()
    await admin.from('profiles').update({ carbon_balance: (bp?.carbon_balance ?? 0) + fillQty }).eq('id', buyerId)

    await admin.from('transactions').insert({
      listing_id: sell.id,
      buyer_id: buyerId,
      seller_id: sell.seller_id,
      credits_amount: fillQty,
      price_per_credit: tradePrice,
      total_price: fillQty * tradePrice,
    })

    remainingQty -= fillQty
  }

  const filledSoFar = totalQty - remainingQty
  await admin.from('buy_orders').update({
    filled_quantity: filledSoFar,
    status: filledSoFar >= totalQty ? 'filled' : (filledSoFar > 0 ? 'partial' : 'open'),
  }).eq('id', buyOrderId)

  // Auto-cancel remaining buy orders if buyer's balance is now non-negative
  const { data: finalProfile } = await admin.from('profiles').select('carbon_balance').eq('id', buyerId).single()
  if (finalProfile?.carbon_balance != null && finalProfile.carbon_balance >= 0) {
    await admin.from('buy_orders').update({ status: 'cancelled' }).eq('buyer_id', buyerId).in('status', ['open', 'partial']).neq('id', buyOrderId)
  }

  return filledSoFar
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: setting } = await admin.from('system_settings').select('value').eq('key', 'trading_active').single()
  if (setting?.value !== 'true') {
    return NextResponse.json({ error: 'Trading is currently paused. Check back during trading hours.' }, { status: 403 })
  }

  const { quantity, pricePerCredit } = await request.json()
  if (!quantity || quantity <= 0) return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
  if (!pricePerCredit || pricePerCredit <= 0) return NextResponse.json({ error: 'Invalid price' }, { status: 400 })

  const { data: buyOrder, error: insertError } = await admin.from('buy_orders').insert({
    buyer_id: user.id,
    quantity,
    price_per_credit: pricePerCredit,
    filled_quantity: 0,
    status: 'open',
  }).select().single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  const matched = await matchBuyOrder(buyOrder.id, user.id, quantity, pricePerCredit)

  return NextResponse.json({ success: true, buyOrderId: buyOrder.id, matched })
}
