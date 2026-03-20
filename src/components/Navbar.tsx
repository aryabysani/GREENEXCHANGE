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
          <span style={{ fontSize: 22, lineHeight: 1 }}>♻️</span>
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
                  <span>♻️</span>
                  <span>{profile.carbon_balance != null ? `${profile.carbon_balance} credits` : 'Contact admin'}</span>
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

      {/* Builder bar */}
      <div style={{
        background: '#1A3C2B', color: '#A5D6A7',
        textAlign: 'center', fontSize: '0.75rem',
        padding: '5px 16px', letterSpacing: '0.01em',
      }}>
        Built by{' '}
        <a href="https://aryab.in" target="_blank" rel="noopener noreferrer" style={{
          color: '#fff', fontWeight: 600, textDecoration: 'none',
        }}>Arya Bysani</a>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, bottom: 0,
          background: '#fff', zIndex: 99,
          borderTop: '1px solid #C8E6C9',
          overflowY: 'auto', padding: '20px 16px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>

          {/* Stall info card */}
          {user && profile && (
            <div style={{
              background: '#F0FAF0', border: '1px solid #C8E6C9',
              borderRadius: 14, padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  background: '#1A3C2B', color: '#fff', borderRadius: '50%',
                  width: 36, height: 36, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0,
                }}>{profile.stall_name?.[0] ?? '?'}</div>
                <span style={{ color: '#1A3C2B', fontWeight: 600, fontSize: '0.95rem' }}>{profile.stall_name}</span>
              </div>
              <span style={{
                background: '#E8F5E9', border: '1px solid #A5D6A7',
                borderRadius: 20, padding: '4px 10px',
                color: '#2D6A4F', fontWeight: 700, fontSize: '0.82rem',
              }}>♻️ {profile.carbon_balance != null ? profile.carbon_balance : 'Contact admin'}</span>
            </div>
          )}

          {/* Sell CTA */}
          {user && (
            <Link href="/sell" onClick={() => setMobileOpen(false)} style={{
              display: 'block', background: '#4CAF50', color: '#fff',
              padding: '14px 20px', borderRadius: 12,
              textDecoration: 'none', fontSize: '1rem', fontWeight: 700,
              textAlign: 'center',
            }}>+ Sell Credits</Link>
          )}

          {/* Nav links */}
          <div style={{ border: '1px solid #E8F5E9', borderRadius: 14, overflow: 'hidden' }}>
            {[
              { href: '/', label: 'Marketplace' },
              { href: '/how-it-works', label: 'How It Works' },
              { href: '/about', label: 'About' },
              ...(user ? [
                { href: '/my-listings', label: 'My Listings' },
                { href: '/profile', label: 'Profile' },
              ] : []),
            ].map(({ href, label }, i, arr) => (
              <Link key={href} href={href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'block', padding: '14px 18px',
                  color: navActive(href) ? '#4CAF50' : '#1A3C2B',
                  fontWeight: navActive(href) ? 700 : 500,
                  textDecoration: 'none', fontSize: '0.97rem',
                  borderBottom: i < arr.length - 1 ? '1px solid #F0F7F1' : 'none',
                  background: navActive(href) ? '#F0FAF0' : 'transparent',
                }}
              >{label}</Link>
            ))}
          </div>

          {/* Auth */}
          {user ? (
            <button onClick={() => { handleLogout(); setMobileOpen(false) }} style={{
              width: '100%', padding: '13px 20px',
              background: 'none', border: '1px solid #FFCDD2',
              borderRadius: 12, textAlign: 'center',
              color: '#C62828', cursor: 'pointer', fontSize: '0.97rem', fontWeight: 600,
            }}>Logout</button>
          ) : (
            <Link href="/auth" onClick={() => setMobileOpen(false)} style={{
              display: 'block', background: '#1A3C2B', color: '#fff',
              padding: '14px 20px', borderRadius: 12,
              textDecoration: 'none', fontSize: '1rem', fontWeight: 700,
              textAlign: 'center',
            }}>Login</Link>
          )}
        </div>
      )}
    </>
  )
}
