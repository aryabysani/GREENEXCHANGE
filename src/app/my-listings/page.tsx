'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type Listing = {
  id: string
  credits_amount: number
  price_per_credit: number
  total_price: number
  description: string | null
  status: string
  created_at: string
}

type Stall = {
  id: string
  stall_name: string | null
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string; emoji: string }> = {
  live:    { bg: '#E8F5E9', color: '#2D6A4F', label: 'LIVE',    emoji: '♻️' },
  sold:    { bg: '#FFF3E0', color: '#E65100', label: 'SOLD',    emoji: '🤝' },
  removed: { bg: '#F5F5F5', color: '#757575', label: 'REMOVED', emoji: '🗑️' },
}

export default function MyListingsPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [profile, setProfile] = useState<{ stall_name: string; carbon_balance: number | null } | null>(null)
  const [allStalls, setAllStalls] = useState<Stall[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  // Sold modal state
  const [soldModal, setSoldModal] = useState<{ listingId: string; credits: number } | null>(null)
  const [selectedBuyer, setSelectedBuyer] = useState('')
  const [soldLoading, setSoldLoading] = useState(false)
  const [soldError, setSoldError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth'); return }
      const userId = data.user.id

      Promise.all([
        supabase
          .from('listings')
          .select('*')
          .eq('seller_id', userId)
          .neq('status', 'removed')
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('stall_name, carbon_balance')
          .eq('id', userId)
          .single(),
        supabase
          .from('profiles')
          .select('id, stall_name')
          .neq('id', userId)
          .order('stall_name'),
      ]).then(([{ data: listData }, { data: profileData }, { data: stallData }]) => {
        setListings(listData ?? [])
        setProfile(profileData)
        setAllStalls(stallData ?? [])
        setLoading(false)
      })
    })
  }, [router])

  const openSoldModal = (listingId: string, credits: number) => {
    setSelectedBuyer('')
    setSoldError('')
    setSoldModal({ listingId, credits })
  }

  const confirmSold = async () => {
    if (!soldModal || !selectedBuyer) { setSoldError('Please select a buyer.'); return }
    setSoldLoading(true)
    setSoldError('')
    try {
      const res = await fetch('/api/mark-sold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: soldModal.listingId, buyerId: selectedBuyer }),
      })
      const json = await res.json()
      if (!res.ok) { setSoldError(json.error ?? 'Something went wrong.'); return }
      setListings(prev => prev.map(l => l.id === soldModal.listingId ? { ...l, status: 'sold' } : l))
      setSoldModal(null)
    } catch {
      setSoldError('Network error. Try again.')
    } finally {
      setSoldLoading(false)
    }
  }

  const updateStatus = async (id: string, status: 'removed' | 'live') => {
    setActionId(id)
    const supabase = createClient()
    await supabase.from('listings').update({ status }).eq('id', id)
    setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    setActionId(null)
  }

  const liveCount = listings.filter(l => l.status === 'live').length
  const totalCreditsListed = listings.filter(l => l.status === 'live').reduce((s, l) => s + l.credits_amount, 0)
  const totalEarned = listings.filter(l => l.status === 'sold').reduce((s, l) => s + Number(l.total_price), 0)

  const balance = profile?.carbon_balance

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#6B7280' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>♻️</div>
            <div>Loading your listings...</div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
      <Navbar />

      {/* Sold Modal */}
      {soldModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '0 16px',
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '32px 28px',
            maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>🤝</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#1A3C2B', textAlign: 'center', margin: '0 0 4px' }}>
              Who bought it?
            </h2>
            <p style={{ color: '#6B7280', textAlign: 'center', fontSize: '0.88rem', margin: '0 0 20px' }}>
              Selling <strong>{soldModal.credits} credits</strong> — select the buyer and their balance will be updated automatically.
            </p>

            <select
              value={selectedBuyer}
              onChange={e => setSelectedBuyer(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: '1.5px solid #C8E6C9', fontSize: '0.95rem',
                background: '#F9FBF9', color: '#1A3C2B', marginBottom: 12,
                outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="">— Select buyer stall —</option>
              {allStalls.map(s => (
                <option key={s.id} value={s.id}>
                  {s.stall_name ?? `Stall (${s.id.slice(0, 6)})`}
                </option>
              ))}
            </select>

            {soldError && (
              <div style={{ color: '#C62828', fontSize: '0.85rem', marginBottom: 10, textAlign: 'center' }}>
                {soldError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setSoldModal(null)}
                disabled={soldLoading}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  border: '1.5px solid #E0E0E0', background: '#fff',
                  color: '#6B7280', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSold}
                disabled={soldLoading || !selectedBuyer}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  background: selectedBuyer ? '#E65100' : '#ccc',
                  color: '#fff', fontWeight: 700, cursor: selectedBuyer ? 'pointer' : 'not-allowed',
                  border: 'none', fontSize: '0.9rem',
                }}
              >
                {soldLoading ? 'Confirming...' : '✅ Confirm Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mylist-container" style={{ maxWidth: 900, margin: '32px auto', padding: '0 24px 64px', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }} className="fade-in-up">
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2rem', color: '#1A3C2B', margin: '0 0 4px' }}>
            My Listings 📋
          </h1>
          <p style={{ color: '#6B7280', margin: 0 }}>
            {profile?.stall_name} — here&apos;s your carbon credit empire.
          </p>
        </div>

        {/* Balance + stats row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 28,
        }}>
          <div style={{ background: 'linear-gradient(135deg, #1A3C2B, #2D6A4F)', borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ color: '#A8D5B5', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Carbon Balance</div>
            {balance === null || balance === undefined ? (
              <>
                <div style={{ color: '#FFD600', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.3 }}>Not set yet</div>
                <div style={{ color: '#A8D5B5', fontSize: '0.78rem', marginTop: 2 }}>Contact the admin</div>
              </>
            ) : (
              <>
                <div style={{ color: balance < 0 ? '#FF5252' : '#4CAF50', fontWeight: 800, fontSize: '1.8rem', lineHeight: 1 }}>
                  ♻️ {balance}
                </div>
                <div style={{ color: '#A8D5B5', fontSize: '0.78rem' }}>
                  {balance < 0 ? '⚠️ deficit' : 'credits remaining'}
                </div>
              </>
            )}
          </div>
          <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Active Listings</div>
            <div style={{ color: '#1A3C2B', fontWeight: 800, fontSize: '1.8rem', lineHeight: 1 }}>{liveCount}</div>
            <div style={{ color: '#6B7280', fontSize: '0.78rem' }}>{totalCreditsListed} credits on market</div>
          </div>
          <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Total Sold</div>
            <div style={{ color: '#4CAF50', fontWeight: 800, fontSize: '1.8rem', lineHeight: 1 }}>₹{totalEarned.toFixed(0)}</div>
            <div style={{ color: '#6B7280', fontSize: '0.78rem' }}>from {listings.filter(l => l.status === 'sold').length} sold listing{listings.filter(l => l.status === 'sold').length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <span style={{ color: '#6B7280', fontSize: '0.9rem' }}>{listings.length} total listing{listings.length !== 1 ? 's' : ''}</span>
          <Link href="/sell" style={{
            background: '#4CAF50', color: '#fff', padding: '10px 22px',
            borderRadius: 20, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
          }}>+ New Listing</Link>
        </div>

        {/* Listings */}
        {listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#6B7280' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🌱</div>
            <div style={{ fontWeight: 700, color: '#1A3C2B', fontSize: '1.2rem', marginBottom: 8 }}>No listings yet</div>
            <p>You haven&apos;t listed any credits yet. Time to cash in on that eco-virtue.</p>
            <Link href="/sell" style={{
              display: 'inline-block', marginTop: 16,
              background: '#4CAF50', color: '#fff', padding: '12px 28px',
              borderRadius: 20, textDecoration: 'none', fontWeight: 700,
            }}>+ List Your First Credits</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {listings.map((listing, i) => {
              const style = STATUS_STYLES[listing.status] ?? STATUS_STYLES.removed
              const isActive = actionId === listing.id
              return (
                <div key={listing.id} className="fade-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="mylist-card" style={{
                    background: '#fff',
                    border: '1.5px solid #C8E6C9',
                    borderRadius: 16,
                    padding: '18px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 14,
                    opacity: listing.status === 'removed' ? 0.65 : 1,
                  }}>
                    {/* Left info */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{
                          background: style.bg, color: style.color,
                          borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700,
                        }}>
                          {style.emoji} {style.label}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#9E9E9E' }}>{timeAgo(listing.created_at)}</span>
                      </div>
                      <div style={{ fontWeight: 700, color: '#1A3C2B', fontSize: '1.05rem' }}>
                        ♻️ {listing.credits_amount} credits
                      </div>
                      <div style={{ color: '#6B7280', fontSize: '0.85rem' }}>
                        ₹{Number(listing.price_per_credit).toFixed(0)}/credit · Total: <strong style={{ color: '#4CAF50' }}>₹{Number(listing.total_price).toFixed(0)}</strong>
                      </div>
                      {listing.description && (
                        <div style={{ color: '#9E9E9E', fontSize: '0.8rem', marginTop: 4, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 300 }}>
                          {listing.description}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mylist-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Link href={`/listing/${listing.id}`} style={{
                        background: '#E8F5E9', color: '#1A3C2B',
                        border: '1px solid #C8E6C9', borderRadius: 8,
                        padding: '7px 14px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600,
                      }}>View</Link>

                      {listing.status === 'live' && (
                        <>
                          <button
                            onClick={() => openSoldModal(listing.id, listing.credits_amount)}
                            disabled={isActive}
                            style={{
                              background: '#FFF3E0', color: '#E65100',
                              border: '1px solid #FFE082', borderRadius: 8,
                              padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600,
                              cursor: isActive ? 'not-allowed' : 'pointer', opacity: isActive ? 0.5 : 1,
                            }}
                          >
                            🤝 Sold
                          </button>
                          <button
                            onClick={() => updateStatus(listing.id, 'removed')}
                            disabled={isActive}
                            style={{
                              background: '#FFEBEE', color: '#C62828',
                              border: '1px solid #FFCDD2', borderRadius: 8,
                              padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600,
                              cursor: isActive ? 'not-allowed' : 'pointer', opacity: isActive ? 0.5 : 1,
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </>
                      )}

                      {(listing.status === 'sold' || listing.status === 'removed') && (
                        <button
                          onClick={() => updateStatus(listing.id, 'live')}
                          disabled={isActive}
                          style={{
                            background: '#E8F5E9', color: '#2D6A4F',
                            border: '1px solid #C8E6C9', borderRadius: 8,
                            padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600,
                            cursor: isActive ? 'not-allowed' : 'pointer', opacity: isActive ? 0.5 : 1,
                          }}
                        >
                          🔄 Relist
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .mylist-container { padding: 0 16px 48px !important; margin-top: 20px !important; }
          .mylist-card { padding: 14px 16px !important; }
          .mylist-actions { width: 100% !important; }
          .mylist-actions a, .mylist-actions button { flex: 1 !important; text-align: center !important; justify-content: center !important; }
        }
      `}</style>
      <Footer />
    </div>
  )
}
