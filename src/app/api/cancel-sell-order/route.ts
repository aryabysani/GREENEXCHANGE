import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { listingId } = await request.json()
  if (!listingId) return NextResponse.json({ error: 'Missing listingId' }, { status: 400 })

  // Fetch fresh listing data from DB (not from stale client state)
  const { data: listing, error: fetchErr } = await admin
    .from('listings')
    .select('id, seller_id, status, credits_amount, filled_quantity')
    .eq('id', listingId)
    .single()

  if (fetchErr || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  if (listing.seller_id !== user.id) return NextResponse.json({ error: 'Not your listing' }, { status: 403 })
  if (!['live', 'partial'].includes(listing.status)) return NextResponse.json({ error: 'Listing cannot be cancelled' }, { status: 400 })

  // Mark listing as removed
  const { error: updateErr } = await admin
    .from('listings')
    .update({ status: 'removed' })
    .eq('id', listingId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Refund unfilled credits to seller's balance (using fresh DB values)
  const unfilledCredits = listing.credits_amount - (listing.filled_quantity ?? 0)
  if (unfilledCredits > 0) {
    const { data: profile } = await admin.from('profiles').select('carbon_balance').eq('id', user.id).single()
    const newBalance = (profile?.carbon_balance ?? 0) + unfilledCredits
    await admin.from('profiles').update({ carbon_balance: newBalance }).eq('id', user.id)
  }

  return NextResponse.json({ success: true, unfilledCredits })
}
