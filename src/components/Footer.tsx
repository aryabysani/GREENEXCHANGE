import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{
      background: '#1A3C2B',
      color: '#A8D5B5',
      padding: '40px 24px 24px',
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 32,
          marginBottom: 32,
        }}>
          <div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>♻️</span>{' '}
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>
                Green<span style={{ color: '#4CAF50' }}>Credits</span>
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
              Trade carbon credits. Go green. Make your fest sustainable.
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: 12, fontSize: '0.9rem' }}>Platform</div>
            {[
              { href: '/', label: 'Marketplace' },
              { href: '/sell', label: 'Sell Credits' },
              { href: '/my-listings', label: 'My Listings' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ display: 'block', color: '#A8D5B5', textDecoration: 'none', fontSize: '0.85rem', marginBottom: 6 }}>
                {l.label}
              </Link>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: 12, fontSize: '0.9rem' }}>Info</div>
            {[
              { href: '/about', label: 'About' },
              { href: '/how-it-works', label: 'How It Works' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ display: 'block', color: '#A8D5B5', textDecoration: 'none', fontSize: '0.85rem', marginBottom: 6 }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid #2D6A4F', paddingTop: 16, fontSize: '0.8rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div>© 2026 GreenCredits · Less carbon, more clout ♻️</div>
          <div>
            Built by{' '}
            <a href="https://aryab.in" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', fontWeight: 600, textDecoration: 'none' }}>
              Arya Bysani
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
