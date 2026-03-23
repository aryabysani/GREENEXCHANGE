import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function matchSellOrder(listingId: string, sellerId: string, totalQty: number, askPrice: number) {
  const { data: buyOrders } = await admin
    .from('buy_orders')
    .select('*')
    .in('status', ['open', 'partial'])
    .gte('price_per_credit', askPrice)
    .order('price_per_credit', { ascending: false })
    .order('created_at', { ascending: true })

  let remainingQty = totalQty
  const cancelledBuyers = new Set<string>()

  for (const bo of buyOrders ?? []) {
    if (remainingQty <= 0) break
    if (cancelledBuyers.has(bo.buyer_id)) continue
    const available = bo.quantity - bo.filled_quantity
    if (available <= 0) continue
    const fillQty = Math.min(remainingQty, available)
    const tradePrice = askPrice

    await admin.from('buy_orders').update({
      filled_quantity: bo.filled_quantity + fillQty,
      status: bo.filled_quantity + fillQty >= bo.quantity ? 'filled' : 'partial',
    }).eq('id', bo.id)

    const { data: bp } = await admin.from('profiles').select('carbon_balance').eq('id', bo.buyer_id).single()
    const newBuyerBalance = (bp?.carbon_balance ?? 0) + fillQty
    await admin.from('profiles').update({ carbon_balance: newBuyerBalance }).eq('id', bo.buyer_id)

    await admin.from('transactions').insert({
      listing_id: listingId,
      buy_order_id: bo.id,
      buyer_id: bo.buyer_id,
      seller_id: sellerId,
      credits_amount: fillQty,
      price_per_credit: tradePrice,
      total_price: fillQty * tradePrice,
    })

    // Auto-cancel buyer's remaining open buy orders if balance is now non-negative
    if (newBuyerBalance >= 0) {
      await admin.from('buy_orders').update({ status: 'cancelled' }).eq('buyer_id', bo.buyer_id).in('status', ['open', 'partial'])
      cancelledBuyers.add(bo.buyer_id)
    }

    remainingQty -= fillQty
  }

  const filledSoFar = totalQty - remainingQty
  if (filledSoFar > 0) {
    await admin.from('listings').update({
      filled_quantity: filledSoFar,
      status: filledSoFar >= totalQty ? 'sold' : 'partial',
    }).eq('id', listingId)

    // Deduct only what was actually sold from seller's balance
    const { data: sp } = await admin.from('profiles').select('carbon_balance').eq('id', sellerId).single()
    await admin.from('profiles').update({ carbon_balance: (sp?.carbon_balance ?? 0) - filledSoFar }).eq('id', sellerId)
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

  const { data: profile } = await admin.from('profiles').select('carbon_balance, is_banned').eq('id', user.id).single()
  if (profile?.is_banned) return NextResponse.json({ error: 'Your account is banned.' }, { status: 403 })
  if (profile?.carbon_balance == null) return NextResponse.json({ error: 'Your carbon balance has not been set by admin yet.' }, { status: 400 })

  // Account for credits already committed in active listings
  const { data: activeListings } = await admin.from('listings').select('credits_amount, filled_quantity').eq('seller_id', user.id).in('status', ['live', 'partial'])
  const alreadyListed = (activeListings ?? []).reduce((sum, l) => sum + (l.credits_amount - (l.filled_quantity ?? 0)), 0)
  const availableBalance = profile.carbon_balance - alreadyListed
  if (availableBalance < quantity) return NextResponse.json({ error: `You only have ${availableBalance} credits available (${alreadyListed} already listed).` }, { status: 400 })

  const { data: listing, error: insertError } = await admin.from('listings').insert({
    seller_id: user.id,
    credits_amount: quantity,
    price_per_credit: pricePerCredit,
    total_price: quantity * pricePerCredit,
    status: 'live',
    filled_quantity: 0,
    is_hidden: false,
  }).select().single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  const matched = await matchSellOrder(listing.id, user.id, quantity, pricePerCredit)

  return NextResponse.json({ success: true, listingId: listing.id, matched })
}
