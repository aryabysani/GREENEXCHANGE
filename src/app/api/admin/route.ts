import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
  const { secret, action, id } = await request.json()

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── get-profiles ────────────────────────────────────────────
  if (action === 'get-profiles') {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('stall_name')
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
      .select('*, profiles(stall_name)')
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

    // Hide all live listings from this stall
    await supabase
      .from('listings')
      .update({ is_hidden: true })
      .eq('seller_id', id)
      .eq('status', 'live')

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
        stall_name: 'Stall (Reset)',
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
      .select('id, credits_amount, total_price, created_at, seller_id, buyer_id')
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
    // Try update first (row should exist from migration seed)
    const { error: updateErr } = await supabase
      .from('system_settings')
      .update({ value: newValue })
      .eq('key', 'trading_active')
    if (updateErr) {
      // Row missing — insert it
      const { error: insertErr } = await supabase
        .from('system_settings')
        .insert({ key: 'trading_active', value: newValue })
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }
    // Read back to confirm
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

  // ── get-buy-orders ─────────────────────────────────────────────
  if (action === 'get-buy-orders') {
    const { data, error } = await supabase
      .from('buy_orders')
      .select('*, profiles(stall_name)')
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
