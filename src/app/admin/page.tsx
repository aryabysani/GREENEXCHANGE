'use client'

import { useState } from 'react'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'GreenAdmin@2025'
const ADMIN_SECRET = 'GreenAdmin@2025'

type Profile = {
  id: string
  username: string
  team_username: string
  carbon_balance: number
  is_banned: boolean
}

type Listing = {
  id: string
  credits_amount: number
  price_per_credit: number
  total_price: number
  status: string
  created_at: string
  profiles: { team_username: string } | null
}

type Transaction = {
  id: string
  credits_amount: number
  price_per_credit: number
  total_price: number | null
  created_at: string
  seller_username: string
  buyer_username: string
  reversed: boolean
}

type TeamTransaction = {
  id: string
  credits_amount: number
  price_per_credit: number
  total_price: number | null
  created_at: string
  seller_username: string
  buyer_username: string
  role: 'seller' | 'buyer'
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [tab, setTab] = useState<'profiles' | 'listings' | 'transactions'>('profiles')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [tradingActive, setTradingActive] = useState(false)
  const [tradingLoading, setTradingLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [editingBalance, setEditingBalance] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<{ id: string; team_username: string } | null>(null)
  const [teamTxns, setTeamTxns] = useState<TeamTransaction[]>([])
  const [teamTxnsLoading, setTeamTxnsLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setAuthed(true)
      loadData('profiles')
      call('get-trading-status').then(d => setTradingActive(d.active === true))
    } else {
      setLoginError('Wrong credentials. Nice try though. 😐')
    }
  }

  const handleToggleTrading = async () => {
    setTradingLoading(true)
    const { active, error } = await call('toggle-trading')
    if (error) { setMsg(`❌ ${error}`); } else { setTradingActive(active); setMsg(`✅ Trading is now ${active ? 'OPEN' : 'PAUSED'}`) }
    setTradingLoading(false)
  }

  const call = async (action: string, id?: string, value?: number) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: ADMIN_SECRET, action, id, value }),
    })
    return res.json()
  }

  const loadData = async (type: 'profiles' | 'listings' | 'transactions') => {
    setDataLoading(true)
    setMsg('')
    const { data } = await call(`get-${type}`)
    if (type === 'profiles') setProfiles(data ?? [])
    else if (type === 'listings') setListings(data ?? [])
    else setTransactions(data ?? [])
    setDataLoading(false)
  }

  const handleAction = async (action: string, id: string, label: string) => {
    if (!confirm(`${label}?`)) return
    setActionLoading(id + action)
    setMsg('')
    const { success, error } = await call(action, id)
    if (success) {
      setMsg(`✅ Done: ${label}`)
      loadData(tab)
    } else {
      setMsg(`❌ Error: ${error}`)
    }
    setActionLoading(null)
  }

  const handleExportTransactions = async () => {
    setExportLoading(true)
    const { data } = await call('get-transactions')
    const rows: Transaction[] = data ?? []

    const headers = ['#', 'Date & Time', 'Seller', 'Buyer', 'Credits', 'Price/Credit (₹)', 'Total (₹)']
    const csvRows = [
      headers.join(','),
      ...rows.map((t, i) => [
        rows.length - i,
        new Date(t.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        t.seller_username,
        t.buyer_username,
        t.credits_amount,
        Number(t.price_per_credit).toFixed(0),
        t.total_price != null ? Number(t.total_price).toFixed(0) : '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ]

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `greencredits-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExportLoading(false)
  }

  const saveBalance = async (id: string) => {
    const val = parseInt(editingValue, 10)
    if (isNaN(val) || val < 0) { setMsg('❌ Invalid balance value'); setEditingBalance(null); return }
    setActionLoading(id + 'balance')
    const { success, error } = await call('set-balance', id, val)
    if (success) {
      setMsg(`✅ Balance updated to ${val}`)
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, carbon_balance: val } : p))
    } else {
      setMsg(`❌ ${error}`)
    }
    setEditingBalance(null)
    setActionLoading(null)
  }

  const openTeamTransactions = async (id: string, team_username: string) => {
    setSelectedTeam({ id, team_username })
    setTeamTxns([])
    setTeamTxnsLoading(true)
    const { data } = await call('get-team-transactions', id)
    setTeamTxns(data ?? [])
    setTeamTxnsLoading(false)
  }

  const switchTab = (t: 'profiles' | 'listings' | 'transactions') => {
    setTab(t)
    loadData(t)
  }

  // ── Login screen ──────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #1A3C2B 0%, #2D6A4F 100%)',
        padding: '16px',
      }}>
        <div style={{
          background: '#fff', borderRadius: 20, padding: '40px 36px',
          width: '100%', maxWidth: 400,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🛡️</div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: '#1A3C2B', margin: 0 }}>
              Admin Panel
            </h1>
            <p style={{ color: '#6B7280', margin: '6px 0 0', fontSize: '0.85rem' }}>GreenCredits · Restricted Access</p>
          </div>

          {loginError && (
            <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#C62828', fontSize: '0.87rem' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              style={{ padding: '12px 14px', border: '1.5px solid #C8E6C9', borderRadius: 10, fontSize: '0.95rem', outline: 'none', color: '#1A3C2B' }}
              onFocus={e => (e.target.style.borderColor = '#4CAF50')}
              onBlur={e => (e.target.style.borderColor = '#C8E6C9')}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ padding: '12px 14px', border: '1.5px solid #C8E6C9', borderRadius: 10, fontSize: '0.95rem', outline: 'none', color: '#1A3C2B' }}
              onFocus={e => (e.target.style.borderColor = '#4CAF50')}
              onBlur={e => (e.target.style.borderColor = '#C8E6C9')}
            />
            <button type="submit" style={{
              background: '#1A3C2B', color: '#fff', border: 'none', borderRadius: 10,
              padding: '13px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginTop: 4,
            }}>
              Enter →
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Dashboard ─────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#F0F7F1' }}>
      {/* Header */}
      <div className="admin-header" style={{ background: '#1A3C2B', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🛡️</span>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#fff' }}>
            Green<span style={{ color: '#4CAF50' }}>Credits</span> Admin
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleToggleTrading}
            disabled={tradingLoading}
            style={{
              background: tradingActive ? '#FF5252' : '#4CAF50',
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
            {tradingLoading ? '...' : tradingActive ? 'Pause Trading' : 'Open Trading'}
          </button>
          <button
            onClick={handleExportTransactions}
            disabled={exportLoading}
            style={{ background: 'rgba(255,255,255,0.1)', color: '#A8D5B5', border: '1px solid rgba(168,213,181,0.3)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
          >
            {exportLoading ? '⏳ Exporting...' : '⬇️ Export CSV'}
          </button>
          <button
            onClick={() => setAuthed(false)}
            style={{ background: 'rgba(255,255,255,0.1)', color: '#A8D5B5', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="admin-body" style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        {/* Tabs */}
        <div className="admin-tabs" style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {([
            { key: 'profiles', label: '👥 Teams' },
            { key: 'listings', label: '📋 Listings' },
            { key: 'transactions', label: '🤝 Transactions' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              style={{
                padding: '9px 22px', borderRadius: 20, cursor: 'pointer',
                fontWeight: 700, fontSize: '0.9rem',
                background: tab === key ? '#4CAF50' : '#fff',
                color: tab === key ? '#fff' : '#1A3C2B',
                border: tab === key ? 'none' : '1.5px solid #C8E6C9',
              }}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => loadData(tab)}
            style={{ padding: '9px 16px', borderRadius: 20, border: '1.5px solid #C8E6C9', background: '#fff', cursor: 'pointer', fontSize: '0.85rem', color: '#6B7280' }}
          >
            🔄 Refresh
          </button>
        </div>

        {msg && (
          <div style={{ background: msg.startsWith('✅') ? '#E8F5E9' : '#FFEBEE', border: `1px solid ${msg.startsWith('✅') ? '#C8E6C9' : '#FFCDD2'}`, borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: '0.9rem', color: msg.startsWith('✅') ? '#2D6A4F' : '#C62828' }}>
            {msg}
          </div>
        )}

        {dataLoading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>♻️</div>
            Loading...
          </div>
        ) : tab === 'profiles' ? (
          // ── Profiles table ──
          <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8F5E9', fontWeight: 700, color: '#1A3C2B' }}>
              {profiles.length} Teams
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' }}>
                <thead>
                  <tr style={{ background: '#F0F7F1' }}>
                    {['Username', 'Team Username', 'Balance', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#6B7280', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p, i) => (
                    <tr key={p.id} style={{ borderTop: '1px solid #E8F5E9', background: p.is_banned ? '#FFF3F3' : i % 2 === 0 ? '#fff' : '#FAFFFE' }}>
                      <td style={{ padding: '12px 16px', color: '#6B7280', fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.username}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1A3C2B' }}>{p.team_username}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {editingBalance === p.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input
                              type="number"
                              min={0}
                              value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') saveBalance(p.id); if (e.key === 'Escape') setEditingBalance(null) }}
                              autoFocus
                              style={{ width: 72, padding: '3px 7px', borderRadius: 6, border: '1.5px solid #4CAF50', fontSize: '0.85rem', fontWeight: 700, color: '#1A3C2B', outline: 'none' }}
                            />
                            <button onClick={() => saveBalance(p.id)} disabled={actionLoading === p.id + 'balance'} style={{ background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>✓</button>
                            <button onClick={() => setEditingBalance(null)} style={{ background: '#F5F5F5', color: '#9E9E9E', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                          </div>
                        ) : (
                          <span
                            onClick={() => { setEditingBalance(p.id); setEditingValue(String(p.carbon_balance ?? 0)) }}
                            title="Click to edit"
                            style={{ background: '#E8F5E9', color: '#2D6A4F', borderRadius: 6, padding: '2px 8px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            ♻️ {p.carbon_balance ?? '—'} <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>✏️</span>
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {p.is_banned
                          ? <span style={{ background: '#FFEBEE', color: '#C62828', borderRadius: 6, padding: '2px 8px', fontWeight: 700, fontSize: '0.78rem' }}>🚫 BANNED</span>
                          : <span style={{ background: '#E8F5E9', color: '#2D6A4F', borderRadius: 6, padding: '2px 8px', fontWeight: 700, fontSize: '0.78rem' }}>✅ ACTIVE</span>
                        }
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => openTeamTransactions(p.id, p.team_username)}
                            style={{ background: '#E3F2FD', color: '#1565C0', border: '1px solid #BBDEFB', borderRadius: 6, padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            📊 Trades
                          </button>
                          <button
                            onClick={() => handleAction('reset-profile', p.id, `Reset ${p.team_username}`)}
                            disabled={actionLoading === p.id + 'reset-profile'}
                            style={{ background: '#FFF3E0', color: '#E65100', border: '1px solid #FFE082', borderRadius: 6, padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            🔄 Reset
                          </button>
                          {p.is_banned ? (
                            <button
                              onClick={() => handleAction('unban', p.id, `Unban ${p.team_username}`)}
                              disabled={actionLoading === p.id + 'unban'}
                              style={{ background: '#E8F5E9', color: '#2D6A4F', border: '1px solid #C8E6C9', borderRadius: 6, padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              ✅ Unban
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction('ban', p.id, `Ban ${p.team_username}`)}
                              disabled={actionLoading === p.id + 'ban'}
                              style={{ background: '#FFEBEE', color: '#C62828', border: '1px solid #FFCDD2', borderRadius: 6, padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              🚫 Ban
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === 'listings' ? (
          // ── Listings table ──
          <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8F5E9', fontWeight: 700, color: '#1A3C2B' }}>
              {listings.length} Listings
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' }}>
                <thead>
                  <tr style={{ background: '#F0F7F1' }}>
                    {['Seller', 'Credits', 'Price/Credit', 'Total', 'Status', 'Action'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#6B7280', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listings.map((l, i) => (
                    <tr key={l.id} style={{ borderTop: '1px solid #E8F5E9', background: i % 2 === 0 ? '#fff' : '#FAFFFE' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1A3C2B' }}>{l.profiles?.team_username ?? '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#1A3C2B' }}>♻️ {l.credits_amount}</td>
                      <td style={{ padding: '12px 16px', color: '#6B7280' }}>₹{Number(l.price_per_credit).toFixed(0)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#4CAF50' }}>₹{Number(l.total_price).toFixed(0)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: l.status === 'live' ? '#E8F5E9' : l.status === 'sold' ? '#FFF3E0' : '#F5F5F5',
                          color: l.status === 'live' ? '#2D6A4F' : l.status === 'sold' ? '#E65100' : '#757575',
                          borderRadius: 6, padding: '2px 8px', fontWeight: 700, fontSize: '0.78rem',
                        }}>
                          {l.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {l.status === 'live' && (
                          <button
                            onClick={() => handleAction('remove-listing', l.id, 'Remove this listing')}
                            disabled={actionLoading === l.id + 'remove-listing'}
                            style={{ background: '#FFEBEE', color: '#C62828', border: '1px solid #FFCDD2', borderRadius: 6, padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            🗑️ Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // ── Transactions table ──
          <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8F5E9', fontWeight: 700, color: '#1A3C2B' }}>
              {transactions.length} Transactions
            </div>
            {transactions.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#9E9E9E' }}>
                No transactions yet. Trades appear here automatically when buy and sell orders match.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' }}>
                  <thead>
                    <tr style={{ background: '#F0F7F1' }}>
                      {['#', 'Seller', 'Buyer', 'Credits Traded', 'Amount (₹)', 'Date & Time', ''].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#6B7280', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => (
                      <tr key={t.id} style={{ borderTop: '1px solid #E8F5E9', background: t.reversed ? '#FFF8F8' : i % 2 === 0 ? '#fff' : '#FAFFFE', opacity: t.reversed ? 0.6 : 1 }}>
                        <td style={{ padding: '12px 16px', color: '#9E9E9E', fontSize: '0.8rem' }}>{transactions.length - i}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#C62828', fontFamily: 'monospace', textDecoration: t.reversed ? 'line-through' : 'none' }}>
                          {t.seller_username}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#2D6A4F', fontFamily: 'monospace', textDecoration: t.reversed ? 'line-through' : 'none' }}>
                          {t.buyer_username}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: '#E8F5E9', color: '#2D6A4F', borderRadius: 6, padding: '2px 10px', fontWeight: 700, textDecoration: t.reversed ? 'line-through' : 'none' }}>
                            ♻️ {t.credits_amount} credits
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#4CAF50', textDecoration: t.reversed ? 'line-through' : 'none' }}>
                          {t.total_price != null ? `₹${Number(t.total_price).toFixed(0)}` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '0.82rem' }}>
                          {new Date(t.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {t.reversed ? (
                            <span style={{ background: '#FFEBEE', color: '#C62828', borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}>REVERSED</span>
                          ) : (
                            <button
                              onClick={() => handleAction('reverse-transaction', t.id, `Reverse transaction #${transactions.length - i}?`)}
                              disabled={actionLoading === t.id + 'reverse-transaction'}
                              style={{ background: '#FFF3E0', color: '#E65100', border: '1px solid #FFE082', borderRadius: 6, padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              ↩️ Reverse
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Team transactions modal */}
      {selectedTeam && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setSelectedTeam(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 720, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#1A3C2B' }}>
                  📊 {selectedTeam.team_username}
                </div>
                <div style={{ color: '#6B7280', fontSize: '0.8rem', marginTop: 2 }}>
                  {teamTxnsLoading ? 'Loading...' : `${teamTxns.length} transaction${teamTxns.length !== 1 ? 's' : ''}`}
                </div>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                style={{ background: '#F5F5F5', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, color: '#6B7280', fontSize: '0.9rem' }}
              >
                ✕ Close
              </button>
            </div>

            {/* Modal body */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {teamTxnsLoading ? (
                <div style={{ padding: 48, textAlign: 'center', color: '#9E9E9E' }}>Loading trades...</div>
              ) : teamTxns.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: '#9E9E9E' }}>No transactions found for this team.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#F0F7F1', position: 'sticky', top: 0 }}>
                      {['Role', 'Counterparty', 'Credits', 'Price/Credit', 'Total', 'Time'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#6B7280', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teamTxns.map((t, i) => (
                      <tr key={t.id} style={{ borderTop: '1px solid #E8F5E9', background: i % 2 === 0 ? '#fff' : '#FAFFFE' }}>
                        <td style={{ padding: '11px 16px' }}>
                          <span style={{
                            background: t.role === 'seller' ? '#E8F5E9' : '#EDE7F6',
                            color: t.role === 'seller' ? '#2D6A4F' : '#4527A0',
                            borderRadius: 6, padding: '2px 8px', fontWeight: 700, fontSize: '0.75rem',
                          }}>
                            {t.role === 'seller' ? '▲ SOLD' : '▼ BOUGHT'}
                          </span>
                        </td>
                        <td style={{ padding: '11px 16px', fontWeight: 600, color: '#1A3C2B' }}>
                          {t.role === 'seller' ? t.buyer_username : t.seller_username}
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          <span style={{ background: '#E8F5E9', color: '#2D6A4F', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>
                            ♻️ {t.credits_amount}
                          </span>
                        </td>
                        <td style={{ padding: '11px 16px', color: '#6B7280' }}>₹{Number(t.price_per_credit).toFixed(0)}</td>
                        <td style={{ padding: '11px 16px', fontWeight: 700, color: '#4CAF50' }}>
                          {t.total_price != null ? `₹${Number(t.total_price).toFixed(0)}` : '—'}
                        </td>
                        <td style={{ padding: '11px 16px', color: '#9E9E9E', fontSize: '0.8rem' }}>
                          {new Date(t.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .admin-header { padding: 12px 16px !important; }
          .admin-header span[style] { font-size: 1.05rem !important; }
          .admin-body { padding: 16px !important; }
          .admin-tabs { gap: 6px !important; }
          .admin-tabs button { padding: 7px 12px !important; font-size: 0.82rem !important; }
          .admin-table th, .admin-table td { padding: 8px 10px !important; font-size: 0.78rem !important; }
          .admin-action-btn { padding: 3px 7px !important; font-size: 0.72rem !important; }
        }
      `}</style>
    </div>
  )
}
