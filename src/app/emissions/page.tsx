'use client'

import { useEffect, useState, useCallback, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

/* ─── Types ───────────────────────────────────────────────── */
type EmissionRow = {
  id: string
  stall_no: string
  product: string
  quantity: number
  emission_per_unit: number
  total_emission: number
  status: 'pending' | 'approved'
  is_submitted: boolean
  is_custom: boolean
  is_verified: boolean
  isDirty: boolean
}

/* ─── Page ────────────────────────────────────────────────── */
export default function EmissionsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [stallNo, setStallNo] = useState<string | null>(null)
  const [manualStall, setManualStall] = useState('')
  const [inputMode, setInputMode] = useState(false)
  const [rows, setRows] = useState<EmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saveAllLoading, setSaveAllLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [globalMsg, setGlobalMsg] = useState('')

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
      (data ?? []).map((r: any) => ({
        id: r.id,
        stall_no: r.stall_no,
        product: r.product,
        quantity: Number(r.quantity),
        emission_per_unit: Number(r.emission_per_unit),
        total_emission: Number(r.total_emission),
        status: (r.status ?? 'pending') as 'pending' | 'approved',
        is_submitted: !!r.is_submitted,
        is_custom: !!r.is_custom,
        is_verified: !!r.is_verified,
        isDirty: false,
      }))
    )
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (stallNo) fetchEmissions(stallNo)
  }, [stallNo, fetchEmissions])

  /* ── Field updates ───────────────────────────────────────── */
  const updateField = (index: number, field: 'product' | 'emission_per_unit' | 'quantity', val: string | number) => {
    setRows((prev) => {
      const copy = [...prev]
      const r = { ...copy[index] }
      
      if (field === 'product') {
        r.product = val as string
      } else if (field === 'quantity') {
        r.quantity = Number(val) || 0
      } else if (field === 'emission_per_unit') {
        r.emission_per_unit = Number(val) || 0
      }

      r.isDirty = true
      r.total_emission = r.quantity * r.emission_per_unit
      copy[index] = r
      return copy
    })
  }

  const addCustomRow = () => {
    if (!stallNo) return
    setRows(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        stall_no: stallNo,
        product: '',
        quantity: 0,
        emission_per_unit: 0,
        total_emission: 0,
        status: 'pending',
        is_submitted: false,
        is_custom: true,
        is_verified: false,
        isDirty: true,
      }
    ])
  }

  const deleteRow = async (index: number) => {
    const row = rows[index]
    if (confirm(`Are you sure you want to delete "${row.product || 'this item'}"?`)) {
      if (!row.id.startsWith('temp-')) {
        const { error } = await supabase.from('emissions_data').delete().eq('id', row.id)
        if (error) { setGlobalMsg('❌ Delete failed: ' + error.message); return }
      }
      setRows(prev => prev.filter((_, i) => i !== index))
    }
  }

  /* ── Save all changes ───────────────────────────────────── */
  const saveAllChanges = async () => {
    if (saveAllLoading) return
    setSaveAllLoading(true)
    setGlobalMsg('💾 Saving all changes…')

    const dirtyRows = rows.filter(r => r.isDirty)
    if (dirtyRows.length === 0) {
      setGlobalMsg('✅ No changes to save.')
      setSaveAllLoading(false)
      setTimeout(() => setGlobalMsg(''), 2000)
      return
    }

    try {
      for (const r of dirtyRows) {
        const payload: any = {
          stall_no: r.stall_no,
          product: r.product,
          quantity: r.quantity,
          emission_per_unit: r.emission_per_unit,
          total_emission: r.total_emission,
          is_submitted: r.is_submitted,
          is_custom: r.is_custom,
          updated_at: new Date().toISOString(),
        }

        if (r.id.startsWith('temp-')) {
          const { error } = await supabase.from('emissions_data').upsert(payload, { onConflict: 'stall_no,product' })
          if (error) throw error
        } else {
          const { error } = await supabase.from('emissions_data').update(payload).eq('id', r.id)
          if (error) throw error
        }
      }
      setGlobalMsg('✅ Changes saved successfully!')
      fetchEmissions(stallNo!)
    } catch (err: any) {
      setGlobalMsg('❌ Save error: ' + err.message)
    } finally {
      setSaveAllLoading(false)
      setTimeout(() => setGlobalMsg(''), 3000)
    }
  }

  /* ── Final Submit ───────────────────────────────────────── */
  const handleFinalSubmit = async () => {
    if (!confirm('Are you sure you want to SUBMIT for final audit? This will lock all editing.')) return
    setSubmitLoading(true)
    setGlobalMsg('')

    // 1. Save any unsaved changes first
    if (rows.some(r => r.isDirty)) {
      setGlobalMsg('💾 Saving changes before submission...')
      await saveAllChanges()
    }

    // 2. Mark all as submitted
    const { error } = await supabase
      .from('emissions_data')
      .update({ is_submitted: true, updated_at: new Date().toISOString() })
      .eq('stall_no', stallNo!)

    if (error) {
      setGlobalMsg('❌ Submission failed: ' + error.message)
    } else {
      setRows((prev) => prev.map((r) => ({ ...r, is_submitted: true, isDirty: false })))
      setGlobalMsg('🎉 Successfully submitted for final audit! Editing is now locked.')
    }
    setSubmitLoading(false)
  }

  /* ── Manual stall submit ────────────────────────────────── */
  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault()
    const val = manualStall.trim()
    if (!val) return
    setInputMode(false)
    setStallNo(val)
  }

  /* ── Computed ─────────────────────────────────────────────── */
  const grandTotal = rows.reduce((sum, r) => sum + r.total_emission, 0)
  const dirtyCount = rows.filter((r) => r.isDirty).length
  const isLocked = rows.some((r) => r.is_submitted)
  const deficit = grandTotal > 70 ? grandTotal - 70 : 0

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
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
      <Navbar />

      <div className="em-page" style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px 64px', width: '100%' }}>
        <Link href="/" style={{ color: '#4CAF50', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          ← Back to Marketplace
        </Link>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2rem', color: '#1A3C2B', margin: '0 0 4px' }}>
            🌿 Emissions Tracker
          </h1>
          <p style={{ color: '#6B7280', margin: 0, fontSize: '0.9rem' }}>
            Stall: <strong style={{ color: '#1A3C2B' }}>{stallNo}</strong> · Update your product quantities below.
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #1A3C2B, #2D6A4F)',
          borderRadius: 16, padding: '20px 28px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ color: '#A8D5B5', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Total Stall Emissions
            </div>
            <div style={{ color: deficit > 0 ? '#FF8A80' : '#4CAF50', fontWeight: 800, fontSize: '2.2rem', lineHeight: 1 }}>
              {grandTotal.toFixed(2)} <span style={{ fontSize: '1rem', color: '#A8D5B5', fontWeight: 600 }}>kg CO₂e</span>
            </div>
            {deficit > 0 && (
              <div style={{ color: '#FF8A80', fontWeight: 700, fontSize: '0.85rem', marginTop: 4 }}>
                ⚠️ You are in a deficit by {deficit.toFixed(2)} kg CO₂e
              </div>
            )}
            <div style={{ color: '#A8D5B5', fontSize: '0.78rem', marginTop: 6 }}>
              {rows.length} product{rows.length !== 1 ? 's' : ''} · {isLocked ? 'SUBMITTED' : 'NOT SUBMITTED'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {!isLocked && (
              <button
                onClick={addCustomRow}
                style={{
                  background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                }}
              >
                ➕ Add Item
              </button>
            )}
            {!isLocked && dirtyCount > 0 && (
              <button
                onClick={saveAllChanges}
                disabled={saveAllLoading}
                style={{
                  background: '#fff', color: '#1A3C2B', border: 'none',
                  borderRadius: 10, padding: '10px 20px', fontWeight: 700,
                  fontSize: '0.9rem', cursor: saveAllLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {saveAllLoading ? '⏳ Saving…' : `💾 Save All (${dirtyCount})`}
              </button>
            )}
            {!isLocked && rows.length > 0 && (
              <button
                onClick={handleFinalSubmit}
                disabled={submitLoading || saveAllLoading}
                style={{
                  background: '#4CAF50', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                }}
              >
                {submitLoading ? '⏳ Submitting…' : '🚀 Submit for Final Audit'}
              </button>
            )}
            {isLocked && (
              <div style={{
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                borderRadius: 10, padding: '10px 20px', fontWeight: 700,
                fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.2)'
              }}>
                🔒 Submission Locked
              </div>
            )}
          </div>
        </div>

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

        <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 16, overflow: 'hidden' }}>
          {rows.length === 0 ? (
            <div style={{ padding: '56px 24px', textAlign: 'center', color: '#9E9E9E' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No products assigned yet</div>
              <div style={{ fontSize: '0.87rem' }}>Add a product or wait for admin assignments.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#F0F7F1' }}>
                    {['Product', 'Emission/Unit', 'Quantity', 'Total (kg)', 'Status', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#6B7280', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.id} style={{ borderTop: '1px solid #E8F5E9', background: isLocked ? '#fafafa' : row.isDirty ? '#FFFDE7' : '#fff' }}>
                      <td style={{ padding: '12px 16px' }}>
                        {!isLocked && row.is_custom && !row.is_verified ? (
                          <input
                            value={row.product}
                            onChange={(e) => updateField(i, 'product', e.target.value)}
                            placeholder="Product Name"
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid #C8E6C9', borderRadius: 8 }}
                          />
                        ) : (
                          <div style={{ fontWeight: 600, color: '#1A3C2B' }}>
                             {row.product || '—'}
                             {row.is_verified && <span style={{ marginLeft: 6, color: '#4CAF50', fontSize: '0.7rem' }}>✓</span>}
                          </div>
                        )}
                        <div style={{ fontSize: '0.7rem', color: '#9E9E9E', marginTop: 4 }}>
                          {row.is_custom ? (row.is_verified ? 'Official (Verified)' : 'Custom Item') : 'Official'}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', color: '#6B7280' }}>
                        {!isLocked && row.is_custom && !row.is_verified ? (
                          <input
                            type="number" step="any"
                            value={row.emission_per_unit}
                            onChange={(e) => updateField(i, 'emission_per_unit', e.target.value)}
                            style={{ width: 70, padding: '6px 8px', border: '1px solid #C8E6C9', borderRadius: 8 }}
                          />
                        ) : (
                          <span style={{ fontWeight: row.is_verified ? 600 : 400 }}>{row.emission_per_unit.toFixed(4)}</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <input
                          type="number" min={0} step="any"
                          value={row.quantity ?? ''}
                          onChange={(e) => updateField(i, 'quantity', e.target.value)}
                          disabled={isLocked}
                          style={{
                            width: 80, padding: '6px 10px',
                            border: `1.5px solid ${row.isDirty ? '#F9A825' : '#C8E6C9'}`, borderRadius: 8,
                            background: isLocked ? '#f5f5f5' : 'transparent',
                          }}
                        />
                      </td>

                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>{row.total_emission.toFixed(2)}</td>

                      <td style={{ padding: '12px 16px' }}>
                         {isLocked ? (
                          <span style={{ color: '#2D6A4F', fontWeight: 700, fontSize: '0.75rem' }}>🔒 Final Audit</span>
                        ) : row.is_verified ? (
                          <span style={{ color: '#2E7D32', fontWeight: 700, fontSize: '0.75rem' }}>✅ Verified</span>
                        ) : row.is_custom ? (
                          <span style={{ color: '#F9A825', fontWeight: 700, fontSize: '0.75rem' }}>⏳ Reviewing</span>
                        ) : row.isDirty ? (
                          <span style={{ color: '#E65100', fontWeight: 700, fontSize: '0.75rem' }}>✏️ Unsaved</span>
                        ) : (
                          <span style={{ color: '#1B5E20', fontWeight: 700, fontSize: '0.75rem' }}>🟢 Active</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {!isLocked && row.is_custom && (
                          <button
                            onClick={() => deleteRow(i)}
                            style={{ background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}
                          >
                            🗑 Delete
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
      </div>
      <Footer />
    </div>
  )
}
