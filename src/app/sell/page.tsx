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
  const [profile, setProfile] = useState<{ stall_name: string; carbon_balance: number; whatsapp_number: string | null } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [creditsAmount, setCreditsAmount] = useState('')
  const [pricePerCredit, setPricePerCredit] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalPrice = creditsAmount && pricePerCredit
    ? (parseFloat(creditsAmount) * parseFloat(pricePerCredit)).toFixed(2)
    : null

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/auth')
        return
      }
      setUserId(data.user.id)
      supabase
        .from('profiles')
        .select('stall_name, carbon_balance, whatsapp_number')
        .eq('id', data.user.id)
        .single()
        .then(({ data: p }) => {
          setProfile(p)
          setAuthLoading(false)
        })
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const credits = parseInt(creditsAmount)
    const price = parseFloat(pricePerCredit)

    if (!credits || credits <= 0) { setError('Credits must be a positive number.'); return }
    if (!price || price <= 0) { setError('Price must be a positive number.'); return }
    if (profile?.carbon_balance == null) {
      setError('Your carbon balance has not been set yet. Contact the admin.')
      return
    }
    if (profile && credits > profile.carbon_balance) {
      setError(`You only have ${profile.carbon_balance} credits available. Can't sell what you don't have! ♻️`)
      return
    }
    if (!profile?.whatsapp_number) {
      setError('You need a WhatsApp number on your profile so buyers can contact you. Add it on your profile page first!')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: insertError } = await supabase.from('listings').insert({
      seller_id: userId,
      credits_amount: credits,
      price_per_credit: price,
      total_price: credits * price,
      description: description.trim() || null,
      status: 'live',
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      // Deduct credits from balance
      await supabase
        .from('profiles')
        .update({ carbon_balance: (profile?.carbon_balance ?? 0) - credits })
        .eq('id', userId)
      router.push('/my-listings')
    }
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#6B7280' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>♻️</div>
            <div>Loading your stall...</div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
      <Navbar />

      <div className="sell-container" style={{ maxWidth: 600, margin: '32px auto', padding: '0 24px 64px', width: '100%' }}>
        <Link href="/" style={{ color: '#4CAF50', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          ← Back to Marketplace
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 28 }} className="fade-in-up">
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2rem', color: '#1A3C2B', margin: '0 0 6px' }}>
            List Your Carbssss ♻️
          </h1>
          <p style={{ color: '#6B7280', margin: 0 }}>
            Got surplus credits? Someone out there needs them more than you do.
          </p>
        </div>

        {/* Balance display */}
        {profile && (
          <div style={{
            background: 'linear-gradient(135deg, #1A3C2B, #2D6A4F)',
            borderRadius: 14,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}>
            <div>
              <div style={{ color: '#A8D5B5', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Carbon Balance</div>
              <div style={{ color: profile.carbon_balance != null && profile.carbon_balance < 0 ? '#FF5252' : '#fff', fontWeight: 800, fontSize: '1.6rem', lineHeight: 1.2 }}>
                ♻️ {profile.carbon_balance != null ? profile.carbon_balance : 'NULL'}
                {profile.carbon_balance != null && <span style={{ fontSize: '0.9rem', fontWeight: 400, color: '#A8D5B5' }}> credits</span>}
              </div>
              {profile.carbon_balance == null && (
                <div style={{ color: '#FFCDD2', fontSize: '0.78rem', marginTop: 4 }}>Contact admin to set your balance</div>
              )}
              <div style={{ color: '#C8E6C9', fontSize: '0.75rem', marginTop: 6 }}>
                <strong style={{ color: '#fff' }}>Balance = emissions allowed − your carbon footprint.</strong><br />
                <strong style={{ color: '#4CAF50' }}>Surplus</strong> = sell.{' '}
                <strong style={{ color: '#FF5252' }}>Deficit</strong> = buy.
              </div>
            </div>
            <div style={{ color: '#A8D5B5', fontSize: '0.82rem', textAlign: 'right' }}>
              {profile.stall_name}<br />
              <span style={{ opacity: 0.7 }}>Max you can list</span>
            </div>
          </div>
        )}

        {!profile?.whatsapp_number && (
          <div style={{
            background: '#FFF3E0',
            border: '1px solid #FFE082',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: '0.87rem',
            color: '#E65100',
          }}>
            ⚠️ You need to add your WhatsApp number first so buyers can reach you.{' '}
            <Link href="/profile" style={{ color: '#4CAF50', fontWeight: 600 }}>Update profile →</Link>
          </div>
        )}

        {/* Form */}
        <div style={{
          background: '#fff',
          border: '1.5px solid #C8E6C9',
          borderRadius: 20,
          padding: '28px',
          boxShadow: '0 4px 20px rgba(26,60,43,0.06)',
        }} className="fade-in-up">
          {error && (
            <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', marginBottom: 20, color: '#C62828', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Credits amount */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.875rem', fontWeight: 600, color: '#1A3C2B' }}>
                Credits to Sell *
              </label>
              <input
                type="number"
                min="1"
                max={profile?.carbon_balance ?? undefined}
                value={creditsAmount}
                onChange={e => setCreditsAmount(e.target.value)}
                placeholder={`e.g. 20 (max: ${profile?.carbon_balance ?? '?'})`}
                required
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '1.5px solid #C8E6C9', borderRadius: 10,
                  fontSize: '0.95rem', background: '#fff', color: '#1A3C2B',
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = '#4CAF50')}
                onBlur={e => (e.target.style.borderColor = '#C8E6C9')}
              />
              {profile && creditsAmount && parseInt(creditsAmount) > profile.carbon_balance && (
                <div style={{ color: '#C62828', fontSize: '0.8rem', marginTop: 4 }}>
                  That&apos;s more than your balance of {profile.carbon_balance}. Nice try though. 😅
                </div>
              )}
            </div>

            {/* Price per credit */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.875rem', fontWeight: 600, color: '#1A3C2B' }}>
                Price per Credit (₹) *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: '#6B7280', fontWeight: 700, fontSize: '1rem',
                }}>₹</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={pricePerCredit}
                  onChange={e => setPricePerCredit(e.target.value)}
                  placeholder="e.g. 50"
                  required
                  style={{
                    width: '100%', padding: '12px 14px 12px 28px',
                    border: '1.5px solid #C8E6C9', borderRadius: 10,
                    fontSize: '0.95rem', background: '#fff', color: '#1A3C2B',
                    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#4CAF50')}
                  onBlur={e => (e.target.style.borderColor = '#C8E6C9')}
                />
              </div>
            </div>

            {/* Total price preview */}
            {totalPrice && (
              <div style={{
                background: 'linear-gradient(135deg, #1A3C2B, #2D6A4F)',
                borderRadius: 12,
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ color: '#A8D5B5', fontSize: '0.75rem', fontWeight: 600 }}>TOTAL LISTING PRICE</div>
                  <div style={{ color: '#4CAF50', fontWeight: 800, fontSize: '1.6rem' }}>₹{totalPrice}</div>
                </div>
                <div style={{ color: '#A8D5B5', fontSize: '0.82rem', textAlign: 'right' }}>
                  {creditsAmount} credits<br />× ₹{pricePerCredit}/credit
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.875rem', fontWeight: 600, color: '#1A3C2B' }}>
                Description <span style={{ color: '#9E9E9E', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Any info you want to share — e.g. 'We switched to solar. Now we have carbssss to spare.'"
                rows={3}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '1.5px solid #C8E6C9', borderRadius: 10,
                  fontSize: '0.9rem', background: '#fff', color: '#1A3C2B',
                  outline: 'none', boxSizing: 'border-box', resize: 'vertical',
                  fontFamily: 'Space Grotesk, sans-serif', transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = '#4CAF50')}
                onBlur={e => (e.target.style.borderColor = '#C8E6C9')}
              />
            </div>

            <div style={{
              background: '#F0F7F1', border: '1px solid #C8E6C9',
              borderRadius: 10, padding: '12px 16px', marginBottom: 4,
              fontSize: '0.82rem', color: '#2D6A4F', lineHeight: 1.6,
            }}>
              💡 <strong>How to complete a trade:</strong> Once you&apos;ve agreed on a deal with a buyer, go to <strong>My Listings</strong>, click <strong>🤝 Sold</strong> on this listing, and select the buyer&apos;s stall number. Once you confirm, the credits will be automatically deducted from your balance and added to the buyer&apos;s balance.
            </div>

            <button
              type="submit"
              disabled={loading || !profile?.whatsapp_number}
              style={{
                background: (loading || !profile?.whatsapp_number) ? '#A8D5B5' : '#4CAF50',
                color: '#fff', border: 'none', borderRadius: 12,
                padding: '14px', fontSize: '1rem', fontWeight: 700,
                cursor: (loading || !profile?.whatsapp_number) ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s, transform 0.1s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? (
                <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> Listing...</>
              ) : '♻️ List Credits Now'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .sell-container { padding: 0 16px 48px !important; margin-top: 20px !important; }
          .sell-title { font-size: 1.5rem !important; }
        }
      `}</style>
      <Footer />
    </div>
  )
}
