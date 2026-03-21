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

const STATUS_COLOR: Record<string, string> = {
  open: '#2D6A4F', partial: '#E65100', filled: '#9E9E9E', cancelled: '#9E9E9E',
}
const STATUS_BG: Record<string, string> = {
  open: '#E8F5E9', partial: '#FFF3E0', filled: '#F5F5F5', cancelled: '#F5F5F5',
}

export default function MyOrdersPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'buys' | 'sales'>('buys')
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([])
  const [buyTrades, setBuyTrades] = useState<BuyTrade[]>([])
  const [sellTrades, setSellTrades] = useState<SellTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ stall_name: string; carbon_balance: number | null } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth'); return }
      const userId = data.user.id

      const [
        { data: profileData },
        { data: buyOrderData },
        { data: buyTradeData },
        { data: sellTradeData },
      ] = await Promise.all([
        supabase.from('profiles').select('stall_name, carbon_balance').eq('id', userId).single(),
        supabase.from('buy_orders').select('*').eq('buyer_id', userId).order('created_at', { ascending: false }),
        supabase.from('transactions').select('id, credits_amount, price_per_credit, total_price, created_at, seller_id').eq('buyer_id', userId).order('created_at', { ascending: false }),
        supabase.from('transactions').select('id, credits_amount, price_per_credit, total_price, created_at, buyer_id').eq('seller_id', userId).order('created_at', { ascending: false }),
      ])

      setProfile(profileData)

      // Resolve stall names
      const allIds = Array.from(new Set([
        ...(buyTradeData ?? []).map(t => t.seller_id),
        ...(sellTradeData ?? []).map(t => t.buyer_id),
      ]))
      let stallMap: Record<string, string> = {}
      if (allIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, stall_name').in('id', allIds)
        for (const p of profiles ?? []) stallMap[p.id] = p.stall_name
      }

      setBuyOrders(buyOrderData ?? [])
      setBuyTrades((buyTradeData ?? []).map(t => ({ ...t, sellerStall: stallMap[t.seller_id] ?? '—' })))
      setSellTrades((sellTradeData ?? []).map(t => ({ ...t, buyerStall: stallMap[t.buyer_id] ?? '—' })))

      // Default to sales tab if user is a seller (positive balance)
      if (profileData?.carbon_balance != null && profileData.carbon_balance >= 0) setTab('sales')

      setLoading(false)
    })
  }, [router])

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0D1117' }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 24px 64px', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2rem', color: '#fff', margin: '0 0 4px' }}>
            My Orders
          </h1>
          <p style={{ color: '#6B7280', margin: 0 }}>{profile?.stall_name}</p>
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#161B22', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {([['buys', '📈 Buy Orders'], ['sales', '♻️ My Sales']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem',
              background: tab === key ? '#fff' : 'transparent',
              color: tab === key ? '#1A3C2B' : '#6B7280',
            }}>{label}</button>
          ))}
        </div>

        {/* BUY ORDERS TAB */}
        {tab === 'buys' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Open buy orders */}
            <div>
              <h3 style={{ color: '#CE93D8', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>
                ▼ Open Bids
              </h3>
              {buyOrders.filter(o => o.status !== 'filled').length === 0 ? (
                <div style={{ background: '#161B22', border: '1px solid #2A1A3E', borderRadius: 14, padding: '32px', textAlign: 'center', color: '#6B7280', fontSize: '0.9rem' }}>
                  No open buy orders. <Link href="/buy" style={{ color: '#CE93D8', fontWeight: 600 }}>Place a bid →</Link>
                </div>
              ) : (
                <div style={{ background: '#161B22', border: '1px solid #2A1A3E', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', padding: '10px 20px', borderBottom: '1px solid #2A1A3E' }}>
                    {['Status', 'Qty', 'Filled', 'Bid Price', 'Placed'].map(h => (
                      <span key={h} style={{ color: '#6B7280', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em' }}>{h}</span>
                    ))}
                  </div>
                  {buyOrders.filter(o => o.status !== 'filled').map((o, i, arr) => (
                    <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: i < arr.length - 1 ? '1px solid #1A1A2E' : 'none', alignItems: 'center' }}>
                      <span style={{ background: STATUS_BG[o.status] ?? '#F5F5F5', color: STATUS_COLOR[o.status] ?? '#9E9E9E', borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700, width: 'fit-content' }}>
                        {o.status.toUpperCase()}
                      </span>
                      <span style={{ color: '#E1BEE7' }}>{o.quantity}</span>
                      <span style={{ color: '#CE93D8' }}>{o.filled_quantity}</span>
                      <span style={{ color: '#CE93D8', fontWeight: 700 }}>₹{Number(o.price_per_credit).toFixed(0)}</span>
                      <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>{timeAgo(o.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Executed buy trades */}
            <div>
              <h3 style={{ color: '#CE93D8', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>
                ⚡ Executed Trades
              </h3>
              {buyTrades.length === 0 ? (
                <div style={{ background: '#161B22', border: '1px solid #2A1A3E', borderRadius: 14, padding: '32px', textAlign: 'center', color: '#6B7280', fontSize: '0.9rem' }}>
                  No trades executed yet.
                </div>
              ) : (
                <div style={{ background: '#161B22', border: '1px solid #2A1A3E', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '10px 20px', borderBottom: '1px solid #2A1A3E' }}>
                    {['Seller', 'Qty', 'Got Price', 'Total Paid', 'When'].map(h => (
                      <span key={h} style={{ color: '#6B7280', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em' }}>{h}</span>
                    ))}
                  </div>
                  {buyTrades.map((t, i) => (
                    <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: i < buyTrades.length - 1 ? '1px solid #1A1A2E' : 'none', alignItems: 'center' }}>
                      <span style={{ color: '#4CAF50', fontWeight: 600, fontSize: '0.88rem' }}>{t.sellerStall}</span>
                      <span style={{ color: '#E1BEE7' }}>{t.credits_amount}</span>
                      <span style={{ color: '#CE93D8', fontWeight: 700 }}>₹{Number(t.price_per_credit).toFixed(0)}</span>
                      <span style={{ color: '#fff', fontWeight: 600 }}>₹{Number(t.total_price).toFixed(0)}</span>
                      <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>{timeAgo(t.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MY SALES TAB */}
        {tab === 'sales' && (
          <div>
            <h3 style={{ color: '#4CAF50', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>
              ♻️ Your Executed Sales
            </h3>
            {sellTrades.length === 0 ? (
              <div style={{ background: '#161B22', border: '1px solid #1E3A2F', borderRadius: 14, padding: '48px', textAlign: 'center', color: '#6B7280' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
                <div style={{ fontWeight: 700, color: '#fff', marginBottom: 8 }}>No sales yet</div>
                <p style={{ margin: '0 0 16px' }}>Post a sell order and wait for a buyer to match.</p>
                <Link href="/sell" style={{ background: '#4CAF50', color: '#fff', padding: '10px 24px', borderRadius: 20, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
                  + Sell Credits
                </Link>
              </div>
            ) : (
              <div style={{ background: '#161B22', border: '1px solid #1E3A2F', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '10px 20px', borderBottom: '1px solid #1E3A2F' }}>
                  {['Buyer', 'Credits Sold', 'Price/Credit', 'Total Received', 'When'].map(h => (
                    <span key={h} style={{ color: '#6B7280', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em' }}>{h}</span>
                  ))}
                </div>
                {sellTrades.map((t, i) => (
                  <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: i < sellTrades.length - 1 ? '1px solid #1A2320' : 'none', alignItems: 'center' }}>
                    <span style={{ color: '#CE93D8', fontWeight: 600, fontSize: '0.88rem' }}>{t.buyerStall}</span>
                    <span style={{ color: '#C8E6C9' }}>{t.credits_amount}</span>
                    <span style={{ color: '#4CAF50', fontWeight: 700 }}>₹{Number(t.price_per_credit).toFixed(0)}</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>₹{Number(t.total_price).toFixed(0)}</span>
                    <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>{timeAgo(t.created_at)}</span>
                  </div>
                ))}
                <div style={{ padding: '12px 20px', borderTop: '1px solid #1E3A2F', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>Total earned:</span>
                  <span style={{ color: '#4CAF50', fontWeight: 800, fontSize: '0.95rem' }}>₹{totalEarned.toFixed(0)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          div[style*="gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr'"] { grid-template-columns: repeat(3, 1fr) !important; }
          div[style*="gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr'"] { grid-template-columns: 2fr 1fr 1fr !important; }
        }
      `}</style>
      <Footer />
    </div>
  )
}
