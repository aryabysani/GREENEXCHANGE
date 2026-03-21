import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function HowItWorksPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0D1117' }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #071A0F 0%, #0D2818 60%, #0A1F14 100%)',
        padding: '56px 24px 48px',
        borderBottom: '1px solid #1E3A2F',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#fff', margin: '0 0 12px', letterSpacing: '-0.03em' }}>
            How It Works
          </h1>
          <p style={{ color: '#6B9E7E', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
            GreenCredits uses a <strong style={{ color: '#4CAF50' }}>live limit order book</strong> — exactly like a stock market.<br />
            Orders match automatically. No WhatsApp. No middleman. Instant.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px 80px', width: '100%' }}>

        {/* What is a carbon balance */}
        <div style={{ background: '#161B22', border: '1px solid #1E3A2F', borderRadius: 16, padding: '28px 32px', marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#4CAF50', margin: '0 0 14px' }}>
            ♻️ What is a Carbon Balance?
          </h2>
          <p style={{ color: '#C8E6C9', fontSize: '0.95rem', lineHeight: 1.75, margin: '0 0 14px' }}>
            Every team gets a carbon budget — the amount of emissions they&apos;re allowed for the fest.
            After the event, their actual footprint is measured and compared.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div style={{ background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.25)', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ color: '#4CAF50', fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>Surplus (Positive balance)</div>
              <div style={{ color: '#6B9E7E', fontSize: '0.87rem', lineHeight: 1.6 }}>You emitted less than your budget. You have spare credits — sell them and earn money.</div>
            </div>
            <div style={{ background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.25)', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ color: '#FF5252', fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>Deficit (Negative balance)</div>
              <div style={{ color: '#9E6B6B', fontSize: '0.87rem', lineHeight: 1.6 }}>You went over budget. You need to buy credits from surplus teams to offset your footprint.</div>
            </div>
          </div>
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, color: '#6B7280', fontSize: '0.82rem' }}>
            <strong style={{ color: '#A8D5B5' }}>Balance = Emissions Allowed − Your Carbon Footprint.</strong> Admin sets your balance. You can view it on your profile.
          </div>
        </div>

        {/* The 4 steps */}
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#fff', margin: '0 0 20px', textAlign: 'center' }}>
          The Trading Flow
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
          {[
            {
              num: '01',
              emoji: '🔐',
              title: 'Log In',
              color: '#6B9E7E',
              accent: '#1E3A2F',
              desc: 'Use the email and password assigned to your team by the admin. Your carbon balance is pre-set — no sign-up needed.',
            },
            {
              num: '02',
              emoji: '📊',
              title: 'Check the Order Book',
              color: '#4CAF50',
              accent: '#1E3A2F',
              desc: 'The marketplace shows all live sell orders (sorted cheapest first) and live buy bids (sorted highest first) in real time. It updates automatically — no refresh needed.',
            },
            {
              num: '03',
              emoji: '📈',
              title: 'Place Your Order',
              color: '#CE93D8',
              accent: '#2A1A3E',
              desc: 'Deficit team? Go to Buy Credits — enter quantity and the maximum price per credit you\'re willing to pay. Surplus team? Go to Sell Credits — enter quantity and the minimum price per credit you\'ll accept.',
            },
            {
              num: '04',
              emoji: '⚡',
              title: 'Instant Matching',
              color: '#FFB74D',
              accent: '#2A1E0A',
              desc: 'The system immediately checks for matches. A buy order matches with the cheapest available sell orders at or below your max price. A sell order matches with the highest available buy bids at or above your ask. Matches execute automatically — no confirmation needed.',
            },
            {
              num: '05',
              emoji: '♻️',
              title: 'Balances Update',
              color: '#4CAF50',
              accent: '#1E3A2F',
              desc: 'When a trade executes, the buyer\'s carbon balance increases (deficit reduces) and the seller\'s balance decreases. If a buyer\'s balance reaches 0 or above after a fill, their remaining open buy orders are automatically cancelled.',
            },
            {
              num: '06',
              emoji: '📋',
              title: 'Track in My Orders',
              color: '#6B9E7E',
              accent: '#1E3A2F',
              desc: 'Visit My Orders to see all your open bids, live sell listings, and completed trades with full price history. You can cancel any open or partial order at any time — unfilled sell credits are refunded to your balance.',
            },
          ].map((step, i) => (
            <div key={step.num} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0, marginTop: 2,
                background: `rgba(${step.color === '#4CAF50' ? '76,175,80' : step.color === '#CE93D8' ? '206,147,216' : step.color === '#FFB74D' ? '255,183,77' : '107,158,126'},0.12)`,
                border: `1px solid ${step.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, fontSize: '0.75rem', color: step.color,
              }}>
                {step.num}
              </div>
              <div style={{ flex: 1, background: '#161B22', border: `1px solid #${step.accent.replace('#', '')}`, borderRadius: 14, padding: '18px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{step.emoji}</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{step.title}</span>
                </div>
                <p style={{ color: '#8B9467', fontSize: '0.9rem', lineHeight: 1.7, margin: 0, color: '#9CA3AF' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Matching logic explainer */}
        <div style={{ background: '#161B22', border: '1px solid #2A1A3E', borderRadius: 16, padding: '28px 32px', marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#CE93D8', margin: '0 0 16px' }}>
            ⚡ How Matching Works (Price-Time Priority)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'You place a Buy order at ₹50 max', result: 'System scans all live sell orders priced ≤ ₹50, fills from cheapest first. You always pay the seller\'s lower ask price, not your max.', color: '#CE93D8' },
              { label: 'You place a Sell order at ₹40 ask', result: 'System scans all open buy bids priced ≥ ₹40, fills from highest bid first. Trade executes at your ask price (₹40).', color: '#4CAF50' },
              { label: 'No matching order exists', result: 'Your order stays live in the order book. It fills automatically the moment a matching order appears — even if you\'ve closed the tab.', color: '#FFB74D' },
              { label: 'Partial fill', result: 'If only some of your quantity matches, the filled portion executes immediately. The rest stays open as a partial order.', color: '#6B9E7E' },
            ].map(item => (
              <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ color: item.color, fontWeight: 600, fontSize: '0.87rem' }}>→ {item.label}</div>
                <div style={{ color: '#9CA3AF', fontSize: '0.85rem', lineHeight: 1.6 }}>{item.result}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Buyer vs Seller */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 40 }}>
          <div style={{ background: '#161B22', border: '1px solid #2A1A3E', borderRadius: 16, padding: '24px' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>😅</div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: '#CE93D8', fontSize: '1.1rem', marginBottom: 10 }}>
              In Deficit? (Buyer)
            </h3>
            <ol style={{ color: '#9CA3AF', fontSize: '0.87rem', lineHeight: 1.8, paddingLeft: 18, margin: '0 0 16px' }}>
              <li>Go to <strong style={{ color: '#CE93D8' }}>Buy Credits</strong></li>
              <li>Enter quantity needed</li>
              <li>Enter max price you&apos;ll pay per credit</li>
              <li>Submit — instant match if sellers exist</li>
              <li>Check <strong style={{ color: '#CE93D8' }}>My Orders</strong> to track status</li>
            </ol>
            <Link href="/buy" style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg, #4A148C, #7B1FA2)', color: '#fff', padding: '10px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
              📈 Buy Credits →
            </Link>
          </div>

          <div style={{ background: '#161B22', border: '1px solid #1E3A2F', borderRadius: 16, padding: '24px' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>😎</div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: '#4CAF50', fontSize: '1.1rem', marginBottom: 10 }}>
              In Surplus? (Seller)
            </h3>
            <ol style={{ color: '#9CA3AF', fontSize: '0.87rem', lineHeight: 1.8, paddingLeft: 18, margin: '0 0 16px' }}>
              <li>Go to <strong style={{ color: '#4CAF50' }}>Sell Credits</strong></li>
              <li>Enter quantity to sell</li>
              <li>Enter minimum ask price per credit</li>
              <li>Submit — instant match if buyers exist</li>
              <li>Check <strong style={{ color: '#4CAF50' }}>My Orders → My Sales</strong> for history</li>
            </ol>
            <Link href="/sell" style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg, #2E7D32, #4CAF50)', color: '#fff', padding: '10px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
              ♻️ Sell Credits →
            </Link>
          </div>
        </div>

        {/* Settlement */}
        <div style={{ background: '#1A1200', border: '1px solid #FFB74D40', borderRadius: 16, padding: '28px 32px', marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#FFB74D', margin: '0 0 14px' }}>
            💸 Offline Settlement
          </h2>
          <p style={{ color: '#D4A847', fontSize: '0.95rem', lineHeight: 1.75, margin: '0 0 16px' }}>
            The platform records every trade automatically — but <strong style={{ color: '#FFD54F' }}>actual payment happens offline, in person</strong>, after all rounds of trading are done.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '📋', text: 'After trading closes, visit My Orders to see your full settlement summary.' },
              { icon: '💰', text: 'Buyers: You owe each seller the total amount shown for credits purchased from them. Pay them directly.' },
              { icon: '🤝', text: 'Sellers: You are owed by each buyer who matched with your listings. Collect from them in person.' },
              { icon: '✅', text: 'The platform shows exactly who owes who and how much — use it as your receipt.' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(255,183,77,0.05)', border: '1px solid rgba(255,183,77,0.12)', borderRadius: 10, padding: '12px 14px' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                <span style={{ color: '#9CA3AF', fontSize: '0.88rem', lineHeight: 1.65 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key rules */}
        <div style={{ background: '#161B22', border: '1px solid #1E3A2F', borderRadius: 16, padding: '24px 28px', marginBottom: 40 }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: '#fff', marginBottom: 16, fontSize: '1.1rem' }}>
            📌 Key Rules
          </h3>
          {[
            { icon: '🔐', text: 'Your login was pre-created by admin. Your username cannot be changed.' },
            { icon: '⚖️', text: 'You can only sell as many credits as your current balance. You can\'t oversell.' },
            { icon: '🤖', text: 'Matching is fully automatic. No manual confirmation or WhatsApp needed.' },
            { icon: '❌', text: 'You can cancel any open or partial order from My Orders. Unfilled sell credits are refunded.' },
            { icon: '📉', text: 'Once your deficit reaches zero, your remaining buy orders are automatically cancelled.' },
            { icon: '🕐', text: 'Trading only works when the admin has opened the market. Check the status indicator on the homepage.' },
          ].map(item => (
            <div key={item.text} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.6 }}>{item.icon}</span>
              <span style={{ color: '#9CA3AF', fontSize: '0.88rem', lineHeight: 1.65 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <Link href="/" style={{
            background: 'linear-gradient(135deg, #2E7D32, #4CAF50)', color: '#fff',
            padding: '14px 36px', borderRadius: 12, textDecoration: 'none',
            fontWeight: 700, fontSize: '1rem', display: 'inline-block',
            boxShadow: '0 4px 16px rgba(76,175,80,0.25)',
          }}>
            ♻️ Go to Marketplace
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}
