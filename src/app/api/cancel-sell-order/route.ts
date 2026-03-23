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

  const { data: listing, error: fetchErr } = await admin
    .from('listings')
    .select('id, seller_id, status, credits_amount, filled_quantity')
    .eq('id', listingId)
    .single()

  if (fetchErr || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  if (listing.seller_id !== user.id) return NextResponse.json({ error: 'Not your listing' }, { status: 403 })
  if (!['live', 'partial'].includes(listing.status)) return NextResponse.json({ error: 'Listing cannot be cancelled' }, { status: 400 })

  // Refund the unfilled credits back to seller's balance
  const unfilledCredits = listing.credits_amount - (listing.filled_quantity ?? 0)
  if (unfilledCredits > 0) {
    const { data: sp } = await admin.from('profiles').select('carbon_balance').eq('id', user.id).single()
    await admin.from('profiles').update({ carbon_balance: (sp?.carbon_balance ?? 0) + unfilledCredits }).eq('id', user.id)
  }

  const { error: updateErr } = await admin
    .from('listings')
    .update({ status: 'removed' })
    .eq('id', listingId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ success: true, unfilledCredits })
}
