'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type SellOrder = {
  id: string
  credits_amount: number
  filled_quantity: number
  price_per_credit: number
  status: string
  created_at: string
  seller_id: string
  profiles: { team_username: string } | null
}

type BuyOrder = {
  id: string
  quantity: number
  filled_quantity: number
  price_per_credit: number
  status: string
  created_at: string
  buyer_id: string
  profiles: { team_username: string } | null
}

type Trade = {
  id: string
  credits_amount: number
  price_per_credit: number
  total_price: number
  created_at: string
  seller_id: string
  buyer_id: string
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function HomePage() {
  const [sellOrders, setSellOrders] = useState<SellOrder[]>([])
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [tradingActive, setTradingActive] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [userBalance, setUserBalance] = useState<number | null | undefined>(undefined)
  const [usernameMap, setUsernameMap] = useState<Record<string, string>>({})

  useEffect(() => {
    const supabase = createClient()

    // Check user balance for CTA
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('profiles').select('carbon_balance').eq('id', data.user.id).single()
          .then(({ data: p }) => setUserBalance(p?.carbon_balance ?? null))
      } else {
        setUserBalance(null)
      }
    })

    // Trading status
    fetch(`/api/trading-status?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).then(d => setTradingActive(d.active === true))

    const fetchSellOrders = async () => {
      const { data } = await supabase.from('listings').select('*').eq('status', 'live').eq('is_hidden', false).order('price_per_credit', { ascending: true })
      const orders = data ?? []
      const ids = Array.from(new Set(orders.map((o: Record<string, string>) => o.seller_id).filter(Boolean)))
      if (ids.length > 0) {
        const { data: profs } = await supabase.from('profiles').select('id, team_username').in('id', ids)
        const map: Record<string, string> = {}
        for (const p of profs ?? []) map[p.id] = p.team_username
        setSellOrders(orders.map((o: Record<string, unknown>) => ({ ...o, profiles: { team_username: map[o.seller_id as string] ?? '—' } })) as SellOrder[])
      } else {
        setSellOrders([])
      }
    }

    const fetchBuyOrders = async () => {
      const { data } = await supabase.from('buy_orders').select('*').in('status', ['open', 'partial']).order('price_per_credit', { ascending: false })
      const orders = data ?? []
      const ids = Array.from(new Set(orders.map((o: Record<string, string>) => o.buyer_id).filter(Boolean)))
      if (ids.length > 0) {
        const { data: profs } = await supabase.from('profiles').select('id, team_username').in('id', ids)
        const map: Record<string, string> = {}
        for (const p of profs ?? []) map[p.id] = p.team_username
        setBuyOrders(orders.map((o: Record<string, unknown>) => ({ ...o, profiles: { team_username: map[o.buyer_id as string] ?? '—' } })) as BuyOrder[])
      } else {
        setBuyOrders([])
      }
    }

    const fetchTrades = async () => {
      const { data } = await supabase.from('transactions').select('id, credits_amount, price_per_credit, total_price, created_at, seller_id, buyer_id').order('created_at', { ascending: false }).limit(15)
      setTrades(data ?? [])
      const ids = Array.from(new Set((data ?? []).flatMap((t: Trade) => [t.seller_id, t.buyer_id])))
      if (ids.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, team_username').in('id', ids)
        const map: Record<string, string> = {}
        for (const p of profiles ?? []) map[p.id] = p.team_username
        setUsernameMap(map)
      }
    }

    // Initial load
    Promise.all([fetchSellOrders(), fetchBuyOrders(), fetchTrades()]).then(() => setLoading(false))

    // Realtime subscriptions — auto-update when any order or trade changes
    const channel = supabase
      .channel('order-book')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => fetchSellOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buy_orders' }, () => fetchBuyOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => { fetchTrades(); fetchSellOrders(); fetchBuyOrders() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const availableSell = sellOrders.map(s => ({ ...s, available: s.credits_amount - (s.filled_quantity ?? 0) })).filter(s => s.available > 0)
  const availableBuy = buyOrders.map(b => ({ ...b, remaining: b.quantity - (b.filled_quantity ?? 0) })).filter(b => b.remaining > 0)

  const totalSellCredits = availableSell.reduce((s, o) => s + o.available, 0)
  const totalBuyCredits = availableBuy.reduce((s, o) => s + o.remaining, 0)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0D1117' }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #071A0F 0%, #0D2818 40%, #0A1F14 100%)',
        padding: '48px 24px 40px',
        borderBottom: '1px solid #1E3A2F',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: -80, left: '30%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,175,80,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          {/* Status pill */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: tradingActive ? 'rgba(76,175,80,0.12)' : 'rgba(255,82,82,0.12)',
              border: `1px solid ${tradingActive ? 'rgba(76,175,80,0.4)' : 'rgba(255,82,82,0.4)'}`,
              borderRadius: 20, padding: '5px 14px',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: tradingActive ? '#4CAF50' : '#FF5252', display: 'inline-block', animation: tradingActive ? 'pulse 1.5s infinite' : 'none' }} />
              <span style={{ color: tradingActive ? '#4CAF50' : '#FF5252', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.08em' }}>
                {tradingActive === null ? 'CHECKING...' : tradingActive ? 'MARKET OPEN' : 'MARKET CLOSED'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
            <div style={{ maxWidth: 600 }}>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 'clamp(2rem, 5vw, 3.2rem)', color: '#fff', margin: '0 0 6px', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
                Green<span style={{ color: '#4CAF50' }}>Credits</span><br />
                <span style={{ color: '#A8D5B5', fontWeight: 700, fontSize: '0.55em', letterSpacing: '-0.01em' }}>Carbon Exchange — EcoXchange 2025</span>
              </h1>
              <p style={{ color: '#6B9E7E', margin: '12px 0 0', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Surplus credits? Sell them. In deficit? Buy to offset.<br />
                <span style={{ color: '#4A7C5E', fontSize: '0.85rem' }}>
                  <strong style={{ color: '#C8E6C9' }}>Balance = emissions allowed − carbon footprint.</strong>
                </span>
              </p>

              {tradingActive && (
                <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                  {(userBalance === undefined || userBalance === null || userBalance >= 0) && (
                    <Link href="/sell" style={{ background: 'linear-gradient(135deg, #2E7D32, #4CAF50)', color: '#fff', padding: '11px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 16px rgba(76,175,80,0.25)' }}>
                      ♻️ Sell Credits
                    </Link>
                  )}
                  {(userBalance === undefined || userBalance === null || userBalance < 0) && (
                    <Link href="/buy" style={{ background: 'linear-gradient(135deg, #4A148C, #7B1FA2)', color: '#fff', padding: '11px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 16px rgba(123,31,162,0.25)' }}>
                      📈 Buy Credits
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Live stats */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(76,175,80,0.2)', borderRadius: 14, padding: '14px 20px', minWidth: 110, textAlign: 'center' }}>
                <div style={{ color: '#4CAF50', fontWeight: 800, fontSize: '1.6rem', fontFamily: 'Outfit, sans-serif' }}>{totalSellCredits}</div>
                <div style={{ color: '#6B9E7E', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Credits for sale</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(123,31,162,0.2)', borderRadius: 14, padding: '14px 20px', minWidth: 110, textAlign: 'center' }}>
                <div style={{ color: '#CE93D8', fontWeight: 800, fontSize: '1.6rem', fontFamily: 'Outfit, sans-serif' }}>{totalBuyCredits}</div>
                <div style={{ color: '#9E6BA8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Credits wanted</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 20px', minWidth: 110, textAlign: 'center' }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.6rem', fontFamily: 'Outfit, sans-serif' }}>{trades.length}</div>
                <div style={{ color: '#6B7280', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Recent trades</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trading closed banner */}
      {tradingActive === false && (
        <div style={{ background: '#1A0A0A', border: '1px solid #FF5252', margin: '20px 24px', borderRadius: 14, padding: '24px', textAlign: 'center', maxWidth: 1100, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⏸️</div>
          <div style={{ fontWeight: 800, color: '#FF5252', fontSize: '1.3rem', fontFamily: 'Outfit, sans-serif' }}>Trading is currently paused</div>
          <p style={{ color: '#9E9E9E', margin: '8px 0 0' }}>The admin will open trading when it&apos;s time. Sit tight — the market opens soon.</p>
        </div>
      )}


      {/* Order Book */}
      <div style={{ maxWidth: 1100, margin: '24px auto', padding: '0 16px', width: '100%' }}>
        <div className="order-book-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* SELL ORDERS (Asks) */}
          <div style={{ background: '#161B22', border: '1px solid #1E3A2F', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #1E3A2F', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontWeight: 700, color: '#4CAF50', fontSize: '0.85rem', letterSpacing: '0.08em' }}>▲ SELL ORDERS</span>
                <span style={{ color: '#6B7280', fontSize: '0.75rem', marginLeft: 8 }}>asks</span>
              </div>
              <span style={{ color: '#4CAF50', fontSize: '0.75rem', fontWeight: 600 }}>{availableSell.length} open</span>
            </div>

            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', padding: '8px 16px', borderBottom: '1px solid #1E3A2F' }}>
              {['Stall', 'Price', 'Qty'].map(h => (
                <span key={h} style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 600, letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#6B7280', fontSize: '0.85rem' }}>Loading...</div>
            ) : availableSell.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#6B7280', fontSize: '0.85rem' }}>No sell orders</div>
            ) : (
              <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                {availableSell.map((order, i) => (
                  <Link key={order.id} href={`/listing/${order.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr',
                      padding: '10px 16px',
                      borderBottom: i < availableSell.length - 1 ? '1px solid #1A2A1F' : 'none',
                      transition: 'background 0.15s',
                      cursor: 'pointer',
                      background: 'transparent',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1A2A1F')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ color: '#C8E6C9', fontSize: '0.85rem', fontWeight: 500 }}>
                        {order.profiles?.team_username ?? '—'}
                      </span>
                      <span style={{ color: '#4CAF50', fontSize: '0.88rem', fontWeight: 700 }}>
                        ₹{Number(order.price_per_credit).toFixed(0)}
                      </span>
                      <span style={{ color: '#9E9E9E', fontSize: '0.85rem' }}>{order.available}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* BUY ORDERS (Bids) */}
          <div style={{ background: '#161B22', border: '1px solid #2A1A3E', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #2A1A3E', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontWeight: 700, color: '#CE93D8', fontSize: '0.85rem', letterSpacing: '0.08em' }}>▼ BUY ORDERS</span>
                <span style={{ color: '#6B7280', fontSize: '0.75rem', marginLeft: 8 }}>bids</span>
              </div>
              <span style={{ color: '#CE93D8', fontSize: '0.75rem', fontWeight: 600 }}>{availableBuy.length} open</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', padding: '8px 16px', borderBottom: '1px solid #2A1A3E' }}>
              {['Stall', 'Bid Price', 'Qty'].map(h => (
                <span key={h} style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 600, letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#6B7280', fontSize: '0.85rem' }}>Loading...</div>
            ) : availableBuy.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#6B7280', fontSize: '0.85rem' }}>No buy orders</div>
            ) : (
              <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                {availableBuy.map((order, i) => (
                  <div key={order.id} style={{
                    display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr',
                    padding: '10px 16px',
                    borderBottom: i < availableBuy.length - 1 ? '1px solid #1E1428' : 'none',
                  }}>
                    <span style={{ color: '#E1BEE7', fontSize: '0.85rem', fontWeight: 500 }}>
                      {order.profiles?.team_username ?? '—'}
                    </span>
                    <span style={{ color: '#CE93D8', fontSize: '0.88rem', fontWeight: 700 }}>
                      ₹{Number(order.price_per_credit).toFixed(0)}
                    </span>
                    <span style={{ color: '#9E9E9E', fontSize: '0.85rem' }}>{order.remaining}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Trades */}
        <div style={{ background: '#161B22', border: '1px solid #1E3A2F', borderRadius: 16, marginTop: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #1E3A2F' }}>
            <span style={{ fontWeight: 700, color: '#FFB74D', fontSize: '0.85rem', letterSpacing: '0.08em' }}>⚡ RECENT TRADES</span>
          </div>

          {trades.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#6B7280', fontSize: '0.85rem' }}>No trades yet. Be the first to trade!</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1E3A2F' }}>
                    {['Seller', 'Buyer', 'Qty', 'Price', 'Total', 'Time'].map(h => (
                      <th key={h} style={{ padding: '8px 16px', color: '#6B7280', fontWeight: 600, letterSpacing: '0.05em', fontSize: '0.7rem', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, i) => (
                    <tr key={trade.id} style={{ borderBottom: i < trades.length - 1 ? '1px solid #1A2320' : 'none' }}>
                      <td style={{ padding: '10px 16px', color: '#4CAF50', fontWeight: 600 }}>{usernameMap[trade.seller_id] ?? '—'}</td>
                      <td style={{ padding: '10px 16px', color: '#CE93D8', fontWeight: 600 }}>{usernameMap[trade.buyer_id] ?? '—'}</td>
                      <td style={{ padding: '10px 16px', color: '#C8E6C9' }}>{trade.credits_amount}</td>
                      <td style={{ padding: '10px 16px', color: '#FFB74D', fontWeight: 700 }}>₹{Number(trade.price_per_credit ?? 0).toFixed(0)}</td>
                      <td style={{ padding: '10px 16px', color: '#fff', fontWeight: 600 }}>₹{Number(trade.total_price ?? 0).toFixed(0)}</td>
                      <td style={{ padding: '10px 16px', color: '#6B7280' }}>{timeAgo(trade.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          <Link href="/my-orders" style={{ color: '#4A7C5E', fontSize: '0.85rem', textDecoration: 'none' }}>
            My Orders →
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 640px) {
          .order-book-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <Footer />
    </div>
  )
}
