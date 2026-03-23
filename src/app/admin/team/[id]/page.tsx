'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

const ADMIN_SECRET = 'GreenAdmin@2025'

type TeamTransaction = {
  id: string
  credits_amount: number
  price_per_credit: number
  total_price: number | null
  created_at: string
  seller_username: string
  buyer_username: string
  role: 'seller' | 'buyer'
}

export default function TeamTradesPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const teamName = searchParams.get('name') ?? 'Team'

  const [txns, setTxns] = useState<TeamTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: ADMIN_SECRET, action: 'get-team-transactions', id }),
    })
      .then(r => r.json())
      .then(({ data }) => { setTxns(data ?? []); setLoading(false) })
  }, [id])

  return (
    <div style={{ minHeight: '100vh', background: '#F0F7F1' }}>
      <div style={{ background: '#1A3C2B', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => window.close()}
          style={{ background: 'rgba(255,255,255,0.1)', color: '#A8D5B5', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          ← Close
        </button>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>
          📊 All Trades — <span style={{ color: '#4CAF50' }}>{teamName}</span>
        </span>
      </div>

      <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>♻️</div>
            Loading trades...
          </div>
        ) : txns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9E9E9E' }}>No transactions found for this team.</div>
        ) : (
          <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8F5E9', fontWeight: 700, color: '#1A3C2B' }}>
              {txns.length} transaction{txns.length !== 1 ? 's' : ''}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' }}>
                <thead>
                  <tr style={{ background: '#F0F7F1' }}>
                    {['#', 'Role', 'Counterparty', 'Credits', 'Price/Credit', 'Total', 'Date & Time'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#6B7280', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txns.map((t, i) => (
                    <tr key={t.id} style={{ borderTop: '1px solid #E8F5E9', background: i % 2 === 0 ? '#fff' : '#FAFFFE' }}>
                      <td style={{ padding: '12px 16px', color: '#9E9E9E', fontSize: '0.8rem' }}>{txns.length - i}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: t.role === 'seller' ? '#E8F5E9' : '#EDE7F6',
                          color: t.role === 'seller' ? '#2D6A4F' : '#4527A0',
                          borderRadius: 6, padding: '2px 8px', fontWeight: 700, fontSize: '0.75rem',
                        }}>
                          {t.role === 'seller' ? '▲ SOLD' : '▼ BOUGHT'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1A3C2B' }}>
                        {t.role === 'seller' ? t.buyer_username : t.seller_username}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#E8F5E9', color: '#2D6A4F', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>
                          ♻️ {t.credits_amount}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#6B7280' }}>₹{Number(t.price_per_credit).toFixed(0)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#4CAF50' }}>
                        {t.total_price != null ? `₹${Number(t.total_price).toFixed(0)}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#9E9E9E', fontSize: '0.82rem' }}>
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
