'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type SellOrder = {
  id: string
  credits_amount: number
  filled_quantity: number
  price_per_credit: number
  stall_name?: string
  seller_id: string
}

type BuyOrder = {
  id: string
  quantity: number
  filled_quantity: number
  price_per_credit: number
  stall_name?: string
  buyer_id: string
}

type Trade = {
  id: string
  credits_amount: number
  price_per_credit: number
  total_price: number
  created_at: string
  seller_name?: string
  buyer_name?: string
}

export default function DisplayPage() {
  const [sellOrders, setSellOrders] = useState<SellOrder[]>([])
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [lastTradeId, setLastTradeId] = useState<string | null>(null)
  const [highlightTradeId, setHighlightTradeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Data fetching
  const fetchData = async () => {
    // 1. Fetch Listings (Sells)
    const { data: listings } = await supabase
      .from('listings')
      .select('id, credits_amount, filled_quantity, price_per_credit, seller_id')
      .eq('status', 'live')
      .order('price_per_credit', { ascending: true }) // Best price at top
    
    // 2. Fetch Buy Orders (Bids)
    const { data: bids } = await supabase
      .from('buy_orders')
      .select('id, quantity, filled_quantity, price_per_credit, buyer_id')
      .in('status', ['open', 'partial'])
      .order('price_per_credit', { ascending: false }) // Best price at top

    // 3. Fetch Recent Trades
    const { data: txs } = await supabase
      .from('transactions')
      .select('id, credits_amount, price_per_credit, total_price, created_at, seller_id, buyer_id')
      .order('created_at', { ascending: false })
      .limit(10)

    // 4. Batch fetch profiles for all unique IDs
    const allIds = Array.from(new Set([
      ...(listings ?? []).map(l => l.seller_id),
      ...(bids ?? []).map(b => b.buyer_id),
      ...(txs ?? []).flatMap(t => [t.seller_id, t.buyer_id])
    ].filter(Boolean)))

    let nameMap: Record<string, string> = {}
    if (allIds.length > 0) {
      const { data: profs } = await supabase.from('profiles').select('id, stall_name').in('id', allIds)
      for (const p of profs ?? []) nameMap[p.id] = p.stall_name
    }

    setSellOrders((listings ?? []).map((l: any) => ({
      ...l,
      stall_name: nameMap[l.seller_id] ?? '—'
    })))
    
    setBuyOrders((bids ?? []).map((b: any) => ({
      ...b,
      stall_name: nameMap[b.buyer_id] ?? '—'
    })))

    setTrades((txs ?? []).map((t: any) => ({
      ...t,
      seller_name: nameMap[t.seller_id] ?? '—',
      buyer_name: nameMap[t.buyer_id] ?? '—'
    })))

    // Check for new trades to highlight
    if (txs && txs.length > 0) {
      const latest = txs[0].id
      if (lastTradeId && latest !== lastTradeId) {
        setHighlightTradeId(latest)
        // Play sound if possible (browsers block auto-audio, but we can try)
        // const audio = new Audio('/bing.mp3'); audio.play().catch(() => {});
        setTimeout(() => setHighlightTradeId(null), 3000)
      }
      setLastTradeId(latest)
    }
  }

  useEffect(() => {
    fetchData().then(() => setLoading(false))

    // Real-time subscriptions
    const channel = supabase
      .channel('display-room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buy_orders' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchData)
      .subscribe()

    // Polling fallback every 10s
    const interval = setInterval(fetchData, 10000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [supabase, lastTradeId])

  if (loading) return (
    <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4CAF50', fontSize: '2rem', fontFamily: 'Outfit, sans-serif', fontWeight: 900 }}>
       INITIALIZING MARKET FEED...
    </div>
  )

  return (
    <div style={{ 
      background: '#0a0a0a', 
      minHeight: '100vh', 
      color: '#fff', 
      fontFamily: 'Outfit, sans-serif', 
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #333', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#4CAF50' }}>
            GREEN<span style={{ color: '#fff' }}>CREDITS</span> LIVE
          </h1>
          <div style={{ color: '#888', fontWeight: 600, fontSize: '1.2rem' }}>ECOXCHANGE 2026 • CARBON TRADING FLOOR</div>
        </div>
        <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1rem', color: '#4CAF50', fontWeight: 800 }}>● REAL-TIME DATA STREAM</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: '#fff' }}>{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Main Order Book Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flex: 1 }}>
        
        {/* BUY ORDERS - BID (Left) */}
        <div style={{ background: '#111', borderRadius: '16px', border: '3px solid #6A1B9A', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ color: '#E1BEE7', margin: '0 0 16px', fontSize: '2rem', fontWeight: 900, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            BUYERS (BIDS)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid #444', color: '#888', fontWeight: 700, fontSize: '1.2rem' }}>
            <div>STALL</div>
            <div style={{ textAlign: 'right' }}>PRICE</div>
            <div style={{ textAlign: 'right' }}>QTY</div>
          </div>
          <div style={{ flex: 1, overflowY: 'hidden' }}>
            {buyOrders.slice(0, 10).map((b, i) => (
              <div key={b.id} style={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr 1fr', 
                padding: '16px 0', 
                borderBottom: i < buyOrders.length - 1 ? '1px solid #222' : 'none',
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#CE93D8'
              }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.stall_name}</div>
                <div style={{ textAlign: 'right', color: '#EA80FC' }}>₹{Number(b.price_per_credit).toFixed(0)}</div>
                <div style={{ textAlign: 'right', color: '#fff' }}>{b.quantity - b.filled_quantity}</div>
              </div>
            ))}
            {buyOrders.length === 0 && <div style={{ textAlign: 'center', padding: '100px', color: '#444', fontSize: '1.5rem' }}>NO BUYERS YET</div>}
          </div>
        </div>

        {/* SELL ORDERS - ASK (Right) */}
        <div style={{ background: '#111', borderRadius: '16px', border: '3px solid #1B5E20', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ color: '#C8E6C9', margin: '0 0 16px', fontSize: '2rem', fontWeight: 900, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            SELLERS (ASKS)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid #444', color: '#888', fontWeight: 700, fontSize: '1.2rem' }}>
            <div>STALL</div>
            <div style={{ textAlign: 'right' }}>PRICE</div>
            <div style={{ textAlign: 'right' }}>QTY</div>
          </div>
          <div style={{ flex: 1, overflowY: 'hidden' }}>
            {sellOrders.slice(0, 10).map((s, i) => (
              <div key={s.id} style={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr 1fr', 
                padding: '16px 0', 
                borderBottom: i < sellOrders.length - 1 ? '1px solid #222' : 'none',
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#81C784'
              }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.stall_name}</div>
                <div style={{ textAlign: 'right', color: '#B9F6CA' }}>₹{Number(s.price_per_credit).toFixed(0)}</div>
                <div style={{ textAlign: 'right', color: '#fff' }}>{s.credits_amount - s.filled_quantity}</div>
              </div>
            ))}
            {sellOrders.length === 0 && <div style={{ textAlign: 'center', padding: '100px', color: '#444', fontSize: '1.5rem' }}>NO SELLERS YET</div>}
          </div>
        </div>
      </div>

      {/* Trades Feed (Bottom) */}
      <div style={{ background: '#000', borderRadius: '16px', border: '3px solid #FF8F00', padding: '20px', flex: '0.8', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: '#FFB74D', margin: '0 0 16px', fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
           ⚡ LIVE TRADE STREAM
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 0.8fr 1.2fr', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid #444', color: '#888', fontWeight: 700, fontSize: '1.2rem' }}>
            <div>BUYER</div>
            <div>SELLER</div>
            <div style={{ textAlign: 'right' }}>CREDITS</div>
            <div style={{ textAlign: 'right' }}>PRICE</div>
            <div style={{ textAlign: 'right' }}>TIME</div>
        </div>
        <div style={{ flex: 1, overflowY: 'hidden' }}>
          {trades.map((t) => (
            <div 
              key={t.id} 
              className={highlightTradeId === t.id ? 'highlight-trade' : ''}
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '1.5fr 1.5fr 1fr 0.8fr 1.2fr', 
                padding: '18px 0', 
                borderBottom: '1px solid #222',
                fontSize: '1.6rem',
                fontWeight: 800,
                color: '#fff',
                transition: 'all 0.4s ease',
                background: highlightTradeId === t.id ? 'rgba(255,143,0,0.3)' : 'transparent',
                borderLeft: t.credits_amount >= 50 ? '8px solid #FFD54F' : 'none', // Giant trade highlight
                paddingLeft: t.credits_amount >= 50 ? '12px' : '0'
              }}
            >
              <div style={{ color: '#CE93D8' }}>{t.buyer_name}</div>
              <div style={{ color: '#81C784' }}>{t.seller_name}</div>
              <div style={{ textAlign: 'right' }}>{t.credits_amount} <span style={{ fontSize: '0.8rem', color: '#666' }}>CR</span></div>
              <div style={{ textAlign: 'right', color: '#FFB74D' }}>₹{Number(t.price_per_credit).toFixed(0)}</div>
              <div style={{ textAlign: 'right', color: '#444', fontSize: '1.2rem' }}>{new Date(t.created_at).toLocaleTimeString()}</div>
            </div>
          ))}
          {trades.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: '#333', fontSize: '1.5rem' }}>WAITING FOR FIRST TRADE...</div>}
        </div>
      </div>

      <style jsx global>{`
        @keyframes highlightEnter {
          0% { transform: scale(1.05); background: rgba(255,143,0,0.6); }
          100% { transform: scale(1); background: transparent; }
        }
        .highlight-trade {
          animation: highlightEnter 1s ease-out;
        }
        /* Custom scrollbars for the table view if needed */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
      `}</style>
    </div>
  )
}
