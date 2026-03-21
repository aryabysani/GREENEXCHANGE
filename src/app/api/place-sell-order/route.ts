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

  for (const bo of buyOrders ?? []) {
    if (remainingQty <= 0) break
    const available = bo.quantity - bo.filled_quantity
    if (available <= 0) continue
    const fillQty = Math.min(remainingQty, available)
    const tradePrice = askPrice

    await admin.from('buy_orders').update({
      filled_quantity: bo.filled_quantity + fillQty,
      status: bo.filled_quantity + fillQty >= bo.quantity ? 'filled' : 'partial',
    }).eq('id', bo.id)

    const { data: bp } = await admin.from('profiles').select('carbon_balance').eq('id', bo.buyer_id).single()
    await admin.from('profiles').update({ carbon_balance: (bp?.carbon_balance ?? 0) + fillQty }).eq('id', bo.buyer_id)

    await admin.from('transactions').insert({
      listing_id: listingId,
      buyer_id: bo.buyer_id,
      seller_id: sellerId,
      credits_amount: fillQty,
      price_per_credit: tradePrice,
      total_price: fillQty * tradePrice,
    })

    remainingQty -= fillQty
  }

  const filledSoFar = totalQty - remainingQty
  if (filledSoFar > 0) {
    await admin.from('listings').update({
      filled_quantity: filledSoFar,
      status: filledSoFar >= totalQty ? 'sold' : 'live',
    }).eq('id', listingId)
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

  const { quantity, pricePerCredit, description } = await request.json()
  if (!quantity || quantity <= 0) return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
  if (!pricePerCredit || pricePerCredit <= 0) return NextResponse.json({ error: 'Invalid price' }, { status: 400 })

  const { data: profile } = await admin.from('profiles').select('carbon_balance, whatsapp_number').eq('id', user.id).single()
  if (profile?.carbon_balance == null) return NextResponse.json({ error: 'Your carbon balance has not been set by admin yet.' }, { status: 400 })
  if (profile.carbon_balance < quantity) return NextResponse.json({ error: `You only have ${profile.carbon_balance} credits available.` }, { status: 400 })
  if (!profile.whatsapp_number) return NextResponse.json({ error: 'Add your WhatsApp number in Profile first.' }, { status: 400 })

  const { data: listing, error: insertError } = await admin.from('listings').insert({
    seller_id: user.id,
    credits_amount: quantity,
    price_per_credit: pricePerCredit,
    total_price: quantity * pricePerCredit,
    description: description?.trim() || null,
    status: 'live',
    filled_quantity: 0,
  }).select().single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  await admin.from('profiles').update({ carbon_balance: profile.carbon_balance - quantity }).eq('id', user.id)

  const matched = await matchSellOrder(listing.id, user.id, quantity, pricePerCredit)

  return NextResponse.json({ success: true, listingId: listing.id, matched })
}
