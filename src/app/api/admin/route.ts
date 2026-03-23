import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function makeClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) } }
  )
}

async function revokeUserSessions(userId: string) {
  // Revoke all refresh tokens for this user so they are kicked out immediately
  await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}/sessions`,
    {
      method: 'DELETE',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
    }
  )
}

export async function POST(request: Request) {
  const supabase = makeClient()
  const { secret, action, id } = await request.json()

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── get-profiles ────────────────────────────────────────────
  if (action === 'get-profiles') {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('team_username')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const emailMap: Record<string, string> = {}
    if (!usersError && users) {
      for (const u of users) {
        emailMap[u.id] = (u.email ?? '').replace('@fest.com', '')
      }
    }

    const enriched = (data ?? []).map((p: Record<string, unknown>) => ({
      ...p,
      username: emailMap[p.id as string] ?? '',
    }))
    return NextResponse.json({ data: enriched })
  }

  // ── get-listings ─────────────────────────────────────────────
  if (action === 'get-listings') {
    const { data, error } = await supabase
      .from('listings')
      .select('*, profiles(team_username)')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  // ── ban ──────────────────────────────────────────────────────
  if (action === 'ban') {
    // Mark profile as banned
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ is_banned: true })
      .eq('id', id)
    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })

    // Hide all live/partial listings from this stall
    await supabase
      .from('listings')
      .update({ is_hidden: true })
      .eq('seller_id', id)
      .neq('status', 'sold')
      .neq('status', 'removed')

    // Kick the user out of all active sessions
    await revokeUserSessions(id)

    return NextResponse.json({ success: true })
  }

  // ── unban ────────────────────────────────────────────────────
  if (action === 'unban') {
    // Remove ban
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ is_banned: false })
      .eq('id', id)
    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })

    // Restore all hidden listings for this stall back to live
    await supabase
      .from('listings')
      .update({ is_hidden: false })
      .eq('seller_id', id)
      .eq('is_hidden', true)

    return NextResponse.json({ success: true })
  }

  // ── reset-profile ─────────────────────────────────────────────
  if (action === 'reset-profile') {
    // Reset editable fields only — keep team_members
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        carbon_balance: null,
        is_banned: false,
      })
      .eq('id', id)
    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })

    // Remove all their listings (clean slate)
    await supabase
      .from('listings')
      .update({ status: 'removed' })
      .eq('seller_id', id)
      .neq('status', 'removed')

    // Kick the user out so they go through onboarding again on next login
    await revokeUserSessions(id)

    return NextResponse.json({ success: true })
  }

  // ── get-transactions ──────────────────────────────────────────
  if (action === 'get-transactions') {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, credits_amount, price_per_credit, total_price, created_at, seller_id, buyer_id, listing_id, buy_order_id, reversed')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Build username map from auth
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const usernameMap: Record<string, string> = {}
    for (const u of users) {
      usernameMap[u.id] = (u.email ?? '').replace('@fest.com', '')
    }

    const enriched = (data ?? []).map((t: Record<string, unknown>) => ({
      ...t,
      seller_username: usernameMap[t.seller_id as string] ?? '—',
      buyer_username: usernameMap[t.buyer_id as string] ?? '—',
    }))

    return NextResponse.json({ data: enriched })
  }

  // ── reverse-transaction ───────────────────────────────────────
  if (action === 'reverse-transaction') {
    const { data: txn, error: txnErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single()
    if (txnErr || !txn) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    if (txn.reversed) return NextResponse.json({ error: 'Already reversed' }, { status: 400 })

    const qty = txn.credits_amount

    // Restore seller's balance
    const { data: seller } = await supabase.from('profiles').select('carbon_balance').eq('id', txn.seller_id).single()
    await supabase.from('profiles').update({ carbon_balance: (seller?.carbon_balance ?? 0) + qty }).eq('id', txn.seller_id)

    // Deduct buyer's balance
    const { data: buyer } = await supabase.from('profiles').select('carbon_balance').eq('id', txn.buyer_id).single()
    await supabase.from('profiles').update({ carbon_balance: (buyer?.carbon_balance ?? 0) - qty }).eq('id', txn.buyer_id)

    // Fix listing filled_quantity and status
    if (txn.listing_id) {
      const { data: listing } = await supabase.from('listings').select('credits_amount, filled_quantity, status').eq('id', txn.listing_id).single()
      if (listing) {
        const newFilled = Math.max(0, (listing.filled_quantity ?? 0) - qty)
        const newStatus = listing.status === 'sold' ? 'live' : listing.status
        await supabase.from('listings').update({ filled_quantity: newFilled, status: newStatus }).eq('id', txn.listing_id)
      }
    }

    // Fix buy order filled_quantity and status
    if (txn.buy_order_id) {
      const { data: bo } = await supabase.from('buy_orders').select('quantity, filled_quantity, status').eq('id', txn.buy_order_id).single()
      if (bo) {
        const newFilled = Math.max(0, (bo.filled_quantity ?? 0) - qty)
        const newStatus = newFilled === 0 ? 'open' : 'partial'
        await supabase.from('buy_orders').update({ filled_quantity: newFilled, status: newStatus }).eq('id', txn.buy_order_id)
      }
    }

    // Mark transaction as reversed
    await supabase.from('transactions').update({ reversed: true }).eq('id', id)

    return NextResponse.json({ success: true })
  }

  // ── remove-listing ────────────────────────────────────────────
  if (action === 'remove-listing') {
    const { error } = await supabase
      .from('listings')
      .update({ status: 'removed' })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  }

  // ── toggle-trading ─────────────────────────────────────────────
  if (action === 'toggle-trading') {
    const { data: current } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'trading_active')
      .single()
    const newValue = current?.value === 'true' ? 'false' : 'true'
    const { data: updated, error: updateErr } = await supabase
      .from('system_settings')
      .update({ value: newValue })
      .eq('key', 'trading_active')
      .select('value')
      .single()
    if (updateErr || !updated) {
      await supabase
        .from('system_settings')
        .insert({ key: 'trading_active', value: newValue })
    }
    const { data: confirmed } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'trading_active')
      .single()
    return NextResponse.json({ active: confirmed?.value === 'true' })
  }

  // ── get-trading-status ─────────────────────────────────────────
  if (action === 'get-trading-status') {
    const { data } = await supabase.from('system_settings').select('value').eq('key', 'trading_active').single()
    return NextResponse.json({ active: data?.value === 'true' })
  }

  // ── get-team-transactions ──────────────────────────────────────
  if (action === 'get-team-transactions') {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, credits_amount, price_per_credit, total_price, created_at, seller_id, buyer_id')
      .or(`seller_id.eq.${id},buyer_id.eq.${id}`)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const allIds = Array.from(new Set((data ?? []).flatMap((t: Record<string, unknown>) => [t.seller_id as string, t.buyer_id as string])))
    const { data: profs } = await supabase.from('profiles').select('id, team_username').in('id', allIds)
    const nameMap: Record<string, string> = {}
    for (const p of profs ?? []) nameMap[p.id] = p.team_username

    const enriched = (data ?? []).map((t: Record<string, unknown>) => ({
      ...t,
      seller_username: nameMap[t.seller_id as string] ?? '—',
      buyer_username: nameMap[t.buyer_id as string] ?? '—',
      role: t.seller_id === id ? 'seller' : 'buyer',
    }))
    return NextResponse.json({ data: enriched })
  }

  // ── get-buy-orders ─────────────────────────────────────────────
  if (action === 'get-buy-orders') {
    const { data, error } = await supabase
      .from('buy_orders')
      .select('*, profiles(team_username)')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const usernameMap: Record<string, string> = {}
    for (const u of users) { usernameMap[u.id] = (u.email ?? '').replace('@fest.com', '') }

    const enriched = (data ?? []).map((o: Record<string, unknown>) => ({
      ...o,
      buyer_username: usernameMap[o.buyer_id as string] ?? '—',
    }))
    return NextResponse.json({ data: enriched })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
