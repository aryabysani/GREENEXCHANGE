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

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const userClient = createServerClient(
    getServerSupabaseUrl(),
    getSupabaseAnonKey(),
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { orderId } = await request.json()
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

  // Fetch the order and verify ownership
  const { data: order, error: fetchErr } = await admin
    .from('buy_orders')
    .select('id, buyer_id, status')
    .eq('id', orderId)
    .single()

  if (fetchErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.buyer_id !== user.id) return NextResponse.json({ error: 'Not your order' }, { status: 403 })
  if (!['open', 'partial'].includes(order.status)) return NextResponse.json({ error: 'Order cannot be cancelled' }, { status: 400 })

  const { error: updateErr } = await admin
    .from('buy_orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
