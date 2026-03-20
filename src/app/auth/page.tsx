'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const email = `${username.trim().toLowerCase()}@fest.com`
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(authError.message)
      } else {
        // Check if profile is set up
        const { data: profile } = await supabase
          .from('profiles')
          .select('whatsapp_number, is_banned')
          .eq('id', data.user!.id)
          .single()
        if (profile?.is_banned) {
          await supabase.auth.signOut()
          setError('BANNED')
          setLoading(false)
          return
        }
        if (!profile?.whatsapp_number) {
          router.push('/onboarding')
        } else {
          router.push('/')
        }
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
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
        {/* Decorative circles */}
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

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="float-anim" style={{ fontSize: 72, marginBottom: 16 }}>♻️</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2.2rem', color: '#fff', letterSpacing: '-0.03em' }}>
            Green<span style={{ color: '#4CAF50' }}>Credits</span>
          </div>
          <p style={{ color: '#A8D5B5', marginTop: 8, fontSize: '1rem' }}>
            Sell your carbssss ♻️
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 260 }}>
          {[
            { icon: '🌱', label: 'Track your carbon balance' },
            { icon: '💱', label: 'Trade surplus credits' },
            { icon: '📱', label: 'Connect via WhatsApp' },
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
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1A3C2B', margin: '0 0 6px' }}>
              Welcome back
            </h1>
            <p style={{ color: '#6B7280', margin: 0, fontSize: '0.95rem' }}>
              Sign in with your stall account
            </p>
          </div>

          {/* Info banner */}
          <div style={{
            background: '#E8F5E9',
            border: '1px solid #C8E6C9',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 24,
            fontSize: '0.85rem',
            color: '#2D6A4F',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}>
            <span>ℹ️</span>
            <span>Use your assigned username (e.g. <strong>stall01</strong>) and password given by the admin.</span>
          </div>

          {error && (
            <div style={{
              background: '#FFEBEE',
              border: '1px solid #FFCDD2',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 20,
              fontSize: '0.9rem',
              color: '#C62828',
            }}>
              {error === 'BANNED' ? (
                <>
                  🚫 You are banned as you have violated the rules.<br /><br />
                  Contact <a href="mailto:xshhssh@gmail.com" style={{ color: '#C62828', fontWeight: 700 }}>xshhssh@gmail.com</a> to get it fixed if you believe you have not done a mistake.
                </>
              ) : error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.875rem', fontWeight: 500, color: '#1A3C2B' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="stall01"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1.5px solid #C8E6C9',
                  borderRadius: 10,
                  fontSize: '0.95rem',
                  background: '#fff',
                  color: '#1A3C2B',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = '#4CAF50')}
                onBlur={e => (e.target.style.borderColor = '#C8E6C9')}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.875rem', fontWeight: 500, color: '#1A3C2B' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 14px',
                    border: '1.5px solid #C8E6C9',
                    borderRadius: 10,
                    fontSize: '0.95rem',
                    background: '#fff',
                    color: '#1A3C2B',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#4CAF50')}
                  onBlur={e => (e.target.style.borderColor = '#C8E6C9')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#6B7280', fontSize: '1rem',
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#A8D5B5' : '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '14px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4,
                transition: 'background 0.2s, transform 0.1s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                  Signing in...
                </>
              ) : 'Sign In →'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link href="/" style={{ color: '#4CAF50', textDecoration: 'none', fontSize: '0.875rem' }}>
              ← Back to Marketplace
            </Link>
          </div>
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
