'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

/* ─── Types ───────────────────────────────────────────────── */
type EmissionRow = {
  id: string | null          // null = new, unsaved row
  stall_no: string
  product: string
  quantity: number
  emission_per_unit: number
  total_emission: number
  isDirty: boolean
  isSaving: boolean
}

/* ─── Helpers ─────────────────────────────────────────────── */
const makeBlank = (stall_no: string): EmissionRow => ({
  id: null,
  stall_no,
  product: '',
  quantity: 0,
  emission_per_unit: 0,
  total_emission: 0,
  isDirty: true,
  isSaving: false,
})

/* ─── Page ────────────────────────────────────────────────── */
export default function EmissionsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [stallNo, setStallNo] = useState<string | null>(null)
  const [manualStall, setManualStall] = useState('')
  const [inputMode, setInputMode] = useState(false) // ask for manual stall
  const [rows, setRows] = useState<EmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saveAll, setSaveAll] = useState(false)
  const [globalMsg, setGlobalMsg] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null) // row id being deleted

  /* ── Load stall from profile ───────────────────────────── */
  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/auth'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('team_username')
        .eq('id', userData.user.id)
        .single()

      const stall = profile?.team_username ?? null
      if (stall) {
        setStallNo(stall)
      } else {
        // no team_username set — ask user to enter manually
        setInputMode(true)
        setLoading(false)
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Fetch emissions for current stall ─────────────────── */
  const fetchEmissions = useCallback(async (stall: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('emissions_data')
      .select('*')
      .eq('stall_no', stall)
      .order('updated_at', { ascending: true })

    if (error) {
      setGlobalMsg('❌ Failed to load emissions: ' + error.message)
      setLoading(false)
      return
    }

    setRows(
      (data ?? []).map((r) => ({
        id: r.id,
        stall_no: r.stall_no,
        product: r.product,
        quantity: Number(r.quantity),
        emission_per_unit: Number(r.emission_per_unit),
        total_emission: Number(r.total_emission),
        isDirty: false,
        isSaving: false,
      }))
    )
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (stallNo) fetchEmissions(stallNo)
  }, [stallNo, fetchEmissions])

  /* ── Cell update helpers ────────────────────────────────── */
  const updateRow = (index: number, field: keyof EmissionRow, raw: string) => {
    setRows((prev) => {
      const next = [...prev]
      const r = { ...next[index] }
      if (field === 'product') {
        r.product = raw
      } else if (field === 'quantity') {
        r.quantity = parseFloat(raw) || 0
      } else if (field === 'emission_per_unit') {
        r.emission_per_unit = parseFloat(raw) || 0
      }
      r.total_emission = r.quantity * r.emission_per_unit
      r.isDirty = true
      next[index] = r
      return next
    })
  }

  /* ── Save a single row ──────────────────────────────────── */
  const saveRow = async (index: number) => {
    const r = rows[index]
    if (!r.product.trim()) {
      setGlobalMsg('❌ Product name cannot be empty.')
      return
    }
    setRows((prev) => { const n = [...prev]; n[index] = { ...n[index], isSaving: true }; return n })

    const payload = {
      stall_no: stallNo!,
      product: r.product.trim(),
      quantity: r.quantity,
      emission_per_unit: r.emission_per_unit,
      updated_at: new Date().toISOString(),
    }

    let newId = r.id
    let error: { message: string } | null = null

    if (r.id) {
      // UPDATE
      const res = await supabase
        .from('emissions_data')
        .update(payload)
        .eq('id', r.id)
      error = res.error
    } else {
      // INSERT
      const res = await supabase
        .from('emissions_data')
        .insert(payload)
        .select('id, total_emission')
        .single()
      error = res.error
      if (!error && res.data) newId = res.data.id
    }

    if (error) {
      setGlobalMsg('❌ Save failed: ' + error.message)
      setRows((prev) => { const n = [...prev]; n[index] = { ...n[index], isSaving: false }; return n })
      return
    }

    setRows((prev) => {
      const n = [...prev]
      n[index] = { ...n[index], id: newId, isSaving: false, isDirty: false }
      return n
    })
    setGlobalMsg('✅ Row saved.')
    setTimeout(() => setGlobalMsg(''), 2500)
  }

  /* ── Save all dirty rows ────────────────────────────────── */
  const saveAllRows = async () => {
    setSaveAll(true)
    setGlobalMsg('')
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].isDirty) await saveRow(i)
    }
    setSaveAll(false)
    setGlobalMsg('✅ All rows saved.')
    setTimeout(() => setGlobalMsg(''), 2500)
  }

  /* ── Delete a row ───────────────────────────────────────── */
  const deleteRow = async (index: number) => {
    const r = rows[index]
    if (r.id) {
      const { error } = await supabase.from('emissions_data').delete().eq('id', r.id)
      if (error) { setGlobalMsg('❌ Delete failed: ' + error.message); return }
    }
    setRows((prev) => prev.filter((_, i) => i !== index))
    setDeleteTarget(null)
  }

  /* ── Add blank row ──────────────────────────────────────── */
  const addRow = () => {
    setRows((prev) => [...prev, makeBlank(stallNo!)])
  }

  /* ── Manual stall submit ────────────────────────────────── */
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const val = manualStall.trim()
    if (!val) return
    setInputMode(false)
    setStallNo(val)
  }

  /* ── Grand total ─────────────────────────────────────────── */
  const grandTotal = rows.reduce((sum, r) => sum + r.total_emission, 0)

  /* ─────────────────────────────────────────────────────────
     RENDER — Loading
  ───────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#6B7280' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, color: '#1A3C2B' }}>Loading emissions data…</div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  /* ─────────────────────────────────────────────────────────
     RENDER — Manual stall input
  ───────────────────────────────────────────────────────── */
  if (inputMode) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '40px 36px',
            width: '100%', maxWidth: 420,
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            border: '1.5px solid #C8E6C9',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🌿</div>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#1A3C2B', margin: 0 }}>
                Emissions Tracker
              </h1>
              <p style={{ color: '#6B7280', margin: '6px 0 0', fontSize: '0.88rem' }}>
                Your stall ID wasn&apos;t found in your profile. Enter it manually.
              </p>
            </div>
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                type="text"
                placeholder="e.g. stall01 or Team Alpha"
                value={manualStall}
                onChange={(e) => setManualStall(e.target.value)}
                required
                style={{
                  padding: '12px 14px', border: '1.5px solid #C8E6C9', borderRadius: 10,
                  fontSize: '0.95rem', outline: 'none', color: '#1A3C2B',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#4CAF50')}
                onBlur={(e) => (e.target.style.borderColor = '#C8E6C9')}
              />
              <button
                type="submit"
                style={{
                  background: '#1A3C2B', color: '#fff', border: 'none', borderRadius: 10,
                  padding: '13px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Continue →
              </button>
            </form>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  /* ─────────────────────────────────────────────────────────
     RENDER — Main emissions table
  ───────────────────────────────────────────────────────── */
  const dirtyCount = rows.filter((r) => r.isDirty).length

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
      <Navbar />

      <div className="em-page" style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px 64px', width: '100%' }}>
        {/* Back link */}
        <Link href="/" style={{ color: '#4CAF50', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          ← Back to Marketplace
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2rem', color: '#1A3C2B', margin: '0 0 4px' }}>
            🌿 Emissions Tracker
          </h1>
          <p style={{ color: '#6B7280', margin: 0, fontSize: '0.9rem' }}>
            Stall: <strong style={{ color: '#1A3C2B' }}>{stallNo}</strong> · Log your product-level emissions below.
          </p>
        </div>

        {/* Summary card */}
        <div style={{
          background: 'linear-gradient(135deg, #1A3C2B, #2D6A4F)',
          borderRadius: 16, padding: '20px 28px', marginBottom: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ color: '#A8D5B5', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Total Stall Emissions
            </div>
            <div style={{ color: '#4CAF50', fontWeight: 800, fontSize: '2.2rem', lineHeight: 1 }}>
              {grandTotal.toFixed(2)} <span style={{ fontSize: '1rem', color: '#A8D5B5', fontWeight: 600 }}>kg CO₂e</span>
            </div>
            <div style={{ color: '#A8D5B5', fontSize: '0.78rem', marginTop: 6 }}>
              {rows.length} product{rows.length !== 1 ? 's' : ''} tracked
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={addRow}
              style={{
                background: '#4CAF50', color: '#fff', border: 'none',
                borderRadius: 10, padding: '10px 20px', fontWeight: 700,
                fontSize: '0.9rem', cursor: 'pointer',
              }}
            >
              + Add Product
            </button>
            {dirtyCount > 0 && (
              <button
                onClick={saveAllRows}
                disabled={saveAll}
                style={{
                  background: '#fff', color: '#1A3C2B', border: 'none',
                  borderRadius: 10, padding: '10px 20px', fontWeight: 700,
                  fontSize: '0.9rem', cursor: saveAll ? 'not-allowed' : 'pointer',
                  opacity: saveAll ? 0.7 : 1,
                }}
              >
                {saveAll ? '⏳ Saving…' : `💾 Save All (${dirtyCount})`}
              </button>
            )}
          </div>
        </div>

        {/* Global message */}
        {globalMsg && (
          <div style={{
            background: globalMsg.startsWith('✅') ? '#E8F5E9' : '#FFEBEE',
            border: `1px solid ${globalMsg.startsWith('✅') ? '#C8E6C9' : '#FFCDD2'}`,
            borderRadius: 10, padding: '10px 16px', marginBottom: 20,
            fontSize: '0.9rem', color: globalMsg.startsWith('✅') ? '#2D6A4F' : '#C62828',
          }}>
            {globalMsg}
          </div>
        )}

        {/* Table */}
        <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 16, overflow: 'hidden' }}>
          {rows.length === 0 ? (
            <div style={{ padding: '56px 24px', textAlign: 'center', color: '#9E9E9E' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No products yet</div>
              <div style={{ fontSize: '0.87rem' }}>Click &quot;+ Add Product&quot; to start logging emissions.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#F0F7F1' }}>
                    {['Product', 'Emission / Unit (kg CO₂e)', 'Quantity', 'Total Emission (kg CO₂e)', 'Actions'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '12px 16px', textAlign: 'left',
                          color: '#6B7280', fontWeight: 600, fontSize: '0.78rem',
                          textTransform: 'uppercase', whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={r.id ?? `new-${i}`}
                      style={{
                        borderTop: '1px solid #E8F5E9',
                        background: r.isDirty
                          ? '#FFFDE7'
                          : i % 2 === 0 ? '#fff' : '#FAFFFE',
                        transition: 'background 0.2s',
                      }}
                    >
                      {/* Product */}
                      <td style={{ padding: '10px 14px', minWidth: 160 }}>
                        <input
                          type="text"
                          value={r.product}
                          placeholder="e.g. Plastic cups"
                          onChange={(e) => updateRow(i, 'product', e.target.value)}
                          style={{
                            width: '100%', padding: '6px 10px',
                            border: '1.5px solid #C8E6C9', borderRadius: 8,
                            fontSize: '0.88rem', color: '#1A3C2B',
                            outline: 'none', background: 'transparent',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#4CAF50')}
                          onBlur={(e) => (e.target.style.borderColor = '#C8E6C9')}
                        />
                      </td>
                      {/* Emission per unit */}
                      <td style={{ padding: '10px 14px', minWidth: 140 }}>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={r.emission_per_unit || ''}
                          placeholder="0.00"
                          onChange={(e) => updateRow(i, 'emission_per_unit', e.target.value)}
                          style={{
                            width: '100%', padding: '6px 10px',
                            border: '1.5px solid #C8E6C9', borderRadius: 8,
                            fontSize: '0.88rem', color: '#1A3C2B',
                            outline: 'none', background: 'transparent',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#4CAF50')}
                          onBlur={(e) => (e.target.style.borderColor = '#C8E6C9')}
                        />
                      </td>
                      {/* Quantity */}
                      <td style={{ padding: '10px 14px', minWidth: 110 }}>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={r.quantity || ''}
                          placeholder="0"
                          onChange={(e) => updateRow(i, 'quantity', e.target.value)}
                          style={{
                            width: '100%', padding: '6px 10px',
                            border: '1.5px solid #C8E6C9', borderRadius: 8,
                            fontSize: '0.88rem', color: '#1A3C2B',
                            outline: 'none', background: 'transparent',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#4CAF50')}
                          onBlur={(e) => (e.target.style.borderColor = '#C8E6C9')}
                        />
                      </td>
                      {/* Total */}
                      <td style={{ padding: '10px 16px', fontWeight: 700, color: r.total_emission > 0 ? '#C62828' : '#9E9E9E' }}>
                        {r.total_emission > 0 ? r.total_emission.toFixed(2) : '—'}
                      </td>
                      {/* Actions */}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {r.isDirty && (
                            <button
                              onClick={() => saveRow(i)}
                              disabled={r.isSaving}
                              style={{
                                background: '#4CAF50', color: '#fff', border: 'none',
                                borderRadius: 7, padding: '5px 12px', fontWeight: 700,
                                fontSize: '0.78rem', cursor: r.isSaving ? 'not-allowed' : 'pointer',
                                opacity: r.isSaving ? 0.6 : 1,
                              }}
                            >
                              {r.isSaving ? '⏳' : '💾 Save'}
                            </button>
                          )}
                          {deleteTarget === (r.id ?? `new-${i}`) ? (
                            <>
                              <button
                                onClick={() => deleteRow(i)}
                                style={{ background: '#FFEBEE', color: '#C62828', border: '1px solid #FFCDD2', borderRadius: 7, padding: '5px 10px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                              >
                                ✓ Yes
                              </button>
                              <button
                                onClick={() => setDeleteTarget(null)}
                                style={{ background: '#F5F5F5', color: '#9E9E9E', border: 'none', borderRadius: 7, padding: '5px 10px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setDeleteTarget(r.id ?? `new-${i}`)}
                              style={{ background: '#FFF3F3', color: '#E53935', border: '1px solid #FFCDD2', borderRadius: 7, padding: '5px 10px', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Grand total footer */}
                <tfoot>
                  <tr style={{ background: '#F0F7F1', borderTop: '2px solid #C8E6C9' }}>
                    <td colSpan={3} style={{ padding: '12px 16px', fontWeight: 700, color: '#1A3C2B', fontSize: '0.88rem' }}>
                      Total Stall Emissions
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: grandTotal > 0 ? '#C62828' : '#9E9E9E', fontSize: '1rem' }}>
                      {grandTotal.toFixed(2)} kg CO₂e
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Bottom add row */}
        {rows.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button
              onClick={addRow}
              style={{
                background: '#fff', color: '#1A3C2B', border: '1.5px solid #C8E6C9',
                borderRadius: 10, padding: '10px 20px', fontWeight: 700,
                fontSize: '0.9rem', cursor: 'pointer',
              }}
            >
              + Add Product
            </button>
            {dirtyCount > 0 && (
              <button
                onClick={saveAllRows}
                disabled={saveAll}
                style={{
                  background: '#1A3C2B', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '10px 20px', fontWeight: 700,
                  fontSize: '0.9rem', cursor: saveAll ? 'not-allowed' : 'pointer',
                  opacity: saveAll ? 0.7 : 1,
                }}
              >
                {saveAll ? '⏳ Saving…' : `💾 Save All (${dirtyCount})`}
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .em-page { padding: 16px 12px 48px !important; }
        }
      `}</style>
      <Footer />
    </div>
  )
}
