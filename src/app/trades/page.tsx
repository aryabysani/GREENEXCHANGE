'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Trade = {
  id: string
  credits_amount: number
  price_per_credit: number
  total_price: number | null
  created_at: string
  seller_id: string
  buyer_id: string
}

export default function AllTradesPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [nameMap, setNameMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('id, credits_amount, price_per_credit, total_price, created_at, seller_id, buyer_id')
        .order('created_at', { ascending: false })
      const all = data ?? []
      setTrades(all)
      const ids = Array.from(new Set(all.flatMap((t: Trade) => [t.seller_id, t.buyer_id])))
      if (ids.length > 0) {
        const { data: profs } = await supabase.from('profiles').select('id, team_username').in('id', ids)
        const map: Record<string, string> = {}
        for (const p of profs ?? []) map[p.id] = p.team_username
        setNameMap(map)
      }
      setLoading(false)
    }
    load()
  }, [])

  const downloadCSV = () => {
    const rows = [['#', 'Seller', 'Buyer', 'Credits', 'Price/Credit', 'Total (Rs)', 'Date & Time']]
    trades.forEach((t, i) => {
      rows.push([
        String(trades.length - i),
        nameMap[t.seller_id] ?? '—',
        nameMap[t.buyer_id] ?? '—',
        String(t.credits_amount),
        String(Number(t.price_per_credit).toFixed(0)),
        t.total_price != null ? String(Number(t.total_price).toFixed(0)) : '—',
        new Date(t.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      ])
    })
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'all_trades.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0D1117' }}>
      {/* Header */}
      <div style={{ background: '#0D2818', borderBottom: '1px solid #1E3A2F', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#A8D5B5', border: '1px solid rgba(168,213,181,0.2)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'none' }}
          >
            ← Back
          </Link>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.15rem', color: '#fff' }}>
            ⚡ All Trades — <span style={{ color: '#FFB74D' }}>GreenCredits</span>
          </span>
        </div>
        <button
          onClick={downloadCSV}
          disabled={loading || trades.length === 0}
          style={{ background: 'rgba(255,183,77,0.12)', border: '1px solid rgba(255,183,77,0.3)', color: '#FFB74D', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}
        >
          ⬇ Download CSV
        </button>
      </div>

      <div style={{ maxWidth: 1000, margin: '32px auto', padding: '0 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
            Loading trades...
          </div>
        ) : trades.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>No trades recorded yet.</div>
        ) : (
          <div style={{ background: '#161B22', border: '1px solid #1E3A2F', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1E3A2F', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, color: '#FFB74D', fontSize: '0.85rem' }}>{trades.length} total trade{trades.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#111A14' }}>
                    {['#', 'Seller', 'Buyer', 'Credits', 'Price/Credit', 'Total', 'Date & Time'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#6B7280', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t, i) => (
                    <tr key={t.id} style={{ borderTop: '1px solid #1A2320' }}>
                      <td style={{ padding: '11px 16px', color: '#6B7280', fontSize: '0.8rem' }}>{trades.length - i}</td>
                      <td style={{ padding: '11px 16px', color: '#4CAF50', fontWeight: 600 }}>{nameMap[t.seller_id] ?? '—'}</td>
                      <td style={{ padding: '11px 16px', color: '#CE93D8', fontWeight: 600 }}>{nameMap[t.buyer_id] ?? '—'}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ background: 'rgba(76,175,80,0.12)', color: '#4CAF50', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>
                          ♻️ {t.credits_amount}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', color: '#6B7280' }}>₹{Number(t.price_per_credit).toFixed(0)}</td>
                      <td style={{ padding: '11px 16px', fontWeight: 700, color: '#FFB74D' }}>
                        {t.total_price != null ? `₹${Number(t.total_price).toFixed(0)}` : '—'}
                      </td>
                      <td style={{ padding: '11px 16px', color: '#6B7280', fontSize: '0.8rem' }}>
                        {new Date(t.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
