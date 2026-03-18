'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        supabase
          .from('profiles')
          .select('stall_name, carbon_balance')
          .eq('id', data.user.id)
          .single()
          .then(({ data: p }) => setProfile(p))
      }
    })
  }, [pathname])

  // Close menus when route changes
  useEffect(() => { setMobileOpen(false); setMenuOpen(false) }, [pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const navActive = (path: string) => pathname === path

  return (
    <>
      <nav style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #C8E6C9',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 8px rgba(26,60,43,0.07)',
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>🌿</span>
          <span className="brand-logo" style={{ fontSize: '1.4rem', color: '#1A3C2B', letterSpacing: '-0.03em' }}>
            Green<span style={{ color: '#4CAF50' }}>Credits</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="desktop-nav">
          {[
            { href: '/', label: 'Marketplace' },
            { href: '/how-it-works', label: 'How It Works' },
            { href: '/about', label: 'About' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{
              color: navActive(href) ? '#4CAF50' : '#1A3C2B',
              fontWeight: navActive(href) ? 600 : 400,
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}>{label}</Link>
          ))}
        </div>

        {/* Desktop auth area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="desktop-nav">
          {user ? (
            <>
              {profile && (
                <div style={{
                  background: '#E8F5E9', border: '1px solid #C8E6C9',
                  borderRadius: 20, padding: '4px 12px',
                  fontSize: '0.8rem', color: '#2D6A4F', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <span>🍃</span>
                  <span>{profile.carbon_balance ?? 0} credits</span>
                </div>
              )}
              <Link href="/sell" style={{
                background: '#4CAF50', color: '#fff',
                padding: '8px 18px', borderRadius: 20,
                textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600,
              }}>+ Sell Credits</Link>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    background: '#1A3C2B', color: '#fff', border: 'none',
                    borderRadius: '50%', width: 36, height: 36,
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700,
                  }}
                >
                  {profile?.stall_name?.[0] ?? '?'}
                </button>
                {menuOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: 44,
                    background: '#fff', border: '1px solid #C8E6C9',
                    borderRadius: 12, minWidth: 180,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    zIndex: 200, overflow: 'hidden',
                  }}>
                    {[
                      { href: '/my-listings', label: 'My Listings' },
                      { href: '/profile', label: 'Profile' },
                    ].map(item => (
                      <Link key={item.href} href={item.href}
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: 'block', padding: '12px 16px',
                          color: '#1A3C2B', textDecoration: 'none',
                          fontSize: '0.9rem', borderBottom: '1px solid #E8F5E9',
                        }}
                      >{item.label}</Link>
                    ))}
                    <button onClick={handleLogout} style={{
                      display: 'block', width: '100%',
                      padding: '12px 16px', background: 'none', border: 'none',
                      textAlign: 'left', color: '#C62828',
                      cursor: 'pointer', fontSize: '0.9rem',
                    }}>Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/auth" style={{
              background: '#1A3C2B', color: '#fff',
              padding: '8px 20px', borderRadius: 20,
              textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600,
            }}>Login</Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'none', flexDirection: 'column', gap: 5,
            padding: 8, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ display: 'block', width: 22, height: 2, background: '#1A3C2B', borderRadius: 2, transition: 'all 0.2s', transform: mobileOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#1A3C2B', borderRadius: 2, opacity: mobileOpen ? 0 : 1, transition: 'all 0.2s' }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#1A3C2B', borderRadius: 2, transition: 'all 0.2s', transform: mobileOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
        </button>
      </nav>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, bottom: 0,
          background: '#fff', zIndex: 99,
          borderTop: '1px solid #C8E6C9',
          overflowY: 'auto',
        }}>
          {/* Credits badge */}
          {user && profile && (
            <div style={{
              margin: '16px 20px 0',
              background: '#E8F5E9', border: '1px solid #C8E6C9',
              borderRadius: 12, padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ color: '#2D6A4F', fontWeight: 600, fontSize: '0.9rem' }}>
                🍃 {profile.carbon_balance ?? 0} credits
              </span>
              <span style={{ color: '#6B7280', fontSize: '0.82rem' }}>{profile.stall_name}</span>
            </div>
          )}

          {/* Nav links */}
          <div style={{ padding: '8px 0' }}>
            {[
              { href: '/', label: '🛒 Marketplace' },
              { href: '/how-it-works', label: '❓ How It Works' },
              { href: '/about', label: 'ℹ️ About' },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'block', padding: '15px 20px',
                  color: navActive(href) ? '#4CAF50' : '#1A3C2B',
                  fontWeight: navActive(href) ? 700 : 500,
                  textDecoration: 'none', fontSize: '1rem',
                  borderBottom: '1px solid #F0F7F1',
                }}
              >{label}</Link>
            ))}

            {user ? (
              <>
                {[
                  { href: '/sell', label: '+ Sell Credits', green: true },
                  { href: '/my-listings', label: '📋 My Listings' },
                  { href: '/profile', label: '👤 Profile' },
                ].map(({ href, label, green }) => (
                  <Link key={href} href={href}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: 'block', padding: '15px 20px',
                      color: green ? '#4CAF50' : '#1A3C2B',
                      fontWeight: green ? 700 : 500,
                      textDecoration: 'none', fontSize: '1rem',
                      borderBottom: '1px solid #F0F7F1',
                    }}
                  >{label}</Link>
                ))}
                <button onClick={() => { handleLogout(); setMobileOpen(false) }} style={{
                  display: 'block', width: '100%', padding: '15px 20px',
                  background: 'none', border: 'none', textAlign: 'left',
                  color: '#C62828', cursor: 'pointer', fontSize: '1rem', fontWeight: 500,
                }}>🚪 Logout</button>
              </>
            ) : (
              <Link href="/auth" onClick={() => setMobileOpen(false)} style={{
                display: 'block', margin: '16px 20px',
                background: '#1A3C2B', color: '#fff',
                padding: '14px 20px', borderRadius: 12,
                textDecoration: 'none', fontSize: '1rem', fontWeight: 700,
                textAlign: 'center',
              }}>Login →</Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}
