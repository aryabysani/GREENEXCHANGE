'use client'

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'GreenAdmin@2025'
const ADMIN_SECRET = 'GreenAdmin@2025'

type Profile = {
  id: string
  username: string
  team_username: string
  carbon_balance: number | null
  penalty: number | null
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

type EmissionRecord = {
  id: string
  stall_no: string
  product: string
  quantity: number
  emission_per_unit: number
  total_emission: number
  status: 'pending' | 'approved'
  is_submitted: boolean
  is_verified: boolean
  is_custom: boolean
  updated_at: string
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [tab, setTab] = useState<'profiles' | 'listings' | 'transactions' | 'emissions'>('profiles')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [tradingActive, setTradingActive] = useState(false)
  const [tradingLoading, setTradingLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [editingField, setEditingField] = useState<{ id: string; field: 'carbon_balance' | 'penalty' } | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<{ id: string; team_username: string } | null>(null)
  const [teamTxns, setTeamTxns] = useState<TeamTransaction[]>([])
  const [teamTxnsLoading, setTeamTxnsLoading] = useState(false)

  // ── Emissions state ─────────────────────────────────────
  const [emissionsData, setEmissionsData] = useState<EmissionRecord[]>([])
  const [emissionsLoading, setEmissionsLoading] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)
  const [emissionsMsg, setEmissionsMsg] = useState('')
  const [emEditId, setEmEditId] = useState<string | null>(null)   // row being inline-edited
  const [emEditVals, setEmEditVals] = useState<{ product: string; emission_per_unit: string; quantity: string }>({ product: '', emission_per_unit: '', quantity: '' })
  const [emActionLoading, setEmActionLoading] = useState<string | null>(null)
  const [newStall, setNewStall] = useState('')
  const [newProduct, setNewProduct] = useState('')
  const [newEPU, setNewEPU] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const loadEmissions = async () => {
    setEmissionsLoading(true)
    const { data, error } = await supabase
      .from('emissions_data')
      .select('*')
      .order('stall_no', { ascending: true })
    if (error) {
      setEmissionsMsg('❌ Failed to load: ' + error.message)
    } else {
      setEmissionsData((data ?? []).map((r: any) => ({
        id: r.id,
        stall_no: r.stall_no,
        product: r.product,
        quantity: Number(r.quantity),
        emission_per_unit: Number(r.emission_per_unit),
        total_emission: Number(r.total_emission),
        status: (r.status ?? 'pending') as 'pending' | 'approved',
        is_submitted: !!r.is_submitted,
        is_verified: !!r.is_verified,
      })))
    }
    setEmissionsLoading(false)
  }

  // Approve a single row
  const approveEmission = async (id: string) => {
    setEmActionLoading(id + '-approve')
    const { error } = await supabase
      .from('emissions_data')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      setEmissionsMsg('❌ Approve failed: ' + error.message)
    } else {
      setEmissionsData((prev) => prev.map((r) => r.id === id ? { ...r, status: 'approved' } : r))
      setEmissionsMsg('✅ Row approved.')
      setTimeout(() => setEmissionsMsg(''), 2500)
    }
    setEmActionLoading(null)
  }

  // Reset a row back to pending
  const resetEmission = async (id: string) => {
    setEmActionLoading(id + '-reset')
    const { error } = await supabase
      .from('emissions_data')
      .update({ status: 'pending', is_submitted: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      setEmissionsMsg('❌ Reset failed: ' + error.message)
    } else {
      setEmissionsData((prev: EmissionRecord[]) => prev.map((r: EmissionRecord) => r.id === id ? { ...r, status: 'pending', is_submitted: false } : r))
      setEmissionsMsg('✅ Row reset.')
      setTimeout(() => setEmissionsMsg(''), 2500)
    }
    setEmActionLoading(null)
  }

  // Initial value entry BEFORE event
  const addInitialEmission = async (e: FormEvent) => {
    e.preventDefault()
    if (!newStall || !newProduct || !newEPU) return
    setEmActionLoading('add-new')
    const { error } = await supabase.from('emissions_data').insert({
      stall_no: newStall.trim(),
      product: newProduct.trim(),
      emission_per_unit: parseFloat(newEPU) || 0,
      quantity: 0,
      total_emission: 0,
      is_submitted: false,
      is_custom: false
    })
    if (error) {
      setEmissionsMsg('❌ Add failed: ' + error.message)
    } else {
      setNewStall(''); setNewProduct(''); setNewEPU('')
      loadEmissions()
      setEmissionsMsg('✅ Initial product added.')
    }
    setEmActionLoading(null)
  }

  // Lightweight verification
  const markVerified = async (id: string, state: boolean) => {
    setEmActionLoading(id + '-verify')
    const { error } = await supabase
      .from('emissions_data')
      .update({ is_verified: state, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      setEmissionsMsg('❌ Verify failed: ' + error.message)
    } else {
      setEmissionsData((prev: EmissionRecord[]) => prev.map((r: EmissionRecord) => r.id === id ? { ...r, is_verified: state } : r))
    }
    setEmActionLoading(null)
  }

  // Export audit CSV
  const downloadAuditCsv = () => {
    const submittedOnly = emissionsData.filter(r => r.is_submitted)
    if (submittedOnly.length === 0) {
      setEmissionsMsg('ℹ️ No submitted emissions to export.')
      return
    }
    downloadCsv([
      ['StallNo', 'Product', 'InitialEmission', 'FinalEmission', 'Quantity', 'EmissionPerUnit'],
      ...submittedOnly.map(r => [
        r.stall_no, r.product, '0', String(r.total_emission), String(r.quantity), String(r.emission_per_unit)
      ])
    ], 'emissions-audit')
  }

  // Admin inline save (product + emission_per_unit + quantity)
  const saveEmissionRow = async (id: string) => {
    setEmActionLoading(id + '-save')
    const qty = parseFloat(emEditVals.quantity) || 0
    const epu = parseFloat(emEditVals.emission_per_unit) || 0
    const total = qty * epu
    const { error } = await supabase
      .from('emissions_data')
      .update({
        product: emEditVals.product.trim(),
        emission_per_unit: epu,
        quantity: qty,
        total_emission: total,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) {
      setEmissionsMsg('❌ Save failed: ' + error.message)
    } else {
      setEmissionsData((prev) => prev.map((r) =>
        r.id === id
          ? { ...r, product: emEditVals.product.trim(), emission_per_unit: epu, quantity: qty, total_emission: total, status: 'pending' }
          : r
      ))
      setEmEditId(null)
      setEmissionsMsg('✅ Row updated (status reset to pending).')
      setTimeout(() => setEmissionsMsg(''), 3000)
    }
    setEmActionLoading(null)
  }

  // Delete an emission row
  const deleteEmissionRow = async (id: string) => {
    setEmActionLoading(id + '-delete')
    const { error } = await supabase.from('emissions_data').delete().eq('id', id)
    if (error) {
      setEmissionsMsg('❌ Delete failed: ' + error.message)
    } else {
      setEmissionsData((prev) => prev.filter((r) => r.id !== id))
    }
    setEmActionLoading(null)
  }

  // Auto-load emissions when the tab is first opened
  useEffect(() => {
    if (tab === 'emissions' && emissionsData.length === 0 && !emissionsLoading) {
      loadEmissions()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const handleCsvUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvLoading(true)
    setEmissionsMsg('')

    const text = await file.text()
    const lines = text.trim().split(/\r?\n/)
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))

    const stallIdx         = headers.findIndex((h) => /stallno/i.test(h.replace(/\s/g, '')))
    const productIdx       = headers.findIndex((h) => /product/i.test(h))
    const emissionPerIdx   = headers.findIndex((h) => /emissionperunit/i.test(h.replace(/\s/g, '')))

    if (stallIdx === -1 || productIdx === -1 || emissionPerIdx === -1) {
      setEmissionsMsg('❌ CSV must have columns: StallNo, Product, EmissionPerUnit')
      setCsvLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const rows = lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
      return {
        stall_no:          cols[stallIdx]       ?? '',
        product:           cols[productIdx]     ?? '',
        emission_per_unit: parseFloat(cols[emissionPerIdx] ?? '0') || 0,
        quantity:          0,
        is_custom:         false,
        updated_at:        new Date().toISOString(),
      }
    }).filter((r) => r.stall_no && r.product)

    if (rows.length === 0) {
      setEmissionsMsg('❌ No valid rows found in CSV.')
      setCsvLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const { error } = await supabase.from('emissions_data').insert(rows)
    if (error) {
      setEmissionsMsg('❌ Upload failed: ' + error.message)
    } else {
      setEmissionsMsg(`✅ Uploaded ${rows.length} row(s) successfully.`)
      await loadEmissions()
    }
    setCsvLoading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleLogin = (e: FormEvent) => {
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

  const downloadCsv = (rows: string[][], filename: string) => {
    const blob = new Blob([rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExport = async (type: 'transactions' | 'profiles' | 'listings') => {
    setExportLoading(true)
    setShowExportMenu(false)
    const { data } = await call(`get-${type}`)

    if (type === 'transactions') {
      const rows: Transaction[] = data ?? []
      downloadCsv([
        ['#', 'Date & Time', 'Seller', 'Buyer', 'Credits', 'Price/Credit (₹)', 'Total (₹)', 'Reversed'],
        ...rows.map((t, i) => [
          String(rows.length - i),
          new Date(t.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          t.seller_username, t.buyer_username,
          String(t.credits_amount), Number(t.price_per_credit).toFixed(0),
          t.total_price != null ? Number(t.total_price).toFixed(0) : '',
          t.reversed ? 'Yes' : 'No',
        ]),
      ], 'greencredits-transactions')
    } else if (type === 'profiles') {
      const rows: Profile[] = data ?? []
      const { data: txData } = await call('get-transactions')
      const txns: Transaction[] = (txData ?? []).filter((t: Transaction) => !t.reversed)
      // build per-team stats keyed by team_username
      const stats: Record<string, { sells: number; buys: number; creditsSold: number; creditsBought: number }> = {}
      for (const p of rows) stats[p.team_username] = { sells: 0, buys: 0, creditsSold: 0, creditsBought: 0 }
      for (const t of txns) {
        if (stats[t.seller_username]) { stats[t.seller_username].sells++; stats[t.seller_username].creditsSold += t.credits_amount }
        if (stats[t.buyer_username]) { stats[t.buyer_username].buys++; stats[t.buyer_username].creditsBought += t.credits_amount }
      }
      downloadCsv([
        ['Team Username', 'Login Username', 'Final Balance', 'Penalty', 'Status', '# Sells', 'Credits Sold', '# Buys', 'Credits Bought'],
        ...rows.map(p => {
          const s = stats[p.team_username] ?? { sells: 0, buys: 0, creditsSold: 0, creditsBought: 0 }
          return [p.team_username, p.username, String(p.carbon_balance ?? ''), String(p.penalty ?? 0), p.is_banned ? 'Banned' : 'Active', String(s.sells), String(s.creditsSold), String(s.buys), String(s.creditsBought)]
        }),
      ], 'greencredits-teams')
    } else if (type === 'listings') {
      const rows: Listing[] = data ?? []
      downloadCsv([
        ['Seller', 'Credits', 'Price/Credit (₹)', 'Total (₹)', 'Status', 'Date'],
        ...rows.map(l => [
          l.profiles?.team_username ?? '—', String(l.credits_amount),
          Number(l.price_per_credit).toFixed(0), Number(l.total_price).toFixed(0),
          l.status, new Date(l.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        ]),
      ], 'greencredits-listings')
    }

    setExportLoading(false)
  }

  const saveField = async (id: string, field: 'carbon_balance' | 'penalty') => {
    const val = parseInt(editingValue, 10)
    if (isNaN(val)) { setMsg('❌ Invalid value'); setEditingField(null); return }
    if (field === 'penalty' && val < 0) { setMsg('❌ Penalty cannot be negative'); setEditingField(null); return }
    setActionLoading(id + field)
    const action = field === 'carbon_balance' ? 'set-balance' : 'set-penalty'
    const { success, error, carbon_balance } = await call(action, id, val)
    if (success) {
      setMsg(`✅ ${field === 'carbon_balance' ? 'Final balance' : 'Penalty'} updated to ${val}`)
      setProfiles(prev => prev.map(p => {
        if (p.id !== id) return p
        if (field === 'carbon_balance') return { ...p, carbon_balance: val }
        return { ...p, penalty: val, carbon_balance: carbon_balance ?? p.carbon_balance }
      }))
    } else {
      setMsg(`❌ ${error}`)
    }
    setEditingField(null)
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

  const switchTab = (t: 'profiles' | 'listings' | 'transactions' | 'emissions') => {
    setTab(t)
    if (t !== 'emissions') loadData(t as 'profiles' | 'listings' | 'transactions')
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
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportMenu(v => !v)}
              disabled={exportLoading}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#A8D5B5', border: '1px solid rgba(168,213,181,0.3)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
            >
              {exportLoading ? '⏳ Exporting...' : '⬇️ Export CSV ▾'}
            </button>
            {showExportMenu && (
              <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 12, overflow: 'hidden', zIndex: 100, minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                {([
                  { key: 'transactions', label: '🤝 Transactions' },
                  { key: 'profiles', label: '👥 Teams' },
                  { key: 'listings', label: '📋 Listings' },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleExport(key)}
                    style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.88rem', color: '#1A3C2B', fontWeight: 600 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F0F7F1')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
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
            { key: 'emissions', label: '🌿 Emissions' },
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
            onClick={() => tab === 'emissions' ? loadEmissions() : loadData(tab as 'profiles' | 'listings' | 'transactions')}
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
                    {['Username', 'Team Username', 'Final Balance', 'Penalty', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#6B7280', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p, i) => (
                    <tr key={p.id} style={{ borderTop: '1px solid #E8F5E9', background: p.is_banned ? '#FFF3F3' : i % 2 === 0 ? '#fff' : '#FAFFFE' }}>
                      <td style={{ padding: '12px 16px', color: '#6B7280', fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.username}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1A3C2B' }}>{p.team_username}</td>
                      {/* Final Balance (editable) */}
                      <td style={{ padding: '12px 16px' }}>
                        {editingField?.id === p.id && editingField.field === 'carbon_balance' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input
                              type="number" value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') saveField(p.id, 'carbon_balance'); if (e.key === 'Escape') setEditingField(null) }}
                              autoFocus
                              style={{ width: 72, padding: '3px 7px', borderRadius: 6, border: '1.5px solid #4CAF50', fontSize: '0.85rem', fontWeight: 700, color: '#1A3C2B', outline: 'none' }}
                            />
                            <button onClick={() => saveField(p.id, 'carbon_balance')} disabled={actionLoading === p.id + 'carbon_balance'} style={{ background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>✓</button>
                            <button onClick={() => setEditingField(null)} style={{ background: '#F5F5F5', color: '#9E9E9E', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                          </div>
                        ) : (
                          <span
                            onClick={() => { setEditingField({ id: p.id, field: 'carbon_balance' }); setEditingValue(String(p.carbon_balance ?? 0)) }}
                            title="Click to edit"
                            style={{ background: '#E8F5E9', color: '#2D6A4F', borderRadius: 6, padding: '2px 8px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            ♻️ {p.carbon_balance ?? '—'} <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>✏️</span>
                          </span>
                        )}
                      </td>
                      {/* Penalty */}
                      <td style={{ padding: '12px 16px' }}>
                        {editingField?.id === p.id && editingField.field === 'penalty' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input
                              type="number" min={0} value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') saveField(p.id, 'penalty'); if (e.key === 'Escape') setEditingField(null) }}
                              autoFocus
                              style={{ width: 72, padding: '3px 7px', borderRadius: 6, border: '1.5px solid #FF5252', fontSize: '0.85rem', fontWeight: 700, color: '#1A3C2B', outline: 'none' }}
                            />
                            <button onClick={() => saveField(p.id, 'penalty')} disabled={actionLoading === p.id + 'penalty'} style={{ background: '#FF5252', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>✓</button>
                            <button onClick={() => setEditingField(null)} style={{ background: '#F5F5F5', color: '#9E9E9E', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                          </div>
                        ) : (
                          <span
                            onClick={() => { setEditingField({ id: p.id, field: 'penalty' }); setEditingValue(String(p.penalty ?? 0)) }}
                            title="Click to edit"
                            style={{ background: '#FFEBEE', color: '#C62828', borderRadius: 6, padding: '2px 8px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            {p.penalty ?? 0} <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>✏️</span>
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
        ) : tab === 'emissions' ? (
          // ── Emissions Dashboard ──────────────────────────────
          <div>
            {/* Emissions message */}
            {emissionsMsg && (
              <div style={{
                background: emissionsMsg.startsWith('✅') ? '#E8F5E9' : '#FFEBEE',
                border: `1px solid ${emissionsMsg.startsWith('✅') ? '#C8E6C9' : '#FFCDD2'}`,
                borderRadius: 10, padding: '10px 16px', marginBottom: 16,
                fontSize: '0.9rem', color: emissionsMsg.startsWith('✅') ? '#2D6A4F' : '#C62828',
              }}>
                {emissionsMsg}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
              {/* Initial Values Entry (BEFORE event) */}
              <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 16, padding: '20px 24px' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1A3C2B', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  🆕 Add Pre-Event Product
                </div>
                <form onSubmit={addInitialEmission} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input
                      placeholder="Stall No"
                      value={newStall} onChange={e => setNewStall(e.target.value)}
                      style={{ padding: '8px 12px', border: '1.5px solid #E8F5E9', borderRadius: 8, fontSize: '0.85rem' }}
                    />
                    <input
                      placeholder="Product Name"
                      value={newProduct} onChange={e => setNewProduct(e.target.value)}
                      style={{ padding: '8px 12px', border: '1.5px solid #E8F5E9', borderRadius: 8, fontSize: '0.85rem' }}
                    />
                  </div>
                  <input
                    placeholder="Emission Per Unit (kg CO₂e)"
                    type="number" step="any"
                    value={newEPU} onChange={e => setNewEPU(e.target.value)}
                    style={{ padding: '8px 12px', border: '1.5px solid #E8F5E9', borderRadius: 8, fontSize: '0.85rem' }}
                  />
                  <button
                    disabled={emActionLoading === 'add-new'}
                    style={{ background: '#1A3C2B', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {emActionLoading === 'add-new' ? 'Saving...' : '➕ Add Product'}
                  </button>
                </form>
              </div>

              {/* CSV Upload */}
              <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 16, padding: '20px 24px' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1A3C2B', marginBottom: 8 }}>📤 Bulk Upload (CSV)</div>
                <div style={{ fontSize: '0.82rem', color: '#6B7280', marginBottom: 14 }}>Cols: <code>StallNo, Product, EmissionPerUnit</code></div>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCsvUpload} disabled={csvLoading} style={{ display: 'none' }} id="em-csv-input" />
                <label
                  htmlFor="em-csv-input"
                  style={{
                    display: 'block', background: csvLoading ? '#9E9E9E' : '#E8F5E9', color: '#2D6A4F', border: '1.5px solid #C8E6C9',
                    borderRadius: 10, padding: '12px', fontWeight: 700, textAlign: 'center', cursor: csvLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {csvLoading ? '⏳ Uploading…' : '📂 Choose CSV File'}
                </label>
              </div>
            </div>

            {/* Audit Dashboard Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: '#1A3C2B', fontSize: '1.4rem' }}>
                📊 Emissions Audit Dashboard
              </h2>
              <button
                onClick={downloadAuditCsv}
                style={{ background: '#1A3C2B', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
              >
                📥 Download Audit CSV
              </button>
            </div>

            {emissionsLoading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#6B7280' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>
                Loading audit data…
              </div>
            ) : emissionsData.length === 0 ? (
              <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 16, padding: '48px 24px', textAlign: 'center', color: '#9E9E9E' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
                No audit data yet. Add products to begin the monitoring workflow.
              </div>
            ) : (
              (() => {
                const grouped: Record<string, { rows: EmissionRecord[]; finalTotal: number; initialTotal: number; allSubmitted: boolean }> = {}
                for (const r of emissionsData) {
                  if (!grouped[r.stall_no]) grouped[r.stall_no] = { rows: [], finalTotal: 0, initialTotal: 0, allSubmitted: true }
                  grouped[r.stall_no].rows.push(r)
                  if (r.is_submitted) grouped[r.stall_no].finalTotal += r.total_emission
                  if (!r.is_submitted) grouped[r.stall_no].allSubmitted = false
                  grouped[r.stall_no].initialTotal += 0 
                }
                const sortedStalls = Object.entries(grouped).sort((a, b) => b[1].finalTotal - a[1].finalTotal)

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {sortedStalls.map(([stall, { rows: sRows, finalTotal, allSubmitted }]: [string, any]) => (
                      <div key={stall} style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 16, overflow: 'hidden' }}>
                        <div style={{
                          padding: '14px 24px', background: '#F0F7F1', borderBottom: '1px solid #E8F5E9',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1A3C2B' }}>🏪 {stall}</div>
                            {allSubmitted ? (
                              <span style={{ background: '#4CAF50', color: '#fff', borderRadius: 20, padding: '2px 10px', fontWeight: 700, fontSize: '0.72rem' }}>✅ SUBMITTED</span>
                            ) : (
                              <span style={{ background: '#BDBDBD', color: '#fff', borderRadius: 20, padding: '2px 10px', fontWeight: 700, fontSize: '0.72rem' }}>⏳ ACTIVE</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                             <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.72rem', color: '#6B7280', textTransform: 'uppercase' }}>Initial</div>
                              <div style={{ fontWeight: 700, color: '#9E9E9E' }}>0.00</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.72rem', color: '#6B7280', textTransform: 'uppercase' }}>Final</div>
                              <div style={{ fontWeight: 800, color: finalTotal > 0 ? '#C62828' : '#9E9E9E' }}>{finalTotal.toFixed(2)}</div>
                            </div>
                          </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ background: '#FAFFFE' }}>
                                {['Product', 'Emission/Unit', 'Quantity', 'Final (Submitted)', 'Verified', 'Actions'].map((h: string) => (
                                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', color: '#9E9E9E', fontWeight: 600, fontSize: '0.73rem', textTransform: 'uppercase' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sRows.map((row) => (
                                <tr key={row.id} style={{ borderTop: '1px solid #E8F5E9', background: row.is_verified ? '#F1FFF4' : 'transparent' }}>
                                  <td style={{ padding: '10px 20px' }}>
                                    {emEditId === row.id ? (
                                      <input
                                        value={emEditVals.product}
                                        onChange={(e) => setEmEditVals((prev: any) => ({ ...prev, product: e.target.value }))}
                                        style={{ width: '100%', padding: '4px 8px', border: '1px solid #C8E6C9', borderRadius: 6, fontSize: '0.8rem' }}
                                      />
                                    ) : (
                                      <div style={{ fontWeight: 600, color: '#1A3C2B' }}>{row.product}</div>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px 20px', color: '#6B7280' }}>
                                    {emEditId === row.id ? (
                                      <input
                                        type="number" step="any"
                                        value={emEditVals.emission_per_unit}
                                        onChange={(e) => setEmEditVals((prev: any) => ({ ...prev, emission_per_unit: e.target.value }))}
                                        style={{ width: 80, padding: '4px 8px', border: '1px solid #C8E6C9', borderRadius: 6, fontSize: '0.8rem' }}
                                      />
                                    ) : (
                                      row.emission_per_unit.toFixed(4)
                                    )}
                                  </td>
                                  <td style={{ padding: '10px 20px', color: '#1A3C2B' }}>
                                    {emEditId === row.id ? (
                                      <input
                                        type="number" step="any"
                                        value={emEditVals.quantity}
                                        onChange={(e) => setEmEditVals((prev: any) => ({ ...prev, quantity: e.target.value }))}
                                        style={{ width: 80, padding: '4px 8px', border: '1px solid #C8E6C9', borderRadius: 6, fontSize: '0.8rem' }}
                                      />
                                    ) : (
                                      row.quantity
                                    )}
                                  </td>
                                  <td style={{ padding: '10px 20px', fontWeight: 700, color: row.total_emission > 0 ? '#C62828' : '#9E9E9E' }}>
                                    {row.total_emission.toFixed(2)}
                                  </td>
                                  <td style={{ padding: '10px 20px' }}>
                                    {row.is_verified ? (
                                      <span style={{ color: '#4CAF50', fontWeight: 800 }}>✓ Verified</span>
                                    ) : (
                                      <span style={{ color: '#BDBDBD' }}>pending</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px 20px' }}>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                      {emEditId === row.id ? (
                                        <>
                                          <button onClick={() => saveEmissionRow(row.id)} style={{ background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: '0.72rem', fontWeight: 700 }}>💾</button>
                                          <button onClick={() => setEmEditId(null)} style={{ background: '#eee', color: '#666', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: '0.72rem' }}>✕</button>
                                        </>
                                      ) : (
                                        <button onClick={() => { setEmEditId(row.id); setEmEditVals({ product: row.product, emission_per_unit: String(row.emission_per_unit), quantity: String(row.quantity) }) }} style={{ background: '#E3F2FD', color: '#1565C0', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: '0.72rem' }}>✏️</button>
                                      )}
                                      
                                      {row.is_verified ? (
                                        <button onClick={() => markVerified(row.id, false)} style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 6, padding: '4px 8px', fontSize: '0.72rem', cursor: 'pointer' }}>Unmark</button>
                                      ) : (
                                        <button onClick={() => markVerified(row.id, true)} style={{ background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 700 }}>Verify</button>
                                      )}
                                      <button onClick={() => deleteEmissionRow(row.id)} style={{ background: '#FFEBEE', border: 'none', color: '#C62828', borderRadius: 6, padding: '4px 8px', fontSize: '0.72rem', cursor: 'pointer' }}>🗑</button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()
            )}
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
                    {teamTxns.slice(0, 3).map((t, i) => (
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
            {teamTxns.length > 3 && (
              <div style={{ padding: '14px 24px', borderTop: '1px solid #E8F5E9', textAlign: 'center' }}>
                <a
                  href={`/admin/team/${selectedTeam.id}?name=${encodeURIComponent(selectedTeam.team_username)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#4CAF50', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}
                >
                  View all {teamTxns.length} trades →
                </a>
              </div>
            )}
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
