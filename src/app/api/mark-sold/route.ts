import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const { listingId, buyerId } = await request.json()

  // Verify caller is authenticated
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch the listing
  const { data: listing } = await admin
    .from('listings')
    .select('id, seller_id, credits_amount, status')
    .eq('id', listingId)
    .single()

  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  if (listing.seller_id !== user.id) return NextResponse.json({ error: 'Not your listing' }, { status: 403 })
  if (listing.status !== 'live') return NextResponse.json({ error: 'Listing is not live' }, { status: 400 })
  if (buyerId === user.id) return NextResponse.json({ error: 'Cannot sell to yourself' }, { status: 400 })

  // Fetch buyer's current balance
  const { data: buyer } = await admin
    .from('profiles')
    .select('carbon_balance')
    .eq('id', buyerId)
    .single()

  if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })

  // Mark listing as sold with buyer
  await admin
    .from('listings')
    .update({ status: 'sold', buyer_id: buyerId })
    .eq('id', listingId)

  // Add credits to buyer's balance
  const currentBalance = buyer.carbon_balance ?? 0
  await admin
    .from('profiles')
    .update({ carbon_balance: currentBalance + listing.credits_amount })
    .eq('id', buyerId)

  // Record transaction (best-effort)
  await admin.from('transactions').insert({
    listing_id: listingId,
    buyer_id: buyerId,
    seller_id: user.id,
    credits_amount: listing.credits_amount,
  })

  return NextResponse.json({ success: true })
}
