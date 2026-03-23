'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type BuyOrder = {
  id: string
  quantity: number
  filled_quantity: number
  price_per_credit: number
  status: string
  created_at: string
}

type SellOrder = {
  id: string
  credits_amount: number
  filled_quantity: number
  price_per_credit: number
  status: string
  created_at: string
}

type BuyTrade = {
  id: string
  credits_amount: number
  price_per_credit: number
  total_price: number
  created_at: string
  seller_id: string
  sellerStall?: string
}

type SellTrade = {
  id: string
  credits_amount: number
  price_per_credit: number
  total_price: number
  created_at: string
  buyer_id: string
  buyerStall?: string
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const BO_COLOR: Record<string, string> = { open: '#2D6A4F', partial: '#E65100', filled: '#9E9E9E', cancelled: '#9E9E9E' }
const BO_BG: Record<string, string> = { open: '#E8F5E9', partial: '#FFF3E0', filled: '#F5F5F5', cancelled: '#F5F5F5' }

export default function MyOrdersPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'buys' | 'sales'>('buys')
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([])
  const [sellOrders, setSellOrders] = useState<SellOrder[]>([])
  const [buyTrades, setBuyTrades] = useState<BuyTrade[]>([])
  const [sellTrades, setSellTrades] = useState<SellTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ team_username: string; carbon_balance: number | null } | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth'); return }
      const uid = data.user.id
      setUserId(uid)
      try {
      const [
        { data: profileData },
        { data: buyOrderData },
        sellOrderData,
        { data: buyTradeData },
        { data: sellTradeData },
      ] = await Promise.all([
        supabase.from('profiles').select('team_username, carbon_balance').eq('id', uid).single(),
        supabase.from('buy_orders').select('*').eq('buyer_id', uid).order('created_at', { ascending: false }),
        fetch('/api/my-listings').then(r => r.json()),
        supabase.from('transactions').select('id, credits_amount, price_per_credit, total_price, created_at, seller_id').eq('buyer_id', uid).order('created_at', { ascending: false }),
        supabase.from('transactions').select('id, credits_amount, price_per_credit, total_price, created_at, buyer_id').eq('seller_id', uid).order('created_at', { ascending: false }),
      ])

      setProfile(profileData)
      setBuyOrders(buyOrderData ?? [])
      setSellOrders(Array.isArray(sellOrderData) ? sellOrderData : [])

      // Resolve stall names for trades
      const allIds = Array.from(new Set([
        ...(buyTradeData ?? []).map(t => t.seller_id),
        ...(sellTradeData ?? []).map(t => t.buyer_id),
      ]))
      let stallMap: Record<string, string> = {}
      if (allIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, team_username').in('id', allIds)
        for (const p of profiles ?? []) stallMap[p.id] = p.team_username
      }

      setBuyTrades((buyTradeData ?? []).map(t => ({ ...t, sellerStall: stallMap[t.seller_id] ?? '—' })))
      setSellTrades((sellTradeData ?? []).map(t => ({ ...t, buyerStall: stallMap[t.buyer_id] ?? '—' })))

      } catch { /* queries failed — still stop loading */ } finally { setLoading(false) }
    })
  }, [router])

  const cancelBuyOrder = async (orderId: string) => {
    if (!confirm('Cancel this buy order?')) return
    setCancelError(null)
    setActionId(orderId)
    const res = await fetch('/api/cancel-buy-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
    const json = await res.json()
    if (res.ok) {
      setBuyOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
    } else {
      setCancelError(json.error ?? 'Failed to cancel order.')
    }
    setActionId(null)
  }

  const cancelSellOrder = async (listingId: string) => {
    if (!confirm('Cancel this sell order?')) return
    setCancelError(null)
    setActionId(listingId)
    const res = await fetch('/api/cancel-sell-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId }),
    })
    const json = await res.json()
    if (res.ok) {
      // Reflect refunded balance in UI
      if (json.unfilledCredits > 0) {
        setProfile(prev => prev ? { ...prev, carbon_balance: (prev.carbon_balance ?? 0) + json.unfilledCredits } : prev)
      }
      // Re-fetch from DB to confirm cancellation took effect
      const updated = await fetch('/api/my-listings').then(r => r.json()).catch(() => null)
      if (Array.isArray(updated)) setSellOrders(updated)
      else setSellOrders(prev => prev.map(o => o.id === listingId ? { ...o, status: 'removed' } : o))
    } else {
      setCancelError(json.error ?? 'Failed to cancel listing.')
    }
    setActionId(null)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0D1117' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#6B7280' }}><div style={{ fontSize: 48, marginBottom: 12 }}>♻️</div>Loading...</div>
      </div>
    </div>
  )

  const totalSpent = buyTrades.reduce((s, t) => s + Number(t.total_price), 0)
  const totalEarned = sellTrades.reduce((s, t) => s + Number(t.total_price), 0)

  // Group buy trades by seller for settlement summary
  const owedBySeller: Record<string, { name: string; amount: number; credits: number }> = {}
  for (const t of buyTrades) {
    const key = t.seller_id
    if (!owedBySeller[key]) owedBySeller[key] = { name: t.sellerStall ?? '—', amount: 0, credits: 0 }
    owedBySeller[key].amount += Number(t.total_price)
    owedBySeller[key].credits += Number(t.credits_amount)
  }

  // Group sell trades by buyer for settlement summary
  const owedByBuyer: Record<string, { name: string; amount: number; credits: number }> = {}
  for (const t of sellTrades) {
    const key = t.buyer_id
    if (!owedByBuyer[key]) owedByBuyer[key] = { name: t.buyerStall ?? '—', amount: 0, credits: 0 }
    owedByBuyer[key].amount += Number(t.total_price)
    owedByBuyer[key].credits += Number(t.credits_amount)
  }

  const cell = { color: '#6B7280', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0D1117' }}>
      <Navbar />

      <div style={{ maxWidth: 960, margin: '32px auto', padding: '0 24px 64px', width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2rem', color: '#fff', margin: '0 0 4px' }}>My Orders</h1>
          <p style={{ color: '#6B7280', margin: 0 }}>{profile?.team_username}</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
          <div style={{ background: '#161B22', border: '1px solid #2A1A3E', borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ color: '#CE93D8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Buy Orders</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.6rem' }}>{buyOrders.length}</div>
            <div style={{ color: '#6B7280', fontSize: '0.78rem' }}>₹{totalSpent.toFixed(0)} spent total</div>
          </div>
          <div style={{ background: '#161B22', border: '1px solid #1E3A2F', borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ color: '#4CAF50', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Sales</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.6rem' }}>{sellTrades.length}</div>
            <div style={{ color: '#6B7280', fontSize: '0.78rem' }}>₹{totalEarned.toFixed(0)} earned total</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #1A3C2B, #2D6A4F)', borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ color: '#A8D5B5', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Carbon Balance</div>
            <div style={{ color: profile?.carbon_balance != null && profile.carbon_balance < 0 ? '#FF5252' : '#4CAF50', fontWeight: 800, fontSize: '1.6rem' }}>
              ♻️ {profile?.carbon_balance ?? 'N/A'}
            </div>
          </div>
        </div>

        {/* Settlement Summary */}
        {(Object.keys(owedBySeller).length > 0 || Object.keys(owedByBuyer).length > 0) && (
          <div style={{ background: '#1A1200', border: '1px solid #FFB74D40', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>💸</span>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#FFB74D', fontSize: '0.95rem' }}>Offline Settlement Required</span>
            </div>
            <p style={{ color: '#9CA3AF', fontSize: '0.83rem', margin: '0 0 14px', lineHeight: 1.6 }}>
              Trades are recorded on the platform but <strong style={{ color: '#FFD54F' }}>payment must be made in person</strong> after the trading session ends.
            </p>
            {Object.keys(owedBySeller).length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#FF5252', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>You owe (pay these teams)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.values(owedBySeller).map(s => (
                    <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,82,82,0.06)', border: '1px solid rgba(255,82,82,0.15)', borderRadius: 8, padding: '8px 14px' }}>
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>{s.name}</span>
                      <span style={{ color: '#FF5252', fontWeight: 800 }}>₹{s.amount.toFixed(0)} <span style={{ color: '#6B7280', fontWeight: 400, fontSize: '0.78rem' }}>({s.credits} credits)</span></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {Object.keys(owedByBuyer).length > 0 && (
              <div>
                <div style={{ color: '#4CAF50', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Collect from (they owe you)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.values(owedByBuyer).map(b => (
                    <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(76,175,80,0.06)', border: '1px solid rgba(76,175,80,0.15)', borderRadius: 8, padding: '8px 14px' }}>
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>{b.name}</span>
                      <span style={{ color: '#4CAF50', fontWeight: 800 }}>₹{b.amount.toFixed(0)} <span style={{ color: '#6B7280', fontWeight: 400, fontSize: '0.78rem' }}>({b.credits} credits)</span></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {cancelError && (
          <div style={{ background: '#2A0A0A', border: '1px solid #FF525240', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#FF5252', fontSize: '0.88rem' }}>
            ⚠️ {cancelError}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#161B22', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {([['buys', '📈 Buy Orders'], ['sales', '♻️ My Sales']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem',
              background: tab === key ? '#fff' : 'transparent',
              color: tab === key ? '#1A3C2B' : '#6B7280',
            }}>{label}</button>
          ))}
        </div>

        {/* ── BUY ORDERS TAB ── */}
        {tab === 'buys' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Open bids */}
            <div>
              <h3 style={{ color: '#CE93D8', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>▼ Your Bids</h3>
              {buyOrders.length === 0 ? (
                <div style={{ background: '#161B22', border: '1px solid #2A1A3E', borderRadius: 14, padding: '32px', textAlign: 'center', color: '#6B7280' }}>
                  No buy orders yet. <Link href="/buy" style={{ color: '#CE93D8', fontWeight: 600 }}>Place a bid →</Link>
                </div>
              ) : (
                <div style={{ background: '#161B22', border: '1px solid #2A1A3E', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: 520, display: 'grid', gridTemplateColumns: '100px 1fr 1fr 1fr 1fr 80px', padding: '10px 20px', borderBottom: '1px solid #2A1A3E' }}>
                    {['Status', 'Qty', 'Filled', 'Bid Price', 'Placed', ''].map(h => <span key={h} style={cell}>{h}</span>)}
                  </div>
                  {buyOrders.map((o, i) => {
                    const isBoPartiallyCancelled = o.status === 'cancelled' && (o.filled_quantity ?? 0) > 0
                    const boLabel = isBoPartiallyCancelled ? 'PART. CANCELLED' : o.status.toUpperCase()
                    return (
                    <div key={o.id} style={{ minWidth: 520, display: 'grid', gridTemplateColumns: '100px 1fr 1fr 1fr 1fr 80px', padding: '13px 20px', borderBottom: i < buyOrders.length - 1 ? '1px solid #1A1A2E' : 'none', alignItems: 'center' }}>
                      <span style={{ background: BO_BG[o.status] ?? '#F5F5F5', color: BO_COLOR[o.status] ?? '#9E9E9E', borderRadius: 6, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700, width: 'fit-content' }}>
                        {boLabel}
                      </span>
                      <span style={{ color: '#E1BEE7' }}>{o.quantity}</span>
                      <span style={{ color: '#CE93D8' }}>{o.filled_quantity}</span>
                      <span style={{ color: '#CE93D8', fontWeight: 700 }}>₹{Number(o.price_per_credit).toFixed(0)}</span>
                      <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>{timeAgo(o.created_at)}</span>
                      <div>
                        {(o.status === 'open' || o.status === 'partial') && (
                          <button
                            onClick={() => cancelBuyOrder(o.id)}
                            disabled={actionId === o.id}
                            style={{ background: '#2A0A0A', color: '#FF5252', border: '1px solid #FF525240', borderRadius: 6, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: actionId === o.id ? 'not-allowed' : 'pointer', opacity: actionId === o.id ? 0.5 : 1 }}
                          >Cancel</button>
                        )}
                      </div>
                    </div>
                  )})}
                  </div>
                </div>
              )}
            </div>

            {/* Executed buy trades */}
            <div>
              <h3 style={{ color: '#CE93D8', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>⚡ Executed Trades</h3>
              {buyTrades.length === 0 ? (
                <div style={{ background: '#161B22', border: '1px solid #2A1A3E', borderRadius: 14, padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '0.9rem' }}>No trades yet.</div>
              ) : (
                <div style={{ background: '#161B22', border: '1px solid #2A1A3E', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: 440, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '10px 20px', borderBottom: '1px solid #2A1A3E' }}>
                    {['Seller', 'Qty', 'Price Paid', 'Total', 'When'].map(h => <span key={h} style={cell}>{h}</span>)}
                  </div>
                  {buyTrades.map((t, i) => (
                    <div key={t.id} style={{ minWidth: 440, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '13px 20px', borderBottom: i < buyTrades.length - 1 ? '1px solid #1A1A2E' : 'none', alignItems: 'center' }}>
                      <span style={{ color: '#4CAF50', fontWeight: 600, fontSize: '0.88rem' }}>{t.sellerStall}</span>
                      <span style={{ color: '#E1BEE7' }}>{t.credits_amount}</span>
                      <span style={{ color: '#CE93D8', fontWeight: 700 }}>₹{Number(t.price_per_credit).toFixed(0)}</span>
                      <span style={{ color: '#fff', fontWeight: 600 }}>₹{Number(t.total_price).toFixed(0)}</span>
                      <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>{timeAgo(t.created_at)}</span>
                    </div>
                  ))}
                  </div>
                  <div style={{ padding: '10px 20px', borderTop: '1px solid #2A1A3E', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>Total spent:</span>
                    <span style={{ color: '#CE93D8', fontWeight: 800 }}>₹{totalSpent.toFixed(0)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MY SALES TAB ── */}
        {tab === 'sales' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* All sell orders history */}
            <div>
              <h3 style={{ color: '#4CAF50', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>♻️ Sell Order History</h3>
              {sellOrders.length === 0 ? (
                <div style={{ background: '#161B22', border: '1px solid #1E3A2F', borderRadius: 14, padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '0.9rem' }}>
                  No sell orders yet. <Link href="/sell" style={{ color: '#4CAF50', fontWeight: 600 }}>Post one →</Link>
                </div>
              ) : (
                <div style={{ background: '#161B22', border: '1px solid #1E3A2F', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: 540, display: 'grid', gridTemplateColumns: '90px 1fr 1fr 1fr 1fr 80px', padding: '10px 20px', borderBottom: '1px solid #1E3A2F' }}>
                    {['Status', 'Credits', 'Filled', 'Ask Price', 'Posted', ''].map(h => <span key={h} style={cell}>{h}</span>)}
                  </div>
                  {sellOrders.map((o, i) => {
                    const isPartiallyCancelled = o.status === 'removed' && (o.filled_quantity ?? 0) > 0
                    const statusLabel: Record<string, string> = { live: 'LIVE', partial: 'PARTIAL', sold: 'SOLD', removed: isPartiallyCancelled ? 'PART. CANCELLED' : 'CANCELLED' }
                    const statusColor: Record<string, string> = { live: '#4CAF50', partial: '#FFB74D', sold: '#9E9E9E', removed: '#FF5252' }
                    const statusBg: Record<string, string> = { live: '#1A3C2B', partial: '#2A1A00', sold: '#1A1A1A', removed: '#2A0A0A' }
                    const canCancel = o.status === 'live' || o.status === 'partial'
                    return (
                    <div key={o.id} style={{ minWidth: 540, display: 'grid', gridTemplateColumns: '90px 1fr 1fr 1fr 1fr 80px', padding: '13px 20px', borderBottom: i < sellOrders.length - 1 ? '1px solid #1A2320' : 'none', alignItems: 'center' }}>
                      <span style={{ background: statusBg[o.status] ?? '#1A1A1A', color: statusColor[o.status] ?? '#9E9E9E', borderRadius: 6, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700, width: 'fit-content' }}>
                        {statusLabel[o.status] ?? o.status.toUpperCase()}
                      </span>
                      <span style={{ color: '#C8E6C9', fontWeight: 600 }}>{o.credits_amount}</span>
                      <span style={{ color: '#4CAF50' }}>{o.filled_quantity ?? 0}</span>
                      <span style={{ color: '#4CAF50', fontWeight: 700 }}>₹{Number(o.price_per_credit).toFixed(0)}</span>
                      <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>{timeAgo(o.created_at)}</span>
                      <div>
                        {canCancel && (
                          <button
                            onClick={() => cancelSellOrder(o.id)}
                            disabled={actionId === o.id}
                            style={{ background: '#2A0A0A', color: '#FF5252', border: '1px solid #FF525240', borderRadius: 6, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: actionId === o.id ? 'not-allowed' : 'pointer', opacity: actionId === o.id ? 0.5 : 1 }}
                          >Cancel</button>
                        )}
                      </div>
                    </div>
                    )
                  })}
                  </div>
                </div>
              )}
            </div>

            {/* Completed sales */}
            <div>
              <h3 style={{ color: '#4CAF50', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>✅ Completed Sales</h3>
              {sellTrades.length === 0 ? (
                <div style={{ background: '#161B22', border: '1px solid #1E3A2F', borderRadius: 14, padding: '32px', textAlign: 'center', color: '#6B7280' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🌱</div>
                  No sales yet — post a sell order and wait for a buyer to match.
                </div>
              ) : (
                <div style={{ background: '#161B22', border: '1px solid #1E3A2F', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: 440, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '10px 20px', borderBottom: '1px solid #1E3A2F' }}>
                    {['Buyer', 'Credits', 'Price/Credit', 'Total', 'When'].map(h => <span key={h} style={cell}>{h}</span>)}
                  </div>
                  {sellTrades.map((t, i) => (
                    <div key={t.id} style={{ minWidth: 440, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '13px 20px', borderBottom: i < sellTrades.length - 1 ? '1px solid #1A2320' : 'none', alignItems: 'center' }}>
                      <span style={{ color: '#CE93D8', fontWeight: 600, fontSize: '0.88rem' }}>{t.buyerStall}</span>
                      <span style={{ color: '#C8E6C9' }}>{t.credits_amount}</span>
                      <span style={{ color: '#4CAF50', fontWeight: 700 }}>₹{Number(t.price_per_credit).toFixed(0)}</span>
                      <span style={{ color: '#fff', fontWeight: 600 }}>₹{Number(t.total_price).toFixed(0)}</span>
                      <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>{timeAgo(t.created_at)}</span>
                    </div>
                  ))}
                  </div>
                  <div style={{ padding: '10px 20px', borderTop: '1px solid #1E3A2F', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>Total earned:</span>
                    <span style={{ color: '#4CAF50', fontWeight: 800 }}>₹{totalEarned.toFixed(0)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
