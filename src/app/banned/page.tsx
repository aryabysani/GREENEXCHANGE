'use client'

export default function BannedPage() {

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1A3C2B 0%, #2D6A4F 100%)',
      padding: 24,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 24,
        padding: '48px 40px',
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🚫</div>

        <h1 style={{
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 800,
          fontSize: '1.8rem',
          color: '#C62828',
          margin: '0 0 12px',
        }}>
          Your Stall Has Been Banned
        </h1>

        <p style={{ color: '#4B5563', fontSize: '1rem', lineHeight: 1.7, margin: '0 0 24px' }}>
          You have been banned as you have <strong>violated the rules</strong> of GreenCredits.
          You cannot view the market or place any buy or sell orders.
        </p>

        <div style={{
          background: '#FFF3F3',
          border: '1.5px solid #FFCDD2',
          borderRadius: 14,
          padding: '18px 20px',
          marginBottom: 28,
        }}>
          <p style={{ color: '#6B7280', margin: '0 0 8px', fontSize: '0.9rem' }}>
            Think this is a mistake?
          </p>
          <p style={{ color: '#C62828', margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>
            Contact the admin at{' '}
            <a
              href="mailto:xshhssh@gmail.com"
              style={{ color: '#C62828', textDecoration: 'underline' }}
            >
              xshhssh@gmail.com
            </a>
          </p>
        </div>

        <a
          href="/auth"
          style={{
            display: 'inline-block',
            background: '#1A3C2B',
            color: '#fff',
            padding: '12px 28px',
            borderRadius: 10,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
          }}
        >
          ← Back to Login
        </a>
      </div>
    </div>
  )
}
