'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1A3C2B 0%, #2D6A4F 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Space Grotesk, sans-serif',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>

        {/* Big 404 */}
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(6rem, 20vw, 10rem)',
          color: '#4CAF50',
          lineHeight: 1,
          letterSpacing: '-0.05em',
          marginBottom: 8,
        }}>
          404
        </div>

        {/* Floating leaf */}
        <div style={{ fontSize: 64, marginBottom: 20, display: 'inline-block', animation: 'float 3s ease-in-out infinite' }}>
          🍃
        </div>

        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(1.4rem, 4vw, 2rem)',
          color: '#fff',
          margin: '0 0 12px',
        }}>
          This page has a bigger carbon footprint than your stall
        </h1>

        <p style={{ color: '#A8D5B5', fontSize: '1rem', margin: '0 0 8px', lineHeight: 1.6 }}>
          Bro this URL does not exist. Not even a little bit. 💀
        </p>
        <p style={{ color: '#A8D5B5', fontSize: '0.9rem', margin: '0 0 32px', opacity: 0.8 }}>
          We looked everywhere. Checked the carbon registry, asked the sustainability committee, even filed a greenwashing complaint — nothing.
        </p>

        {/* Roast cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
          {[
            { emoji: '🧐', text: 'Did you type the URL yourself? Because bestie, that\'s a skill issue.' },
            { emoji: '♻️', text: 'This page has been recycled into the void. It\'s very eco-friendly.' },
            { emoji: '💨', text: 'The carbon emissions from this 404 are immeasurable and you should feel bad.' },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(168,213,181,0.2)',
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              textAlign: 'left',
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{item.emoji}</span>
              <span style={{ color: '#E8F5E9', fontSize: '0.875rem', lineHeight: 1.5 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            background: '#4CAF50',
            color: '#fff',
            padding: '13px 28px',
            borderRadius: 24,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
          }}>
            ← Take me home fr fr
          </Link>
          <Link href="/sell" style={{
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            padding: '13px 28px',
            borderRadius: 24,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            Sell my carbssss instead
          </Link>
        </div>

        <p style={{ color: '#A8D5B5', fontSize: '0.78rem', marginTop: 28, opacity: 0.6 }}>
          no credits were harmed in the making of this 404
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
