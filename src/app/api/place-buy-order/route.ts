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

async function matchBuyOrder(buyOrderId: string, buyerId: string, totalQty: number, maxPrice: number) {
  const { data: sellOrders } = await admin
    .from('listings')
    .select('*')
    .neq('status', 'sold')
    .neq('status', 'removed')
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

    // Seller balance already deducted upfront when listing was placed — no deduction here

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

  return { filled: filledSoFar, cancelledOthers: false }
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const userClient = createServerClient(
    getServerSupabaseUrl(),
    getSupabaseAnonKey(),
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

  const { filled: matched, cancelledOthers } = await matchBuyOrder(buyOrder.id, user.id, quantity, pricePerCredit)

  return NextResponse.json({ success: true, buyOrderId: buyOrder.id, matched, cancelledOthers })
}
