'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type Listing = {
  id: string
  credits_amount: number
  filled_quantity: number | null
  price_per_credit: number
  total_price: number
  status: string
  created_at: string
  seller_id: string
  profiles: {
    team_username: string
  } | null
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase
        .from('listings')
        .select('*, profiles(team_username)')
        .eq('id', id)
        .single(),
      supabase.auth.getUser(),
    ]).then(async ([{ data: listingData, error: listingErr }, { data: authData }]) => {
      let finalListing = listingData

      // If join failed, fetch listing and profile separately
      if (listingErr || !listingData) {
        const { data: listingOnly } = await supabase
          .from('listings')
          .select('*')
          .eq('id', id)
          .single()

        if (listingOnly) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('team_username')
            .eq('id', listingOnly.seller_id)
            .single()
          finalListing = { ...listingOnly, profiles: profileData ?? null }
        }
      }

      if (!finalListing) { setLoading(false); return }
      setListing(finalListing)
      setUserId(authData.user?.id ?? null)
      setLoading(false)

      // Fetch team_members separately — gracefully fails if column doesn't exist
      supabase
        .from('profiles')
        .select('team_members')
        .eq('id', finalListing.seller_id)
        .single()
        .then(({ data }) => {
          if (data?.team_members) setTeamMembers(data.team_members)
        })
    })
  }, [id])

  const isOwner = userId && listing?.seller_id === userId

  const handleDelete = async () => {
    if (!confirm('Delete this listing? Credits will be refunded to your balance.')) return
    setActionLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setActionLoading(false); return }

    await supabase.from('listings').update({ status: 'removed' }).eq('id', id)

    router.push('/my-orders')
    setActionLoading(false)
  }

  const statusColor: Record<string, string> = {
    live: '#4CAF50',
    partial: '#FFB74D',
    sold: '#FF9800',
    removed: '#9E9E9E',
  }
  const statusBg: Record<string, string> = {
    live: '#E8F5E9',
    partial: '#FFF8E1',
    sold: '#FFF3E0',
    removed: '#F5F5F5',
  }
  const statusEmoji: Record<string, string> = {
    live: '♻️',
    partial: '⏳',
    sold: '🤝',
    removed: '🗑️',
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#6B7280' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>♻️</div>
            <div>Loading listing...</div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!listing) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#6B7280' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🏜️</div>
            <h2 style={{ color: '#1A3C2B', marginBottom: 8 }}>Listing not found</h2>
            <p style={{ marginBottom: 20 }}>This listing may have been removed. Nothing to see here.</p>
            <Link href="/" style={{
              background: '#4CAF50', color: '#fff', padding: '10px 24px',
              borderRadius: 20, textDecoration: 'none', fontWeight: 600,
            }}>← Back to Marketplace</Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
      <Navbar />

      <div className="listing-outer" style={{ maxWidth: 720, margin: '32px auto', padding: '0 24px 64px', width: '100%' }}>
        {/* Back */}
        <Link href="/" style={{ color: '#4CAF50', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          ← Back to Marketplace
        </Link>

        {/* Main card */}
        <div style={{
          background: '#fff',
          border: '1.5px solid #C8E6C9',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(26,60,43,0.08)',
        }} className="fade-in-up">
          {/* Header band */}
          <div className="listing-header" style={{
            background: 'linear-gradient(135deg, #1A3C2B 0%, #2D6A4F 100%)',
            padding: '28px 32px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ color: '#A8D5B5', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {listing.profiles?.team_username ?? 'Unknown Stall'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>♻️</span>
                  <div>
                    <div style={{ color: '#4CAF50', fontWeight: 800, fontSize: '2.4rem', lineHeight: 1 }}>
                      {listing.credits_amount}
                    </div>
                    <div style={{ color: '#A8D5B5', fontSize: '0.85rem' }}>Carbon Credits for Sale</div>
                  </div>
                </div>
              </div>
              <div style={{
                background: statusBg[listing.status] ?? '#F5F5F5',
                color: statusColor[listing.status] ?? '#9E9E9E',
                borderRadius: 20,
                padding: '6px 14px',
                fontWeight: 700,
                fontSize: '0.85rem',
                alignSelf: 'flex-start',
              }}>
                {statusEmoji[listing.status]} {listing.status.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="listing-body" style={{ padding: '24px 32px' }}>
            {/* Price breakdown */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}>
              {[
                { label: 'Price per Credit', value: `₹${Number(listing.price_per_credit).toFixed(2)}` },
                { label: 'Credits Amount', value: `${listing.credits_amount}` },
                { label: 'Total Price', value: `₹${Number(listing.total_price).toFixed(2)}`, highlight: true },
              ].map(item => (
                <div key={item.label} style={{
                  background: item.highlight ? 'linear-gradient(135deg, #1A3C2B, #2D6A4F)' : '#F0F7F1',
                  borderRadius: 12,
                  padding: '14px 16px',
                }}>
                  <div style={{ fontSize: '0.75rem', color: item.highlight ? '#A8D5B5' : '#6B7280', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontWeight: 800, fontSize: '1.3rem', color: item.highlight ? '#4CAF50' : '#1A3C2B' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Posted time */}
            <div style={{ fontSize: '0.82rem', color: '#9E9E9E', marginBottom: 24 }}>
              📅 Posted {timeAgo(listing.created_at)} · {new Date(listing.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>

            {/* Team Details */}
            {teamMembers.length > 0 && (
              <div style={{
                background: '#F0F7F1',
                border: '1.5px solid #C8E6C9',
                borderRadius: 14,
                padding: '18px 20px',
                marginBottom: 24,
                position: 'relative',
              }}>
                <div style={{ fontWeight: 700, color: '#1A3C2B', fontSize: '0.9rem', marginBottom: 12 }}>
                  👥 Team Details — {listing.profiles?.team_username}
                </div>
                {userId ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {teamMembers.map((name, i) => (
                      <span key={i} style={{
                        background: '#fff',
                        border: '1px solid #C8E6C9',
                        borderRadius: 20,
                        padding: '4px 12px',
                        fontSize: '0.82rem',
                        color: '#2D6A4F',
                        fontWeight: 500,
                      }}>
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    {/* Blurred placeholder names */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }}>
                      {teamMembers.map((_, i) => (
                        <span key={i} style={{
                          background: '#fff',
                          border: '1px solid #C8E6C9',
                          borderRadius: 20,
                          padding: '4px 12px',
                          fontSize: '0.82rem',
                          color: '#2D6A4F',
                          fontWeight: 500,
                        }}>
                          Member Name
                        </span>
                      ))}
                    </div>
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Link href="/auth" style={{
                        background: '#1A3C2B', color: '#fff',
                        padding: '7px 16px', borderRadius: 8,
                        textDecoration: 'none', fontWeight: 600,
                        fontSize: '0.82rem', whiteSpace: 'nowrap',
                      }}>
                        🔒 Login to view team
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#C62828', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}
            {/* Owner actions */}
            {isOwner && listing.status === 'live' && (
              <div style={{
                background: '#FFF8E1',
                border: '1.5px solid #FFE082',
                borderRadius: 14,
                padding: '20px',
                marginBottom: 20,
              }}>
                <div style={{ fontWeight: 700, color: '#1A3C2B', marginBottom: 6 }}>⚙️ Manage Your Listing</div>
                <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: '0 0 14px' }}>
                  It&apos;s your listing, captain. Do what you want.
                </p>
                <div className="listing-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    style={{
                      background: '#FFEBEE', color: '#C62828',
                      border: '1px solid #FFCDD2', borderRadius: 8, padding: '10px 20px',
                      fontWeight: 600, fontSize: '0.9rem', cursor: actionLoading ? 'not-allowed' : 'pointer',
                      opacity: actionLoading ? 0.6 : 1,
                    }}
                  >
                    🗑️ Delete Listing
                  </button>
                  <Link href="/my-listings" style={{
                    background: '#E8F5E9', color: '#1A3C2B',
                    border: '1px solid #C8E6C9', borderRadius: 8, padding: '10px 20px',
                    fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
                    display: 'inline-block',
                  }}>
                    📋 View All Listings
                  </Link>
                </div>
              </div>
            )}

            {isOwner && listing.status === 'sold' && (
              <div style={{ background: '#FFF3E0', border: '1.5px solid #FFE082', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
                <div style={{ color: '#E65100', fontWeight: 600, fontSize: '0.9rem' }}>🤝 This listing has been marked as sold. W.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .listing-outer { padding: 0 16px 48px !important; margin-top: 20px !important; }
          .listing-header { padding: 20px 18px !important; }
          .listing-header-credits { font-size: 1.8rem !important; }
          .listing-body { padding: 18px 18px !important; }
          .listing-actions { flex-direction: column !important; }
          .listing-actions a, .listing-actions button { width: 100% !important; text-align: center !important; }
        }
      `}</style>
      <Footer />
    </div>
  )
}
