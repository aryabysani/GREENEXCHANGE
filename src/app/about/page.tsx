import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1A3C2B 0%, #2D6A4F 100%)',
        padding: '56px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🌍</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: '#fff', margin: '0 0 12px' }}>
            What is GreenCredits?
          </h1>
          <p style={{ color: '#A8D5B5', fontSize: '1.05rem', maxWidth: 540, margin: '0 auto' }}>
            It&apos;s like OLX, but instead of selling old furniture,<br />
            you&apos;re selling your good environmental karma. 🌱
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px', width: '100%' }}>

        {/* The Concept */}
        <section style={{ marginBottom: 48 }} className="fade-in-up">
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: '#1A3C2B', marginBottom: 16 }}>
            🧠 The Concept
          </h2>
          <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 16, padding: '24px' }}>
            <p style={{ color: '#374151', lineHeight: 1.8, margin: '0 0 16px' }}>
              At this fest, every stall is assigned a <strong>fixed carbon emission budget</strong> — think of it as your pollution allowance for the event. It covers electricity usage, waste generated, and other environmental impact.
            </p>
            <p style={{ color: '#374151', lineHeight: 1.8, margin: '0 0 16px' }}>
              If your stall runs an air conditioner at full blast, wastes food, and powers seventeen blinking LED signs... you&apos;re probably going over your limit. <strong>You&apos;ll need to buy credits from stalls who actually kept it eco-friendly.</strong>
            </p>
            <p style={{ color: '#374151', lineHeight: 1.8, margin: 0 }}>
              If your stall was a green warrior — minimal waste, efficient energy — you&apos;ll have surplus credits. And with GreenCredits, you can <strong>sell those surplus credits to the less virtuous stalls</strong> and walk away with some extra cash. W behavior.
            </p>
          </div>
        </section>

        {/* Why does this exist */}
        <section style={{ marginBottom: 48 }} className="fade-in-up">
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: '#1A3C2B', marginBottom: 16 }}>
            🤔 Why Does This Exist?
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
          }}>
            {[
              { icon: '🏭', title: 'Real-World Simulation', desc: 'Carbon trading is a real thing. Companies buy and sell carbon credits worth billions. Now your stall gets to play the game.' },
              { icon: '💰', title: 'Financial Incentive', desc: 'Going green literally pays. Stalls that keep their emissions low can earn real rupees from this marketplace.' },
              { icon: '🌱', title: 'Fest-Wide Sustainability', desc: 'By making emissions a tradeable commodity, the fest incentivizes every stall to minimize their environmental impact.' },
              { icon: '📊', title: 'Transparency', desc: 'Everyone can see who\'s selling credits and at what price. Market forces determine the price of being eco-friendly.' },
            ].map(card => (
              <div key={card.title} style={{
                background: '#fff',
                border: '1.5px solid #C8E6C9',
                borderRadius: 14,
                padding: '18px',
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
                <div style={{ fontWeight: 700, color: '#1A3C2B', marginBottom: 6 }}>{card.title}</div>
                <div style={{ color: '#6B7280', fontSize: '0.87rem', lineHeight: 1.6 }}>{card.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* The Rules */}
        <section style={{ marginBottom: 48 }} className="fade-in-up">
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: '#1A3C2B', marginBottom: 16 }}>
            📋 The Rules
          </h2>
          <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 16, padding: '24px' }}>
            {[
              { num: '01', title: 'Fixed Allocation', desc: 'Every stall starts with the same number of carbon credits, assigned by the fest admin. This is your emission budget.' },
              { num: '02', title: 'Track Your Usage', desc: 'Admin monitors actual emissions. If you go over your allocated credits, you\'re in deficit.' },
              { num: '03', title: 'Buy or Sell', desc: 'Deficit? Hit the marketplace and buy credits. Surplus? List yours and earn money.' },
              { num: '04', title: 'WhatsApp to Close', desc: 'GreenCredits is the listing platform. Actual transactions happen off-platform via WhatsApp. Old school, but it works.' },
              { num: '05', title: 'Admin Adjusts Balance', desc: 'Carbon balances are managed by admin based on actual measurements. No self-reporting allowed.' },
            ].map((rule, i) => (
              <div key={rule.num} style={{
                display: 'flex', gap: 16, alignItems: 'flex-start',
                paddingBottom: i < 4 ? 16 : 0,
                marginBottom: i < 4 ? 16 : 0,
                borderBottom: i < 4 ? '1px solid #E8F5E9' : 'none',
              }}>
                <div style={{
                  background: '#1A3C2B', color: '#4CAF50',
                  borderRadius: 8, padding: '4px 10px', fontWeight: 800,
                  fontSize: '0.85rem', flexShrink: 0, fontFamily: 'IBM Plex Mono, monospace',
                }}>{rule.num}</div>
                <div>
                  <div style={{ fontWeight: 700, color: '#1A3C2B', marginBottom: 2 }}>{rule.title}</div>
                  <div style={{ color: '#6B7280', fontSize: '0.87rem', lineHeight: 1.6 }}>{rule.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: 48 }} className="fade-in-up">
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: '#1A3C2B', marginBottom: 16 }}>
            ❓ FAQ
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { q: 'Can I create my own account?', a: 'Nope. Accounts are pre-created by the admin. If you\'re a stall, your credentials were handed to you at registration. No sign-ups, no drama.' },
              { q: 'What happens if I go over my carbon limit and don\'t buy credits?', a: 'That\'s between you and the fest committee. GreenCredits is just the marketplace — enforcement is up to the organizers. But c\'mon, do the right thing.' },
              { q: 'Can I split my credits into multiple listings?', a: 'Yes! You can create multiple listings for partial amounts. Sell 20 now, list 30 later. Completely up to you.' },
              { q: 'Is my WhatsApp number public?', a: 'Only to logged-in users. Guests see a blurred placeholder. So make sure your stall crew is logged in.' },
              { q: 'Who sets the credit price?', a: 'You do! GreenCredits is a free market. Set whatever price you think is fair. Supply and demand, baby.' },
            ].map(item => (
              <details key={item.q} style={{
                background: '#fff', border: '1.5px solid #C8E6C9',
                borderRadius: 12, padding: '14px 18px',
              }}>
                <summary style={{ fontWeight: 600, color: '#1A3C2B', cursor: 'pointer', fontSize: '0.95rem' }}>
                  {item.q}
                </summary>
                <p style={{ color: '#6B7280', margin: '10px 0 0', lineHeight: 1.7, fontSize: '0.9rem' }}>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '40px 24px', background: 'linear-gradient(135deg, #1A3C2B, #2D6A4F)', borderRadius: 20 }} className="fade-in-up">
          <div style={{ fontSize: 40, marginBottom: 12 }}>♻️</div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#fff', margin: '0 0 10px' }}>
            Ready to trade your carbssss?
          </h3>
          <p style={{ color: '#A8D5B5', margin: '0 0 20px', fontSize: '0.95rem' }}>
            Check the marketplace or list your surplus credits now.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" style={{
              background: '#4CAF50', color: '#fff', padding: '11px 26px',
              borderRadius: 20, textDecoration: 'none', fontWeight: 700,
            }}>Browse Marketplace</Link>
            <Link href="/how-it-works" style={{
              background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '11px 26px',
              borderRadius: 20, textDecoration: 'none', fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.2)',
            }}>How It Works</Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
