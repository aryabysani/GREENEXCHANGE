'use client'

import { useEffect, useState } from 'react'
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
  seller_id: string
  profiles: { stall_name: string } | null
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function ListingCard({ listing }: { listing: Listing }) {
  const stall = listing.profiles?.stall_name ?? 'Unknown Stall'
  return (
    <Link href={`/listing/${listing.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#fff',
        border: '1.5px solid #C8E6C9',
        borderRadius: 16,
        padding: 20,
        cursor: 'pointer',
        transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(-3px)'
          el.style.boxShadow = '0 8px 30px rgba(26,60,43,0.12)'
          el.style.borderColor = '#4CAF50'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = 'none'
          el.style.borderColor = '#C8E6C9'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{
            background: '#E8F5E9',
            borderRadius: 8,
            padding: '4px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#2D6A4F',
          }}>
            ♻️ LIVE
          </div>
          <span style={{ fontSize: '0.78rem', color: '#9E9E9E' }}>{timeAgo(listing.created_at)}</span>
        </div>

        {/* Stall name */}
        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1A3C2B', marginBottom: 4 }}>
          {stall}
        </div>

        {/* Credits */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          margin: '12px 0',
          background: 'linear-gradient(135deg, #1A3C2B, #2D6A4F)',
          borderRadius: 10,
          padding: '10px 14px',
        }}>
          <span style={{ fontSize: 20 }}>♻️</span>
          <div>
            <div style={{ color: '#4CAF50', fontWeight: 800, fontSize: '1.4rem', lineHeight: 1 }}>
              {listing.credits_amount}
            </div>
            <div style={{ color: '#A8D5B5', fontSize: '0.75rem' }}>Carbon Credits</div>
          </div>
        </div>

        {/* Price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>per credit</span>
            <div style={{ fontWeight: 700, color: '#1A3C2B', fontSize: '1.1rem' }}>
              ₹{Number(listing.price_per_credit).toFixed(0)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>total</span>
            <div style={{ fontWeight: 800, color: '#4CAF50', fontSize: '1.2rem' }}>
              ₹{Number(listing.total_price).toFixed(0)}
            </div>
          </div>
        </div>

        {listing.description && (
          <p style={{
            color: '#6B7280', fontSize: '0.82rem', margin: '8px 0 0',
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            lineHeight: 1.4,
          }}>
            {listing.description}
          </p>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #E8F5E9', fontSize: '0.8rem', color: '#4CAF50', fontWeight: 500 }}>
          View Details →
        </div>
      </div>
    </Link>
  )
}

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [filtered, setFiltered] = useState<Listing[]>([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('listings')
      .select('*, profiles(stall_name)')
      .eq('status', 'live')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setListings(data ?? [])
        setFiltered(data ?? [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    let result = [...listings]

    if (search) {
      result = result.filter(l =>
        l.profiles?.stall_name?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (sort === 'price_low') result.sort((a, b) => a.price_per_credit - b.price_per_credit)
    else if (sort === 'price_high') result.sort((a, b) => b.price_per_credit - a.price_per_credit)
    else if (sort === 'credits') result.sort((a, b) => b.credits_amount - a.credits_amount)
    else result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setFiltered(result)
  }, [search, sort, listings])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
      <Navbar />

      {/* Hero */}
      <div className="hero-padding" style={{
        background: 'linear-gradient(135deg, #1A3C2B 0%, #2D6A4F 100%)',
        padding: '48px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }} className="fade-in-up">
          <div style={{ fontSize: 48, marginBottom: 12 }}>♻️</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2rem', color: '#fff', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Green<span style={{ color: '#4CAF50' }}>Credits</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.4rem)', fontWeight: 800, color: '#fff', margin: '0 0 12px', fontFamily: 'Syne, sans-serif' }}>
            Sell your carbssss ♻️
          </h1>
          <p style={{ color: '#A8D5B5', fontSize: '1.05rem', margin: '0 0 24px' }}>
            Sitting on carbon credits like it's a flex?<br />
            Time to trade those surplus credits. Turn good eco-behavior into cold hard rupees. 💸
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/sell" style={{
              background: '#4CAF50', color: '#fff', padding: '12px 28px',
              borderRadius: 24, textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem',
            }}>
              + List Your Carbssss
            </Link>
            <Link href="/how-it-works" style={{
              background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '12px 28px',
              borderRadius: 24, textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              How It Works
            </Link>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #C8E6C9', padding: '14px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Live Listings', value: listings.length },
            { label: 'Total Credits Available', value: listings.reduce((s, l) => s + l.credits_amount, 0) },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#1A3C2B' }}>{stat.value}</div>
              <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ maxWidth: 1100, margin: '24px auto 0', padding: '0 24px', width: '100%' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Search by stall name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 200,
              padding: '10px 16px',
              border: '1.5px solid #C8E6C9',
              borderRadius: 10, fontSize: '0.9rem',
              background: '#fff', color: '#1A3C2B', outline: 'none',
            }}
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '1.5px solid #C8E6C9',
              borderRadius: 10, fontSize: '0.9rem',
              background: '#fff', color: '#1A3C2B', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="newest">Newest First</option>
            <option value="price_low">Price: Low → High</option>
            <option value="price_high">Price: High → Low</option>
            <option value="credits">Most Credits</option>
          </select>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: 10 }}>
          {filtered.length} listing{filtered.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Listings grid */}
      <div className="listings-grid" style={{ maxWidth: 1100, margin: '0 auto', padding: '8px 24px 48px', width: '100%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#6B7280' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>♻️</div>
            Loading listings...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#6B7280' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏜️</div>
            <div style={{ fontWeight: 600, color: '#1A3C2B', fontSize: '1.1rem' }}>No listings found</div>
            <p style={{ marginTop: 8 }}>
              {search ? 'Try a different search term.' : 'Be the first to list your surplus credits!'}
            </p>
            <Link href="/sell" style={{
              display: 'inline-block', marginTop: 16,
              background: '#4CAF50', color: '#fff', padding: '10px 24px',
              borderRadius: 20, textDecoration: 'none', fontWeight: 600,
            }}>
              + List Credits
            </Link>
          </div>
        ) : (
          <div className="listing-grid-inner" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20,
          }}>
            {filtered.map((listing, i) => (
              <div key={listing.id} className="fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .hero-title { font-size: 1.6rem !important; }
          .hero-padding { padding: 32px 16px !important; }
          .filter-bar { padding: 0 16px !important; margin-top: 16px !important; }
          .filter-bar input { min-width: unset !important; width: 100% !important; }
          .filter-bar select { width: 100% !important; }
          .listings-grid { padding: 8px 16px 48px !important; }
          .listing-grid-inner { grid-template-columns: 1fr !important; gap: 14px !important; }
        }
      `}</style>
      <Footer />
    </div>
  )
}

