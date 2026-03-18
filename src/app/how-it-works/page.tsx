import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function HowItWorksPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1A3C2B 0%, #2D6A4F 100%)',
        padding: '56px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🗺️</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: '#fff', margin: '0 0 12px' }}>
            How It Works
          </h1>
          <p style={{ color: '#A8D5B5', fontSize: '1.05rem' }}>
            Three steps. No PhD required.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px', width: '100%' }}>

        {/* 3 Main Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 60, position: 'relative' }}>
          {[
            {
              num: '01',
              emoji: '🌿',
              title: 'Check Your Balance',
              desc: 'Log in with your stall credentials. On your dashboard, you\'ll see your carbon credit balance — how many credits you have left. This is your eco-score, set by the fest admin based on your stall\'s actual emissions.',
              subtext: 'If your balance is high: congrats, you\'re the sustainability champion. 🏆\nIf it\'s low: no judgment, just... maybe lay off the generator.',
              color: '#4CAF50',
              tip: 'Go to /my-listings to see your balance prominently at the top.',
            },
            {
              num: '02',
              emoji: '💰',
              title: 'List Your Surplus Credits',
              desc: 'Got more credits than you need? Sweet. Go to "Sell Credits", enter how many you want to sell, set your price per credit, and add an optional description. Your listing goes live immediately.',
              subtext: 'Pro tip: Set a competitive price. Other stalls are listing too. The market decides. Supply. Demand. Economics.',
              color: '#1A3C2B',
              tip: 'Make sure your WhatsApp number is on your profile first — that\'s how buyers reach you.',
            },
            {
              num: '03',
              emoji: '📱',
              title: 'Connect via WhatsApp',
              desc: 'Browse the marketplace, find a listing you like, and click "Chat on WhatsApp". A pre-filled message is sent to the seller. You two sort it out — agree on terms, pay, done.',
              subtext: 'GreenCredits is the listing platform. The actual transaction is between you and the seller. We just play matchmaker. 💑',
              color: '#2D6A4F',
              tip: 'Both buyer and seller should be logged in to see contact info.',
            },
          ].map((step, i) => (
            <div key={step.num} style={{ display: 'flex', gap: 0, marginBottom: i < 2 ? 0 : 0, position: 'relative' }}>
              {/* Step line connector */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 24, flexShrink: 0 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1A3C2B, #2D6A4F)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'IBM Plex Mono, monospace', fontWeight: 800, fontSize: '0.9rem',
                  color: '#4CAF50', flexShrink: 0, zIndex: 1,
                  border: '3px solid #F0F7F1',
                }}>
                  {step.num}
                </div>
                {i < 2 && (
                  <div style={{ width: 2, flex: 1, minHeight: 24, background: '#C8E6C9', margin: '4px 0' }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingBottom: i < 2 ? 32 : 0 }}>
                <div style={{
                  background: '#fff',
                  border: '1.5px solid #C8E6C9',
                  borderRadius: 16,
                  padding: '22px 24px',
                  marginBottom: 0,
                }} className="fade-in-up">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 28 }}>{step.emoji}</span>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#1A3C2B', margin: 0 }}>
                      {step.title}
                    </h3>
                  </div>
                  <p style={{ color: '#374151', lineHeight: 1.75, margin: '0 0 12px', fontSize: '0.95rem' }}>
                    {step.desc}
                  </p>
                  <p style={{ color: '#6B7280', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 12px', fontStyle: 'italic', whiteSpace: 'pre-line' }}>
                    {step.subtext}
                  </p>
                  <div style={{
                    background: '#E8F5E9',
                    borderLeft: '3px solid #4CAF50',
                    borderRadius: '0 8px 8px 0',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    color: '#2D6A4F',
                    fontWeight: 500,
                  }}>
                    💡 {step.tip}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* For buyers vs sellers */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: '#1A3C2B', marginBottom: 20, textAlign: 'center' }}>
            Are You a Buyer or a Seller?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 16, padding: '24px' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>😅</div>
              <h3 style={{ fontWeight: 800, color: '#1A3C2B', fontSize: '1.1rem', marginBottom: 10 }}>
                You&apos;re over your limit (Buyer)
              </h3>
              <div style={{ color: '#6B7280', fontSize: '0.87rem', lineHeight: 1.7 }}>
                <p style={{ margin: '0 0 8px' }}>Your stall used more than its carbon budget. You need to purchase credits from stalls with surplus.</p>
                <ol style={{ paddingLeft: 18, margin: 0 }}>
                  <li style={{ marginBottom: 6 }}>Browse the marketplace at the home page</li>
                  <li style={{ marginBottom: 6 }}>Find a listing that fits your budget</li>
                  <li style={{ marginBottom: 6 }}>Click the listing to see seller contact</li>
                  <li>Chat on WhatsApp and close the deal</li>
                </ol>
              </div>
              <Link href="/" style={{
                display: 'block', marginTop: 14, textAlign: 'center',
                background: '#4CAF50', color: '#fff', padding: '10px',
                borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
              }}>Browse Listings →</Link>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #1A3C2B, #2D6A4F)', border: '1.5px solid #2D6A4F', borderRadius: 16, padding: '24px' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>😎</div>
              <h3 style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem', marginBottom: 10 }}>
                You&apos;re under your limit (Seller)
              </h3>
              <div style={{ color: '#A8D5B5', fontSize: '0.87rem', lineHeight: 1.7 }}>
                <p style={{ margin: '0 0 8px' }}>Your stall ran clean and has surplus credits. Turn those good vibes into rupees.</p>
                <ol style={{ paddingLeft: 18, margin: 0 }}>
                  <li style={{ marginBottom: 6 }}>Add your WhatsApp number to your profile</li>
                  <li style={{ marginBottom: 6 }}>Go to &quot;Sell Credits&quot;</li>
                  <li style={{ marginBottom: 6 }}>Set amount and price per credit</li>
                  <li>Wait for buyers to DM you on WhatsApp</li>
                </ol>
              </div>
              <Link href="/sell" style={{
                display: 'block', marginTop: 14, textAlign: 'center',
                background: '#4CAF50', color: '#fff', padding: '10px',
                borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
              }}>List Your Credits →</Link>
            </div>
          </div>
        </div>

        {/* Quick FAQ */}
        <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 16, padding: '24px', marginBottom: 40 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#1A3C2B', marginBottom: 16 }}>
            ⚡ Quick Tips
          </h3>
          {[
            { icon: '🔐', text: 'No sign-up. Your stall account was pre-created. Use your assigned email + password.' },
            { icon: '📱', text: 'Add your WhatsApp number on your profile page before you can list credits.' },
            { icon: '💸', text: 'You set the price. There\'s no minimum or maximum. The market decides.' },
            { icon: '♻️', text: 'You can split your credits across multiple listings. Sell in batches.' },
            { icon: '🔄', text: 'Changed your mind? Relist a sold/deleted listing anytime from My Listings.' },
          ].map(tip => (
            <div key={tip.text} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.5 }}>{tip.icon}</span>
              <span style={{ color: '#374151', fontSize: '0.9rem', lineHeight: 1.6 }}>{tip.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <Link href="/" style={{
            background: '#4CAF50', color: '#fff', padding: '14px 32px',
            borderRadius: 24, textDecoration: 'none', fontWeight: 700, fontSize: '1rem',
            display: 'inline-block',
          }}>
            🌿 Go to Marketplace
          </Link>
          <div style={{ marginTop: 12 }}>
            <Link href="/about" style={{ color: '#4CAF50', textDecoration: 'none', fontSize: '0.9rem' }}>
              Learn more about GreenCredits →
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
