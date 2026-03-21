'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function BuyPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<{ team_username: string; carbon_balance: number | null } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [tradingActive, setTradingActive] = useState(true)

  const [quantity, setQuantity] = useState('')
  const [pricePerCredit, setPricePerCredit] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ matched: number; total: number } | null>(null)

  const totalCost = quantity && pricePerCredit
    ? (parseFloat(quantity) * parseFloat(pricePerCredit)).toFixed(2)
    : null

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth'); return }
      supabase.from('profiles').select('team_username, carbon_balance').eq('id', data.user.id).single()
        .then(({ data: p }) => {
          setProfile(p)
          setAuthLoading(false)
        })
    })
    // Check trading status
    fetch(`/api/trading-status?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).then(d => setTradingActive(d.active !== false))
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    const qty = parseInt(quantity)
    const price = parseFloat(pricePerCredit)
    if (!qty || qty <= 0) { setError('Quantity must be a positive number.'); return }
    if (!price || price <= 0) { setError('Price must be a positive number.'); return }

    setLoading(true)
    const res = await fetch('/api/place-buy-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: qty, pricePerCredit: price }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Something went wrong.'); setLoading(false); return }

    setResult({ matched: json.matched ?? 0, total: qty })
    setQuantity('')
    setPricePerCredit('')
    setLoading(false)
  }

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#6B7280' }}><div style={{ fontSize: 48, marginBottom: 12 }}>♻️</div>Loading...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
      <Navbar />

      <div style={{ maxWidth: 600, margin: '32px auto', padding: '0 24px 64px', width: '100%' }}>
        <Link href="/" style={{ color: '#4CAF50', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          ← Back to Order Book
        </Link>

        {!tradingActive && (
          <div style={{ background: '#FFF3E0', border: '1.5px solid #FFE082', borderRadius: 14, padding: '20px', marginBottom: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏸️</div>
            <div style={{ fontWeight: 700, color: '#E65100', fontSize: '1.1rem' }}>Trading is currently paused</div>
            <p style={{ color: '#6B7280', margin: '8px 0 0', fontSize: '0.9rem' }}>The admin will activate trading when it&apos;s time. Check back soon.</p>
          </div>
        )}

        <div style={{ marginBottom: 28 }} className="fade-in-up">
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2rem', color: '#1A3C2B', margin: '0 0 6px' }}>
            Place Buy Order 📈
          </h1>
          <p style={{ color: '#6B7280', margin: 0 }}>
            Set your max price. If a seller is asking less, you match instantly.
          </p>
        </div>

        {profile && (
          <div style={{
            background: 'linear-gradient(135deg, #7B1FA2, #4A148C)',
            borderRadius: 14, padding: '16px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
          }}>
            <div>
              <div style={{ color: '#CE93D8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Carbon Balance</div>
              <div style={{ color: profile.carbon_balance != null && profile.carbon_balance < 0 ? '#FF5252' : '#fff', fontWeight: 800, fontSize: '1.6rem', lineHeight: 1.2 }}>
                ♻️ {profile.carbon_balance != null ? profile.carbon_balance : 'Not set'}
                {profile.carbon_balance != null && <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#CE93D8' }}> credits</span>}
              </div>
              {profile.carbon_balance == null && <div style={{ color: '#FFCDD2', fontSize: '0.78rem', marginTop: 4 }}>Contact admin to set your balance</div>}
              <div style={{ color: '#CE93D8', fontSize: '0.75rem', marginTop: 6 }}>
                <strong style={{ color: '#FF5252' }}>Deficit</strong> = you owe credits = buy to offset.
              </div>
            </div>
            <div style={{ color: '#CE93D8', fontSize: '0.82rem', textAlign: 'right' }}>{profile.team_username}</div>
          </div>
        )}

        {result && (
          <div style={{ background: '#E8F5E9', border: '1.5px solid #4CAF50', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#1A3C2B', fontSize: '1rem', marginBottom: 4 }}>
              ✅ Buy order placed!
            </div>
            {result.matched > 0 ? (
              <p style={{ margin: 0, color: '#2D6A4F', fontSize: '0.9rem' }}>
                <strong>{result.matched} credits</strong> matched instantly from existing sell orders. Your balance has been updated.
                {result.matched < result.total && ` The remaining ${result.total - result.matched} credits are waiting in the order book for a seller.`}
              </p>
            ) : (
              <p style={{ margin: 0, color: '#2D6A4F', fontSize: '0.9rem' }}>
                No matching sell orders right now. Your bid for <strong>{result.total} credits</strong> is live in the order book — you&apos;ll be matched automatically when a seller posts at your price or lower.
              </p>
            )}
          </div>
        )}

        <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 20, padding: '28px', boxShadow: '0 4px 20px rgba(26,60,43,0.06)' }} className="fade-in-up">
          {error && (
            <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', marginBottom: 20, color: '#C62828', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.875rem', fontWeight: 600, color: '#1A3C2B' }}>Credits to Buy *</label>
              <input
                type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 20" required
                disabled={!tradingActive}
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #C8E6C9', borderRadius: 10, fontSize: '0.95rem', background: tradingActive ? '#fff' : '#f5f5f5', color: '#1A3C2B', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = '#7B1FA2')}
                onBlur={e => (e.target.style.borderColor = '#C8E6C9')}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.875rem', fontWeight: 600, color: '#1A3C2B' }}>
                Max Price per Credit (₹) *
                <span style={{ color: '#9E9E9E', fontWeight: 400, fontSize: '0.8rem' }}> — you won&apos;t pay more than this</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontWeight: 700 }}>₹</span>
                <input
                  type="number" min="1" step="0.01" value={pricePerCredit} onChange={e => setPricePerCredit(e.target.value)} placeholder="e.g. 45" required
                  disabled={!tradingActive}
                  style={{ width: '100%', padding: '12px 14px 12px 28px', border: '1.5px solid #C8E6C9', borderRadius: 10, fontSize: '0.95rem', background: tradingActive ? '#fff' : '#f5f5f5', color: '#1A3C2B', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = '#7B1FA2')}
                  onBlur={e => (e.target.style.borderColor = '#C8E6C9')}
                />
              </div>
            </div>

            {totalCost && (
              <div style={{ background: 'linear-gradient(135deg, #7B1FA2, #4A148C)', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#CE93D8', fontSize: '0.75rem', fontWeight: 600 }}>MAX TOTAL COST</div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.6rem' }}>₹{totalCost}</div>
                </div>
                <div style={{ color: '#CE93D8', fontSize: '0.82rem', textAlign: 'right' }}>
                  {quantity} credits<br />× ₹{pricePerCredit} max/credit
                </div>
              </div>
            )}

            <div style={{ background: '#F3E5F5', border: '1px solid #CE93D8', borderRadius: 10, padding: '12px 16px', fontSize: '0.82rem', color: '#4A148C', lineHeight: 1.6 }}>
              💡 <strong>How it works:</strong> Your order will instantly match with the cheapest available sell orders. If no match is found, your bid stays live in the order book — you&apos;ll be matched automatically the moment a seller posts at your price or lower. Actual price = seller&apos;s ask price (you always pay the lower price).
            </div>

            <button
              type="submit"
              disabled={loading || !tradingActive}
              style={{
                background: (!tradingActive || loading) ? '#ccc' : '#7B1FA2',
                color: '#fff', border: 'none', borderRadius: 12,
                padding: '14px', fontSize: '1rem', fontWeight: 700,
                cursor: (!tradingActive || loading) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '⏳ Placing order...' : '📈 Place Buy Order'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          div[style*="maxWidth: 600"] { padding: 0 16px 48px !important; margin-top: 20px !important; }
        }
      `}</style>
      <Footer />
    </div>
  )
}
