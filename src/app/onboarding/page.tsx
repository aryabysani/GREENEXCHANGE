'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [stallName, setStallName] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth'); return }
      setUserId(data.user.id)
      setLoading(false)
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!stallName.trim()) { setError('Stall name is required.'); return }

    setSaving(true)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('profiles')
      .update({
        stall_name: stallName.trim(),
      })
      .eq('id', userId)

    if (err) {
      setError(err.message)
      setSaving(false)
    } else {
      router.push('/')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F7F1' }}>
        <div style={{ textAlign: 'center', color: '#6B7280' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>♻️</div>
          <div>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #1A3C2B 0%, #2D6A4F 50%, #1A3C2B 100%)',
    }}>
      {/* Left panel */}
      <div style={{
        flex: '0 0 45%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        position: 'relative',
        overflow: 'hidden',
      }}
        className="left-panel"
      >
        <div style={{
          position: 'absolute', width: 300, height: 300,
          borderRadius: '50%', border: '1px solid rgba(168,213,181,0.15)',
          top: '10%', left: '50%', transform: 'translateX(-50%)',
        }} />
        <div style={{
          position: 'absolute', width: 200, height: 200,
          borderRadius: '50%', border: '1px solid rgba(168,213,181,0.1)',
          bottom: '15%', right: '10%',
        }} />

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="float-anim" style={{ fontSize: 72, marginBottom: 16 }}>♻️</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2.2rem', color: '#fff', letterSpacing: '-0.03em' }}>
            Green<span style={{ color: '#4CAF50' }}>Credits</span>
          </div>
          <p style={{ color: '#A8D5B5', marginTop: 8, fontSize: '1rem' }}>
            Let&apos;s set up your stall 🚀
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 260 }}>
          {[
            { icon: '🏪', label: 'Tell us your stall name' },
            { icon: '💸', label: 'Start trading carbon credits' },
          ].map((item) => (
            <div key={item.label} style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(168,213,181,0.2)',
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#E8F5E9',
              fontSize: '0.9rem',
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right" style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        background: '#F0F7F1',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }} className="fade-in-up">
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1A3C2B', margin: '0 0 6px' }}>
              One last thing 👋
            </h1>
            <p style={{ color: '#6B7280', margin: 0, fontSize: '0.95rem' }}>
              Tell us about your stall before you start trading carbssss.
            </p>
          </div>

          {error && (
            <div style={{
              background: '#FFEBEE', border: '1px solid #FFCDD2',
              borderRadius: 10, padding: '10px 14px',
              marginBottom: 20, fontSize: '0.9rem', color: '#C62828',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Stall name */}
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.875rem', fontWeight: 600, color: '#1A3C2B' }}>
                🏪 Stall Name *
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

            <button
              type="submit"
              disabled={saving}
              style={{
                background: saving ? '#A8D5B5' : '#4CAF50',
                color: '#fff', border: 'none', borderRadius: 12,
                padding: '14px', fontSize: '1rem', fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                marginTop: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.2s',
              }}
            >
              {saving ? (
                <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> Saving...</>
              ) : '♻️ Let\'s Go →'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .left-panel { display: none !important; }
          .auth-right { padding: 24px 20px !important; }
        }
      `}</style>
    </div>
  )
}
