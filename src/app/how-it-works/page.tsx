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
        padding: '64px 24px 56px',
        borderBottom: '1px solid #1E3A2F',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 500, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,175,80,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', borderRadius: 20, padding: '5px 16px', marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4CAF50', display: 'inline-block' }} />
            <span style={{ color: '#4CAF50', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.1em' }}>LIVE LIMIT ORDER BOOK</span>
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#fff', margin: '0 0 14px', letterSpacing: '-0.03em' }}>
            How It Works
          </h1>
          <p style={{ color: '#6B9E7E', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>
            GreenCredits runs a <strong style={{ color: '#4CAF50' }}>live limit order book</strong> — exactly like a stock exchange.<br />
            Orders match automatically. No middleman. Instant.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '52px 24px 80px', width: '100%' }}>

        {/* Carbon Balance */}
        <div style={{ background: '#161B22', border: '1px solid #1E3A2F', borderRadius: 20, padding: '32px', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 26 }}>♻️</span>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#4CAF50', margin: 0 }}>
              What is a Carbon Balance?
            </h2>
          </div>
          <p style={{ color: '#C8E6C9', fontSize: '0.95rem', lineHeight: 1.75, margin: '0 0 16px' }}>
            Every team gets a carbon budget — the amount of emissions they&apos;re allowed for the fest.
            After the event, their actual footprint is measured and compared.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
            <div style={{ background: 'rgba(76,175,80,0.07)', border: '1px solid rgba(76,175,80,0.2)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ color: '#4CAF50', fontWeight: 800, fontSize: '0.95rem', marginBottom: 6 }}>✅ Surplus (Positive)</div>
              <div style={{ color: '#6B9E7E', fontSize: '0.87rem', lineHeight: 1.65 }}>You emitted less than your budget. You have spare credits — sell them and earn money.</div>
            </div>
            <div style={{ background: 'rgba(255,82,82,0.07)', border: '1px solid rgba(255,82,82,0.2)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ color: '#FF5252', fontWeight: 800, fontSize: '0.95rem', marginBottom: 6 }}>❌ Deficit (Negative)</div>
              <div style={{ color: '#9E6B6B', fontSize: '0.87rem', lineHeight: 1.65 }}>You went over budget. Buy credits from surplus teams to offset your footprint.</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ padding: '12px 16px', background: 'rgba(76,175,80,0.05)', border: '1px solid rgba(76,175,80,0.15)', borderRadius: 10, color: '#6B9E7E', fontSize: '0.85rem' }}>
              <strong style={{ color: '#A8D5B5' }}>Carbon Balance = Carbon Limit − Carbon Footprint.</strong> If your footprint is less than your limit, you have a surplus. If more, you have a deficit.
            </div>
            <div style={{ padding: '12px 16px', background: 'rgba(76,175,80,0.05)', border: '1px solid rgba(76,175,80,0.15)', borderRadius: 10, color: '#6B9E7E', fontSize: '0.85rem' }}>
              <strong style={{ color: '#A8D5B5' }}>Final Tradeable Balance = Original Allocation − Penalty.</strong> The admin sets your allocation and any penalty. Your final balance is used for all trading.
            </div>
          </div>
        </div>

        {/* Trading Schedule */}
        <div style={{ background: 'linear-gradient(135deg, #0D2818 0%, #1A0A2E 100%)', border: '1px solid rgba(255,183,77,0.25)', borderRadius: 20, padding: '32px', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 26 }}>🕐</span>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#FFB74D', margin: 0 }}>
              Trading Schedule
            </h2>
          </div>
          <p style={{ color: '#D4A847', fontSize: '0.95rem', lineHeight: 1.75, margin: '0 0 16px' }}>
            Trading opens in <strong style={{ color: '#FFD54F' }}>3 slots</strong> announced by the faculty. Each slot is <strong style={{ color: '#FFD54F' }}>15 minutes</strong> long. Outside these windows the market is closed.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Slot 1', 'Slot 2', 'Slot 3'].map((slot, idx) => (
              <div key={slot} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,183,77,0.05)', border: '1px solid rgba(255,183,77,0.12)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,183,77,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#FFB74D', flexShrink: 0 }}>{idx + 1}</div>
                <div>
                  <div style={{ color: '#FFD54F', fontWeight: 700, fontSize: '0.9rem' }}>{slot}</div>
                  <div style={{ color: '#9CA3AF', fontSize: '0.82rem', marginTop: 1 }}>Time announced by faculty — 15 minutes long</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, color: '#6B7280', fontSize: '0.83rem' }}>
            <strong style={{ color: '#A8D5B5' }}>Tip:</strong> Check the homepage status indicator — it shows live whether the market is open or closed.
          </div>
        </div>

        {/* Trading Flow */}
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#fff', margin: '0 0 20px', textAlign: 'center', letterSpacing: '-0.02em' }}>
          The Trading Flow
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40 }}>
          {[
            {
              num: '01', emoji: '🔐', title: 'Log In', color: '#6B9E7E',
              desc: 'Use the username (e.g. stall01) and password assigned to your team by the admin. Your carbon balance is pre-set — no sign-up needed.',
            },
            {
              num: '02', emoji: '📊', title: 'Check the Order Book', color: '#4CAF50',
              desc: 'The marketplace shows all live sell orders and live buy bids in real time. Sell orders show cheapest first; buy bids show highest first.',
            },
            {
              num: '03', emoji: '📈', title: 'Place Your Order', color: '#CE93D8',
              desc: 'Deficit team? Go to Buy Credits — enter quantity and the maximum price per credit you\'re willing to pay. Surplus team? Go to Sell Credits — enter quantity and minimum price you\'ll accept. Credits are immediately locked (escrowed) when you place a sell order.',
            },
            {
              num: '04', emoji: '⚡', title: 'Instant Matching', color: '#FFB74D',
              desc: 'The system immediately checks for matches and executes them automatically. See the Matching Logic section below for exactly how this works.',
            },
            {
              num: '05', emoji: '♻️', title: 'Balances Update', color: '#4CAF50',
              desc: 'When a trade executes, the buyer\'s carbon balance increases and the seller\'s decreases. If a buyer\'s balance reaches 0 or above after a fill, their remaining open buy orders are automatically cancelled.',
            },
            {
              num: '06', emoji: '📋', title: 'Track in My Orders', color: '#6B9E7E',
              desc: 'Visit My Orders to see all open bids, live listings, and completed trades. You can cancel any open or partial order — unfilled sell credits are refunded instantly. Partially filled cancelled orders show as "Partially Cancelled".',
            },
          ].map((step) => {
            const rgb = step.color === '#4CAF50' ? '76,175,80' : step.color === '#CE93D8' ? '206,147,216' : step.color === '#FFB74D' ? '255,183,77' : '107,158,126'
            return (
              <div key={step.num} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0, marginTop: 2,
                  background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.25)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, fontSize: '0.72rem', color: step.color,
                }}>
                  {step.num}
                </div>
                <div style={{ flex: 1, background: '#161B22', border: '1px solid #1E2A1F', borderRadius: 14, padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{step.emoji}</span>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{step.title}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', lineHeight: 1.7, margin: 0, color: '#9CA3AF' }}>{step.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Matching Logic */}
        <div style={{ background: '#161B22', border: '1px solid #2A1A3E', borderRadius: 20, padding: '32px', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 26 }}>⚡</span>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#CE93D8', margin: 0 }}>
              Matching Logic
            </h2>
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 24px' }}>
            The system uses <strong style={{ color: '#CE93D8' }}>different priority rules</strong> depending on whether you are selling or buying.
          </p>

          {/* Two-column cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>

            {/* Sell side */}
            <div style={{ background: 'rgba(76,175,80,0.05)', border: '1px solid rgba(76,175,80,0.2)', borderRadius: 16, padding: '22px' }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: '#4CAF50', fontSize: '1rem', marginBottom: 10 }}>
                📈 You Place a Sell Order
              </div>
              <div style={{ color: '#9CA3AF', fontSize: '0.87rem', lineHeight: 1.7, marginBottom: 14 }}>
                System scans all open buy bids <strong style={{ color: '#C8E6C9' }}>priced at or above your ask</strong>.<br />
                Among those, it fills the <strong style={{ color: '#4CAF50' }}>earliest placed bid first</strong> — regardless of how high they bid.
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '14px 16px', fontSize: '0.82rem', fontFamily: 'IBM Plex Mono, monospace' }}>
                <div style={{ color: '#6B7280', marginBottom: 8, fontSize: '0.72rem', letterSpacing: '0.06em' }}>EXAMPLE</div>
                <div style={{ color: '#9CA3AF', marginBottom: 4 }}>stall01: buy 50 @ ₹25 · <span style={{ color: '#FFB74D' }}>1:00pm</span></div>
                <div style={{ color: '#9CA3AF', marginBottom: 10 }}>stall02: buy 50 @ ₹35 · <span style={{ color: '#FFB74D' }}>1:03pm</span></div>
                <div style={{ color: '#9CA3AF', marginBottom: 10 }}>stall03: <strong style={{ color: '#4CAF50' }}>sells 50 @ ₹25</strong> · 1:04pm</div>
                <div style={{ borderTop: '1px solid #1E2A1F', paddingTop: 8, color: '#4CAF50', fontWeight: 700 }}>
                  → stall01 gets it (waited longest)
                </div>
                <div style={{ color: '#6B7280', fontSize: '0.75rem', marginTop: 4 }}>Trade at ₹25. stall02 still waiting.</div>
              </div>
            </div>

            {/* Buy side */}
            <div style={{ background: 'rgba(206,147,216,0.05)', border: '1px solid rgba(206,147,216,0.2)', borderRadius: 16, padding: '22px' }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: '#CE93D8', fontSize: '1rem', marginBottom: 10 }}>
                🛒 You Place a Buy Order
              </div>
              <div style={{ color: '#9CA3AF', fontSize: '0.87rem', lineHeight: 1.7, marginBottom: 14 }}>
                System scans all live sell orders <strong style={{ color: '#E1BEE7' }}>priced at or below your max</strong>.<br />
                Among those, it fills the <strong style={{ color: '#CE93D8' }}>cheapest available sell first</strong> — you always pay the seller&apos;s ask, not your max.
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '14px 16px', fontSize: '0.82rem', fontFamily: 'IBM Plex Mono, monospace' }}>
                <div style={{ color: '#6B7280', marginBottom: 8, fontSize: '0.72rem', letterSpacing: '0.06em' }}>EXAMPLE</div>
                <div style={{ color: '#9CA3AF', marginBottom: 4 }}>stall01: sell 50 @ <span style={{ color: '#FF5252' }}>₹25</span> · 1:00pm</div>
                <div style={{ color: '#9CA3AF', marginBottom: 10 }}>stall02: sell 50 @ <span style={{ color: '#4CAF50' }}>₹20</span> · 1:03pm</div>
                <div style={{ color: '#9CA3AF', marginBottom: 10 }}>stall03: <strong style={{ color: '#CE93D8' }}>buys 50, max ₹30</strong> · 1:04pm</div>
                <div style={{ borderTop: '1px solid #1E2A1F', paddingTop: 8, color: '#CE93D8', fontWeight: 700 }}>
                  → stall02 gets matched (cheapest)
                </div>
                <div style={{ color: '#6B7280', fontSize: '0.75rem', marginTop: 4 }}>Trade at ₹20. Buyer saves money.</div>
              </div>
            </div>
          </div>

          {/* Extra matching notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: '⏳', label: 'No match right now?', desc: 'Your order stays live. It fills automatically the moment a matching order appears — even if you\'ve closed the tab.' },
              { icon: '🔀', label: 'Partial fill', desc: 'If only some of your quantity matches, the filled portion executes immediately. The rest stays open as a partial order.' },
              { icon: '💰', label: 'Trade price', desc: 'The trade always executes at the seller\'s ask price — not the buyer\'s max. The buyer pays the listed price, never more.' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', border: '1px solid #1E2A2E', borderRadius: 10, padding: '12px 16px' }}>
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.87rem', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ color: '#6B7280', fontSize: '0.84rem', lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buyer vs Seller quick guide */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
          <div style={{ background: '#161B22', border: '1px solid #2A1A3E', borderRadius: 18, padding: '26px' }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>😅</div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: '#CE93D8', fontSize: '1.1rem', marginBottom: 12 }}>In Deficit? (Buyer)</h3>
            <ol style={{ color: '#9CA3AF', fontSize: '0.87rem', lineHeight: 1.9, paddingLeft: 18, margin: '0 0 16px' }}>
              <li>Go to <strong style={{ color: '#CE93D8' }}>Buy Credits</strong></li>
              <li>Enter quantity needed</li>
              <li>Enter max price you&apos;ll pay per credit</li>
              <li>Submit — instant match if sellers exist</li>
              <li>Track status in <strong style={{ color: '#CE93D8' }}>My Orders</strong></li>
            </ol>
            <Link href="/buy" style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg, #4A148C, #7B1FA2)', color: '#fff', padding: '11px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
              📈 Buy Credits →
            </Link>
          </div>

          <div style={{ background: '#161B22', border: '1px solid #1E3A2F', borderRadius: 18, padding: '26px' }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>😎</div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: '#4CAF50', fontSize: '1.1rem', marginBottom: 12 }}>In Surplus? (Seller)</h3>
            <ol style={{ color: '#9CA3AF', fontSize: '0.87rem', lineHeight: 1.9, paddingLeft: 18, margin: '0 0 16px' }}>
              <li>Go to <strong style={{ color: '#4CAF50' }}>Sell Credits</strong></li>
              <li>Enter quantity to sell</li>
              <li>Enter minimum ask price per credit</li>
              <li>Submit — instant match if buyers exist</li>
              <li>Track in <strong style={{ color: '#4CAF50' }}>My Orders → My Sales</strong></li>
            </ol>
            <Link href="/sell" style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg, #2E7D32, #4CAF50)', color: '#fff', padding: '11px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
              ♻️ Sell Credits →
            </Link>
          </div>
        </div>

        {/* Offline Settlement */}
        <div style={{ background: '#1A1200', border: '1px solid rgba(255,183,77,0.25)', borderRadius: 20, padding: '32px', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 26 }}>💸</span>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#FFB74D', margin: 0 }}>
              Offline Settlement
            </h2>
          </div>
          <p style={{ color: '#D4A847', fontSize: '0.95rem', lineHeight: 1.75, margin: '0 0 16px' }}>
            The platform records every trade — but <strong style={{ color: '#FFD54F' }}>actual payment happens offline, in person</strong>, after all trading rounds are done.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: '📋', text: 'After trading closes, visit My Orders to see your full settlement summary.' },
              { icon: '💰', text: 'Buyers: You owe each seller the total shown for credits purchased from them. Pay them directly.' },
              { icon: '🤝', text: 'Sellers: You are owed by each buyer who matched with your listings. Collect from them in person.' },
              { icon: '✅', text: 'The platform shows exactly who owes who and how much — use it as your receipt.' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(255,183,77,0.04)', border: '1px solid rgba(255,183,77,0.1)', borderRadius: 10, padding: '12px 14px' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                <span style={{ color: '#9CA3AF', fontSize: '0.88rem', lineHeight: 1.65 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Rules */}
        <div style={{ background: '#161B22', border: '1px solid #1E3A2F', borderRadius: 20, padding: '28px 32px', marginBottom: 40 }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: '#fff', marginBottom: 16, fontSize: '1.15rem' }}>
            📌 Key Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: '🔐', text: 'Log in with your assigned username (e.g. stall01) and password. Your account was pre-created by the admin — no sign-up.' },
              { icon: '⚖️', text: 'You can only sell as many credits as your current final balance. Credits are locked (escrowed) the moment you list them — no double-selling.' },
              { icon: '🤖', text: 'Matching is fully automatic. No manual confirmation needed.' },
              { icon: '❌', text: 'You can cancel any open or partial order from My Orders. Unfilled credits are refunded instantly. Partially filled orders show as "Partially Cancelled".' },
              { icon: '📉', text: 'Once your deficit reaches zero (balance ≥ 0), remaining open buy orders are automatically cancelled.' },
              { icon: '🕐', text: 'Trading only works when the admin has opened the market. Check the status indicator on the homepage.' },
              { icon: '📊', text: 'Your final balance = Original Allocation − Penalty, both set by the admin. You cannot modify your own balance.' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.6 }}>{item.icon}</span>
                <span style={{ color: '#9CA3AF', fontSize: '0.88rem', lineHeight: 1.65 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <Link href="/" style={{
            background: 'linear-gradient(135deg, #2E7D32, #4CAF50)', color: '#fff',
            padding: '14px 40px', borderRadius: 14, textDecoration: 'none',
            fontWeight: 700, fontSize: '1rem', display: 'inline-block',
            boxShadow: '0 4px 20px rgba(76,175,80,0.3)', letterSpacing: '0.02em',
          }}>
            ♻️ Go to Marketplace
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .hiw-match-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <Footer />
    </div>
  )
}
