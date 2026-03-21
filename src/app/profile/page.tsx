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
    team_username: string
    carbon_balance: number
    team_members: string[]
  } | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth'); return }
      setEmail(data.user.email ?? '')
      supabase
        .from('profiles')
        .select('team_username, carbon_balance, team_members')
        .eq('id', data.user.id)
        .single()
        .then(({ data: p }) => {
          setProfile(p)
          setLoading(false)
        })
    })
  }, [router])

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

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2rem', color: '#1A3C2B', margin: '0 0 4px' }}>
            Your Profile 🌱
          </h1>
        </div>

        {/* Carbon balance card */}
        <div style={{
          background: 'linear-gradient(135deg, #1A3C2B, #2D6A4F)',
          borderRadius: 16, padding: '20px 24px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ color: '#A8D5B5', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Carbon Balance
            </div>
            <div style={{ color: profile?.carbon_balance != null && profile.carbon_balance < 0 ? '#FF5252' : '#4CAF50', fontWeight: 800, fontSize: '2.2rem', lineHeight: 1 }}>
              ♻️ {profile?.carbon_balance != null ? profile.carbon_balance : 'Not set'}
            </div>
            <div style={{ color: '#A8D5B5', fontSize: '0.8rem', marginTop: 2 }}>
              {profile?.carbon_balance != null ? 'credits available' : 'Contact admin to set your balance'}
            </div>
            <div style={{ color: '#C8E6C9', fontSize: '0.75rem', marginTop: 8 }}>
              <strong style={{ color: '#4CAF50' }}>Surplus</strong> = sell credits.{' '}
              <strong style={{ color: '#FF5252' }}>Deficit</strong> = buy credits.
            </div>
          </div>
        </div>

        {/* Account info */}
        <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 16, padding: '20px 24px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Username <span style={{ color: '#C8E6C9' }}>(set by admin)</span>
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1A3C2B' }}>
              {profile?.team_username ?? '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Email
            </div>
            <div style={{ fontSize: '0.95rem', color: '#6B7280' }}>{email}</div>
          </div>
        </div>

        {/* Team Members */}
        {profile?.team_members && profile.team_members.length > 0 && (
          <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#1A3C2B', fontSize: '0.9rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              👥 Team Members <span style={{ color: '#9E9E9E', fontWeight: 400, fontSize: '0.8rem' }}>(set by admin)</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {profile.team_members.map((name, i) => (
                <span key={i} style={{ background: '#F0F7F1', border: '1px solid #C8E6C9', borderRadius: 20, padding: '4px 12px', fontSize: '0.83rem', color: '#1A3C2B', fontWeight: 500 }}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <Link href="/my-orders" style={{ background: '#fff', color: '#1A3C2B', border: '1.5px solid #C8E6C9', borderRadius: 10, padding: '10px 18px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', flex: 1, textAlign: 'center' }}>
            📋 My Orders
          </Link>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{ width: '100%', background: 'none', color: '#C62828', border: '1.5px solid #FFCDD2', borderRadius: 12, padding: '12px', fontSize: '0.95rem', fontWeight: 600, cursor: loggingOut ? 'not-allowed' : 'pointer', opacity: loggingOut ? 0.6 : 1 }}
        >
          {loggingOut ? 'Logging out...' : '🚪 Logout'}
        </button>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .profile-container { padding: 0 16px 48px !important; margin-top: 20px !important; }
        }
      `}</style>
      <Footer />
    </div>
  )
}
