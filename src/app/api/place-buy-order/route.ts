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
    .in('status', ['live', 'partial'])
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
    const newFilled = (sell.filled_quantity ?? 0) + fillQty

    await admin.from('listings').update(
      newFilled >= sell.credits_amount
        ? { filled_quantity: newFilled, status: 'sold' }
        : { filled_quantity: newFilled }
    ).eq('id', sell.id)

    const { data: bp } = await admin.from('profiles').select('carbon_balance').eq('id', buyerId).single()
    await admin.from('profiles').update({ carbon_balance: (bp?.carbon_balance ?? 0) + fillQty }).eq('id', buyerId)

    const { data: sp } = await admin.from('profiles').select('carbon_balance').eq('id', sell.seller_id).single()
    await admin.from('profiles').update({ carbon_balance: (sp?.carbon_balance ?? 0) - fillQty }).eq('id', sell.seller_id)

    await admin.from('transactions').insert({
      listing_id: sell.id,
      buy_order_id: buyOrderId,
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
  let cancelledOthers = false
  if (finalProfile?.carbon_balance != null && finalProfile.carbon_balance >= 0) {
    const { data: cancelled } = await admin
      .from('buy_orders')
      .update({ status: 'cancelled' })
      .eq('buyer_id', buyerId)
      .in('status', ['open', 'partial'])
      .neq('id', buyOrderId)
      .select('id')
    cancelledOthers = (cancelled?.length ?? 0) > 0
  }

  return { filled: filledSoFar, cancelledOthers }
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

  const { data: profile } = await admin.from('profiles').select('carbon_balance, is_banned').eq('id', user.id).single()
  if (profile?.is_banned) return NextResponse.json({ error: 'Your account is banned.' }, { status: 403 })
  if (profile?.carbon_balance == null) return NextResponse.json({ error: 'Your carbon balance has not been set by admin yet.' }, { status: 400 })
  if (profile.carbon_balance >= 0) return NextResponse.json({ error: 'Your balance is not in deficit. Only teams with a carbon deficit can place buy orders.' }, { status: 400 })

  const { quantity, pricePerCredit } = await request.json()
  if (!quantity || quantity <= 0) return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
  if (!pricePerCredit || pricePerCredit <= 0) return NextResponse.json({ error: 'Invalid price' }, { status: 400 })

  // Account for credits already committed in open buy orders
  const { data: activeBuyOrders } = await admin.from('buy_orders').select('quantity, filled_quantity').eq('buyer_id', user.id).in('status', ['open', 'partial'])
  const alreadyOrdered = (activeBuyOrders ?? []).reduce((sum, o) => sum + (o.quantity - (o.filled_quantity ?? 0)), 0)
  const maxAllowed = Math.abs(profile.carbon_balance) - alreadyOrdered
  if (maxAllowed <= 0) return NextResponse.json({ error: 'You already have open buy orders covering your full deficit.' }, { status: 400 })
  if (quantity > maxAllowed) return NextResponse.json({ error: `You can only buy up to ${maxAllowed} more credits (deficit already partially covered by open orders).` }, { status: 400 })

  const { data: buyOrder, error: insertError } = await admin.from('buy_orders').insert({
    buyer_id: user.id,
    quantity,
    price_per_credit: pricePerCredit,
    filled_quantity: 0,
    status: 'open',
  }).select().single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  const { filled: matched, cancelledOthers } = await matchBuyOrder(buyOrder.id, user.id, quantity, pricePerCredit)

  return NextResponse.json({ success: true, buyOrderId: buyOrder.id, matched, cancelledOthers })
}
