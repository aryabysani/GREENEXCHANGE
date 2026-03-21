'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function SellPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ team_username: string; carbon_balance: number | null } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [tradingActive, setTradingActive] = useState(true)

  const [creditsAmount, setCreditsAmount] = useState('')
  const [pricePerCredit, setPricePerCredit] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [matchResult, setMatchResult] = useState<{ matched: number; total: number } | null>(null)

  const totalPrice = creditsAmount && pricePerCredit
    ? (parseFloat(creditsAmount) * parseFloat(pricePerCredit)).toFixed(2)
    : null

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth'); return }
      setUserId(data.user.id)
      supabase.from('profiles').select('team_username, carbon_balance').eq('id', data.user.id).single()
        .then(({ data: p }) => { setProfile(p); setAuthLoading(false) })
    })
    fetch(`/api/trading-status?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).then(d => setTradingActive(d.active !== false))
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMatchResult(null)
    const credits = parseInt(creditsAmount)
    const price = parseFloat(pricePerCredit)
    if (!credits || credits <= 0) { setError('Credits must be a positive number.'); return }
    if (!price || price <= 0) { setError('Price must be a positive number.'); return }

    setLoading(true)
    const res = await fetch('/api/place-sell-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: credits, pricePerCredit: price }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Something went wrong.'); setLoading(false); return }

    setMatchResult({ matched: json.matched ?? 0, total: credits })
    setCreditsAmount('')
    setPricePerCredit('')
    setLoading(false)
    // Refresh profile balance
    if (userId) {
      const supabase = createClient()
      supabase.from('profiles').select('team_username, carbon_balance, whatsapp_number').eq('id', userId).single()
        .then(({ data: p }) => setProfile(p))
    }
  }

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#6B7280' }}><div style={{ fontSize: 48, marginBottom: 12 }}>♻️</div>Loading your stall...</div>
      </div>
      <Footer />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
      <Navbar />

      <div className="sell-container" style={{ maxWidth: 600, margin: '32px auto', padding: '0 24px 64px', width: '100%' }}>
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
            Place Sell Order ♻️
          </h1>
          <p style={{ color: '#6B7280', margin: 0 }}>
            Got surplus credits? Set your price. If a buyer bids higher, you match instantly.
          </p>
        </div>

        {profile && (
          <div style={{
            background: 'linear-gradient(135deg, #1A3C2B, #2D6A4F)',
            borderRadius: 14, padding: '16px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
          }}>
            <div>
              <div style={{ color: '#A8D5B5', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Carbon Balance</div>
              <div style={{ color: profile.carbon_balance != null && profile.carbon_balance < 0 ? '#FF5252' : '#fff', fontWeight: 800, fontSize: '1.6rem', lineHeight: 1.2 }}>
                ♻️ {profile.carbon_balance != null ? profile.carbon_balance : 'Not set'}
                {profile.carbon_balance != null && <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#A8D5B5' }}> credits</span>}
              </div>
              {profile.carbon_balance == null && <div style={{ color: '#FFCDD2', fontSize: '0.78rem', marginTop: 4 }}>Contact admin to set your balance</div>}
              <div style={{ color: '#C8E6C9', fontSize: '0.75rem', marginTop: 6 }}>
                <strong style={{ color: '#fff' }}>Balance = emissions allowed − your carbon footprint.</strong><br />
                <strong style={{ color: '#4CAF50' }}>Surplus</strong> = sell.{' '}
                <strong style={{ color: '#FF5252' }}>Deficit</strong> = buy.
              </div>
            </div>
            <div style={{ color: '#A8D5B5', fontSize: '0.82rem', textAlign: 'right' }}>
              {profile.team_username}
            </div>
          </div>
        )}

{matchResult && (
          <div style={{ background: '#E8F5E9', border: '1.5px solid #4CAF50', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#1A3C2B', fontSize: '1rem', marginBottom: 4 }}>✅ Sell order placed!</div>
            {matchResult.matched > 0 ? (
              <p style={{ margin: 0, color: '#2D6A4F', fontSize: '0.9rem' }}>
                <strong>{matchResult.matched} credits</strong> matched instantly with existing buy orders!
                {matchResult.matched < matchResult.total && ` The remaining ${matchResult.total - matchResult.matched} are live in the order book.`}
              </p>
            ) : (
              <p style={{ margin: 0, color: '#2D6A4F', fontSize: '0.9rem' }}>
                Your sell order for <strong>{matchResult.total} credits</strong> is live in the order book — you&apos;ll match automatically when a buyer bids at your price or higher.
              </p>
            )}
            <Link href="/my-orders" style={{ color: '#4CAF50', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>View My Orders →</Link>
          </div>
        )}

        <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 20, padding: '28px', boxShadow: '0 4px 20px rgba(26,60,43,0.06)' }} className="fade-in-up">
          {error && (
            <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', marginBottom: 20, color: '#C62828', fontSize: '0.9rem' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.875rem', fontWeight: 600, color: '#1A3C2B' }}>Credits to Sell *</label>
              <input
                type="number" min="1" max={profile?.carbon_balance ?? undefined}
                value={creditsAmount} onChange={e => setCreditsAmount(e.target.value)}
                placeholder={`e.g. 20 (max: ${profile?.carbon_balance ?? '?'})`} required
                disabled={!tradingActive}
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #C8E6C9', borderRadius: 10, fontSize: '0.95rem', background: tradingActive ? '#fff' : '#f5f5f5', color: '#1A3C2B', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = '#4CAF50')}
                onBlur={e => (e.target.style.borderColor = '#C8E6C9')}
              />
              {profile && creditsAmount && profile.carbon_balance != null && parseInt(creditsAmount) > profile.carbon_balance && (
                <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: 4 }}>That&apos;s more than your balance of {profile.carbon_balance}. 😅</div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.875rem', fontWeight: 600, color: '#1A3C2B' }}>
                Ask Price per Credit (₹) *
                <span style={{ color: '#9E9E9E', fontWeight: 400, fontSize: '0.8rem' }}> — minimum you&apos;ll accept</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontWeight: 700 }}>₹</span>
                <input
                  type="number" min="1" step="0.01" value={pricePerCredit}
                  onChange={e => setPricePerCredit(e.target.value)} placeholder="e.g. 50" required
                  disabled={!tradingActive}
                  style={{ width: '100%', padding: '12px 14px 12px 28px', border: '1.5px solid #C8E6C9', borderRadius: 10, fontSize: '0.95rem', background: tradingActive ? '#fff' : '#f5f5f5', color: '#1A3C2B', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = '#4CAF50')}
                  onBlur={e => (e.target.style.borderColor = '#C8E6C9')}
                />
              </div>
            </div>

            {totalPrice && (
              <div style={{ background: 'linear-gradient(135deg, #1A3C2B, #2D6A4F)', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#A8D5B5', fontSize: '0.75rem', fontWeight: 600 }}>TOTAL LISTING VALUE</div>
                  <div style={{ color: '#4CAF50', fontWeight: 800, fontSize: '1.6rem' }}>₹{totalPrice}</div>
                </div>
                <div style={{ color: '#A8D5B5', fontSize: '0.82rem', textAlign: 'right' }}>
                  {creditsAmount} credits<br />× ₹{pricePerCredit}/credit
                </div>
              </div>
            )}

            <div style={{ background: '#F0F7F1', border: '1px solid #C8E6C9', borderRadius: 10, padding: '12px 16px', fontSize: '0.82rem', color: '#2D6A4F', lineHeight: 1.6 }}>
              💡 <strong>How matching works:</strong> Your order is instantly matched with the highest existing buy bids. Unmatched quantity stays live in the order book until a buyer appears.
            </div>

            <button
              type="submit"
              disabled={loading || !tradingActive}
              style={{
                background: (loading || !tradingActive) ? '#A8D5B5' : '#4CAF50',
                color: '#fff', border: 'none', borderRadius: 12, padding: '14px',
                fontSize: '1rem', fontWeight: 700,
                cursor: (loading || !tradingActive) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> Placing order...</> : '♻️ Place Sell Order'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .sell-container { padding: 0 16px 48px !important; margin-top: 20px !important; }
        }
      `}</style>
      <Footer />
    </div>
  )
}
