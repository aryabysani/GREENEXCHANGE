'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<{
    stall_name: string
    whatsapp_number: string | null
    carbon_balance: number
    team_members: string[]
  } | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [stallName, setStallName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth'); return }
      setEmail(data.user.email ?? '')
      supabase
        .from('profiles')
        .select('stall_name, whatsapp_number, carbon_balance, team_members')
        .eq('id', data.user.id)
        .single()
        .then(({ data: p }) => {
          setProfile(p)
          setStallName(p?.stall_name ?? '')
          setWhatsapp(p?.whatsapp_number ?? '')
          setLoading(false)
        })
    })
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const digits = whatsapp.replace(/\D/g, '')
    if (whatsapp && digits.length !== 10) {
      setError('Enter a valid 10-digit mobile number.')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error: err } = await supabase
      .from('profiles')
      .update({
        stall_name: stallName.trim(),
        whatsapp_number: whatsapp.trim() || null,
      })
      .eq('id', user.id)

    if (err) setError(err.message)
    else {
      setSuccess('Profile updated! Looking good. ♻️')
      setProfile(prev => prev ? { ...prev, stall_name: stallName.trim(), whatsapp_number: whatsapp.trim() || null } : prev)
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#6B7280' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>♻️</div>
            <div>Loading your profile...</div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
      <Navbar />

      <div className="profile-container" style={{ maxWidth: 560, margin: '32px auto', padding: '0 24px 64px', width: '100%' }}>
        <Link href="/" style={{ color: '#4CAF50', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          ← Back to Marketplace
        </Link>

        <div style={{ marginBottom: 28 }} className="fade-in-up">
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2rem', color: '#1A3C2B', margin: '0 0 4px' }}>
            Your Profile 🌱
          </h1>
          <p style={{ color: '#6B7280', margin: 0 }}>Manage your stall info. Make yourself findable.</p>
        </div>

        {/* Carbon balance card (read-only) */}
        <div style={{
          background: 'linear-gradient(135deg, #1A3C2B, #2D6A4F)',
          borderRadius: 16,
          padding: '20px 24px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <div style={{ color: '#A8D5B5', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Carbon Balance
            </div>
            <div style={{ color: '#4CAF50', fontWeight: 800, fontSize: '2.2rem', lineHeight: 1 }}>
              ♻️ {profile?.carbon_balance ?? 0}
            </div>
            <div style={{ color: '#A8D5B5', fontSize: '0.8rem', marginTop: 2 }}>credits available</div>
          </div>
        </div>

        {/* Team Members (read-only) */}
        {profile?.team_members && profile.team_members.length > 0 && (
          <div style={{
            background: '#fff',
            border: '1.5px solid #C8E6C9',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 24,
          }}>
            <div style={{ fontWeight: 700, color: '#1A3C2B', fontSize: '0.9rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              👥 Team Members <span style={{ color: '#9E9E9E', fontWeight: 400, fontSize: '0.8rem' }}>(set by admin)</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {profile.team_members.map((name, i) => (
                <span key={i} style={{
                  background: '#F0F7F1',
                  border: '1px solid #C8E6C9',
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontSize: '0.83rem',
                  color: '#1A3C2B',
                  fontWeight: 500,
                }}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Profile form */}
        <div style={{
          background: '#fff',
          border: '1.5px solid #C8E6C9',
          borderRadius: 20,
          padding: '28px',
          boxShadow: '0 4px 20px rgba(26,60,43,0.06)',
        }} className="fade-in-up">

          {error && (
            <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#C62828', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#E8F5E9', border: '1px solid #C8E6C9', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#2D6A4F', fontSize: '0.9rem' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email (read-only) */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.875rem', fontWeight: 600, color: '#1A3C2B' }}>
                Email <span style={{ color: '#9E9E9E', fontWeight: 400 }}>(assigned by admin)</span>
              </label>
              <input
                type="email"
                value={email}
                readOnly
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '1.5px solid #E0E0E0', borderRadius: 10,
                  fontSize: '0.95rem', background: '#F9F9F9', color: '#9E9E9E',
                  outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed',
                }}
              />
            </div>

            {/* Stall name */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.875rem', fontWeight: 600, color: '#1A3C2B' }}>
                Stall Name *
              </label>
              <input
                type="text"
                value={stallName}
                onChange={e => setStallName(e.target.value)}
                placeholder="e.g. Food Court, Gaming Zone"
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
            </div>

            {/* WhatsApp */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.875rem', fontWeight: 600, color: '#1A3C2B' }}>
                WhatsApp Number *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: '#6B7280', fontSize: '0.9rem',
                }}>📱</span>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{
                    width: '100%', padding: '12px 14px 12px 36px',
                    border: '1.5px solid #C8E6C9', borderRadius: 10,
                    fontSize: '0.95rem', background: '#fff', color: '#1A3C2B',
                    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#4CAF50')}
                  onBlur={e => (e.target.style.borderColor = '#C8E6C9')}
                />
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#9E9E9E' }}>
                Buyers use this to contact you. Without it, you can&apos;t list credits.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                background: saving ? '#A8D5B5' : '#4CAF50',
                color: '#fff', border: 'none', borderRadius: 12,
                padding: '13px', fontSize: '1rem', fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {saving ? (
                <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> Saving...</>
              ) : '💾 Save Changes'}
            </button>
          </form>
        </div>

        {/* Quick links */}
        <div className="profile-links" style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <Link href="/my-listings" style={{
            background: '#fff', color: '#1A3C2B',
            border: '1.5px solid #C8E6C9', borderRadius: 10,
            padding: '10px 18px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', flex: 1, textAlign: 'center',
          }}>📋 My Listings</Link>
          <Link href="/sell" style={{
            background: '#E8F5E9', color: '#2D6A4F',
            border: '1.5px solid #C8E6C9', borderRadius: 10,
            padding: '10px 18px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', flex: 1, textAlign: 'center',
          }}>+ Sell Credits</Link>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            marginTop: 16,
            width: '100%',
            background: 'none', color: '#C62828',
            border: '1.5px solid #FFCDD2', borderRadius: 12,
            padding: '12px', fontSize: '0.95rem', fontWeight: 600,
            cursor: loggingOut ? 'not-allowed' : 'pointer', opacity: loggingOut ? 0.6 : 1,
          }}
        >
          {loggingOut ? 'Logging out...' : '🚪 Logout'}
        </button>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .profile-container { padding: 0 16px 48px !important; margin-top: 20px !important; }
          .profile-title { font-size: 1.5rem !important; }
          .profile-card { padding: 20px 16px !important; }
          .profile-links { flex-direction: column !important; }
        }
      `}</style>
      <Footer />
    </div>
  )
}
