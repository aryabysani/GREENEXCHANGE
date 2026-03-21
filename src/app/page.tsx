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
  profiles: { stall_name: string } | null
}

type BuyOrder = {
  id: string
  quantity: number
  filled_quantity: number
  price_per_credit: number
  status: string
  created_at: string
  buyer_id: string
  profiles: { stall_name: string } | null
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

    // Sell orders (live listings), sorted by price ASC
    supabase
      .from('listings')
      .select('*, profiles(stall_name)')
      .eq('status', 'live')
      .eq('is_hidden', false)
      .order('price_per_credit', { ascending: true })
      .then(({ data, error }) => {
        if (!error) setSellOrders(data ?? [])
        else {
          supabase.from('listings').select('*').eq('status', 'live').order('price_per_credit', { ascending: true })
            .then(({ data: d2 }) => setSellOrders((d2 ?? []).filter((l: Record<string, unknown>) => !l.is_hidden)))
        }
      })

    // Buy orders (open/partial), sorted by price DESC
    supabase
      .from('buy_orders')
      .select('*, profiles(stall_name)')
      .in('status', ['open', 'partial'])
      .order('price_per_credit', { ascending: false })
      .then(({ data }) => setBuyOrders(data ?? []))

    // Recent trades
    supabase
      .from('transactions')
      .select('id, credits_amount, price_per_credit, total_price, created_at, seller_id, buyer_id')
      .order('created_at', { ascending: false })
      .limit(15)
      .then(({ data }) => setTrades(data ?? []))

    setLoading(false)
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
        background: 'linear-gradient(135deg, #0D2818 0%, #1A3C2B 50%, #0D2818 100%)',
        padding: '40px 24px 32px',
        borderBottom: '1px solid #1E3A2F',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', color: '#fff', marginBottom: 4 }}>
                Green<span style={{ color: '#4CAF50' }}>Credits</span> <span style={{ fontSize: '1rem', color: '#6B7280' }}>Exchange</span>
              </div>
              <p style={{ color: '#6B9E7E', margin: 0, fontSize: '0.9rem' }}>
                Sitting on carbon credits like it&apos;s a flex?<br />
                Time to trade. Turn good eco-behavior into cold hard rupees. 💸
              </p>
              <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#4A7C5E' }}>
                <strong style={{ color: '#C8E6C9' }}>Balance = emissions allowed − your carbon footprint.</strong>{' '}
                <strong style={{ color: '#4CAF50' }}>Surplus</strong> → sell.{' '}
                <strong style={{ color: '#FF5252' }}>Deficit</strong> → buy.
              </div>
            </div>

            {/* Trading status + CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: tradingActive ? 'rgba(76,175,80,0.15)' : 'rgba(255,82,82,0.15)',
                border: `1px solid ${tradingActive ? '#4CAF50' : '#FF5252'}`,
                borderRadius: 20, padding: '6px 14px',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: tradingActive ? '#4CAF50' : '#FF5252', display: 'inline-block', animation: tradingActive ? 'pulse 1.5s infinite' : 'none' }} />
                <span style={{ color: tradingActive ? '#4CAF50' : '#FF5252', fontWeight: 700, fontSize: '0.85rem' }}>
                  {tradingActive === null ? 'Checking...' : tradingActive ? 'TRADING OPEN' : 'TRADING CLOSED'}
                </span>
              </div>

              {tradingActive && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {(userBalance === undefined || userBalance === null || userBalance > 0) && (
                    <Link href="/sell" style={{ background: '#4CAF50', color: '#fff', padding: '8px 20px', borderRadius: 20, textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem' }}>
                      + Sell Credits
                    </Link>
                  )}
                  {(userBalance === undefined || userBalance === null || userBalance < 0) && (
                    <Link href="/buy" style={{ background: '#7B1FA2', color: '#fff', padding: '8px 20px', borderRadius: 20, textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem' }}>
                      📈 Buy Credits
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trading closed banner */}
      {tradingActive === false && (
        <div style={{ background: '#1A0A0A', border: '1px solid #FF5252', margin: '20px 24px', borderRadius: 14, padding: '24px', textAlign: 'center', maxWidth: 1100, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⏸️</div>
          <div style={{ fontWeight: 800, color: '#FF5252', fontSize: '1.3rem', fontFamily: 'Syne, sans-serif' }}>Trading is currently paused</div>
          <p style={{ color: '#9E9E9E', margin: '8px 0 0' }}>The admin will open trading when it&apos;s time. Sit tight — the market opens soon.</p>
        </div>
      )}

      {/* Stats bar */}
      <div style={{ background: '#161B22', borderBottom: '1px solid #1E3A2F', padding: '12px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Sell Orders', value: availableSell.length, color: '#4CAF50' },
            { label: 'Buy Orders', value: availableBuy.length, color: '#CE93D8' },
            { label: 'Credits for Sale', value: totalSellCredits, color: '#4CAF50' },
            { label: 'Credits Wanted', value: totalBuyCredits, color: '#CE93D8' },
            { label: 'Trades Executed', value: trades.length, color: '#FFB74D' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.3rem', color: stat.color }}>{loading ? '—' : stat.value}</div>
              <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

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
                        {order.profiles?.stall_name ?? '—'}
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
                      {order.profiles?.stall_name ?? '—'}
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
          <Link href="/my-listings" style={{ color: '#4A7C5E', fontSize: '0.85rem', textDecoration: 'none' }}>
            {userBalance != null && userBalance < 0 ? 'My Buy Orders →' : 'My Orders →'}
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
