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
  isDirty: boolean
  isSaving: boolean
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
        isDirty: false,
        isSaving: false,
      }))
    )
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (stallNo) fetchEmissions(stallNo)
  }, [stallNo, fetchEmissions])

  /* ── Quantity update (ONLY field teams can change) ──────── */
  const updateQuantity = (index: number, raw: string) => {
    setRows((prev) => {
      const next = [...prev]
      const r = { ...next[index] }
      r.quantity = parseFloat(raw) || 0
      r.total_emission = r.quantity * r.emission_per_unit
      r.isDirty = true
      next[index] = r
      return next
    })
  }

  /* ── Save a single row ──────────────────────────────────── */
  const saveRow = async (index: number) => {
    const r = rows[index]
    setRows((prev) => { const n = [...prev]; n[index] = { ...n[index], isSaving: true }; return n })

    const { error } = await supabase
      .from('emissions_data')
      .update({
        quantity: r.quantity,
        total_emission: r.quantity * r.emission_per_unit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', r.id)

    if (error) {
      setGlobalMsg('❌ Save failed: ' + error.message)
      setRows((prev) => { const n = [...prev]; n[index] = { ...n[index], isSaving: false }; return n })
      return false
    }

    setRows((prev) => {
      const n = [...prev]
      n[index] = { ...n[index], isSaving: false, isDirty: false }
      return n
    })
    return true
  }

  /* ── Save all dirty rows ────────────────────────────────── */
  const saveAllRows = async () => {
    setSaveAllLoading(true)
    setGlobalMsg('')
    let allSuccess = true
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].isDirty) {
        const success = await saveRow(i)
        if (!success) allSuccess = false
      }
    }
    setSaveAllLoading(false)
    if (allSuccess) {
      setGlobalMsg('✅ All quantities saved.')
      setTimeout(() => setGlobalMsg(''), 3000)
    }
    return allSuccess
  }

  /* ── Final Submit ───────────────────────────────────────── */
  const handleFinalSubmit = async () => {
    if (!confirm('Are you sure you want to SUBMIT for final audit? This will lock all editing.')) return
    setSubmitLoading(true)
    setGlobalMsg('')

    // 1. Save any unsaved changes first
    const saveSuccess = await saveAllRows()
    if (!saveSuccess) {
      setSubmitLoading(false)
      return
    }

    // 2. Mark all as submitted
    const { error } = await supabase
      .from('emissions_data')
      .update({ is_submitted: true, updated_at: new Date().toISOString() })
      .eq('stall_no', stallNo!)

    if (error) {
      setGlobalMsg('❌ Submission failed: ' + error.message)
    } else {
      setRows((prev) => prev.map((r) => ({ ...r, is_submitted: true })))
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
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F7F1' }}>
      <Navbar />

      <div className="em-page" style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px 64px', width: '100%' }}>
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
            Stall: <strong style={{ color: '#1A3C2B' }}>{stallNo}</strong> · Update your product quantities below.
          </p>
          <p style={{ color: '#9E9E9E', margin: '4px 0 0', fontSize: '0.82rem' }}>
            ℹ️ Product names and emission factors are set by the admin. You can only update <strong>quantities</strong>.
          </p>
        </div>

        {/* Summary card */}
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
            {!isLocked && dirtyCount > 0 && (
              <button
                onClick={saveAllRows}
                disabled={saveAllLoading}
                style={{
                  background: '#fff', color: '#1A3C2B', border: 'none',
                  borderRadius: 10, padding: '10px 20px', fontWeight: 700,
                  fontSize: '0.9rem', cursor: saveAllLoading ? 'not-allowed' : 'pointer',
                  opacity: saveAllLoading ? 0.7 : 1,
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
                  borderRadius: 10, padding: '10px 20px', fontWeight: 700,
                  fontSize: '0.9rem', cursor: (submitLoading || saveAllLoading) ? 'not-allowed' : 'pointer',
                  opacity: (submitLoading || saveAllLoading) ? 0.7 : 1,
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

        {/* Status legend */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#6B7280' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: isLocked ? '#F5F5F5' : '#FFFDE7', border: `1px solid ${isLocked ? '#E0E0E0' : '#F9A825'}`, display: 'inline-block' }} />
            {isLocked ? 'Locked (Submitted)' : 'Editable'}
          </div>
        </div>

        {/* Global message */}
        {globalMsg && (
          <div style={{
            background: globalMsg.startsWith('✅') || globalMsg.startsWith('🎉') ? '#E8F5E9' : '#FFEBEE',
            border: `1px solid ${globalMsg.startsWith('✅') || globalMsg.startsWith('🎉') ? '#C8E6C9' : '#FFCDD2'}`,
            borderRadius: 10, padding: '10px 16px', marginBottom: 20,
            fontSize: '0.9rem', color: globalMsg.startsWith('✅') || globalMsg.startsWith('🎉') ? '#2D6A4F' : '#C62828',
          }}>
            {globalMsg}
          </div>
        )}

        {/* Table */}
        <div style={{ background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 16, overflow: 'hidden' }}>
          {rows.length === 0 ? (
            <div style={{ padding: '56px 24px', textAlign: 'center', color: '#9E9E9E' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No products assigned yet</div>
              <div style={{ fontSize: '0.87rem' }}>The admin will populate your product list. Check back soon.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#F0F7F1' }}>
                    {['Product', 'Emission / Unit (kg CO₂e)', 'Quantity', 'Total Emission (kg CO₂e)', 'Status', 'Action'].map((h) => (
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
                  {rows.map((r, i) => {
                    const rowBg = isLocked
                      ? '#FAFAFA'
                      : r.isDirty
                        ? '#FFFDE7'
                        : '#fff'
                    return (
                      <tr
                        key={r.id}
                        style={{
                          borderTop: '1px solid #E8F5E9',
                          background: rowBg,
                          transition: 'background 0.2s',
                          opacity: isLocked ? 0.8 : 1
                        }}
                      >
                        {/* Product — READ ONLY */}
                        <td style={{ padding: '10px 16px', color: '#1A3C2B', fontWeight: 600 }}>
                          {r.product || <span style={{ color: '#9E9E9E', fontStyle: 'italic' }}>—</span>}
                        </td>

                        {/* Emission per unit — READ ONLY */}
                        <td style={{ padding: '10px 16px', color: '#6B7280' }}>
                          {r.emission_per_unit.toFixed(4)}
                        </td>

                        {/* Quantity — EDITABLE (unless locked) */}
                        <td style={{ padding: '10px 14px', minWidth: 110 }}>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={r.quantity ?? ''}
                            placeholder="0"
                            onChange={(e) => updateQuantity(i, e.target.value)}
                            disabled={isLocked}
                            style={{
                              width: '100%', padding: '6px 10px',
                              border: `1.5px solid ${r.isDirty ? '#F9A825' : '#C8E6C9'}`, borderRadius: 8,
                              fontSize: '0.88rem', color: isLocked ? '#9E9E9E' : '#1A3C2B',
                              outline: 'none', background: isLocked ? '#F5F5F5' : 'transparent',
                              cursor: isLocked ? 'not-allowed' : 'text',
                            }}
                            onFocus={(e) => !isLocked && (e.target.style.borderColor = '#4CAF50')}
                            onBlur={(e) => !isLocked && (e.target.style.borderColor = r.isDirty ? '#F9A825' : '#C8E6C9')}
                          />
                        </td>

                        {/* Total emission */}
                        <td style={{ padding: '10px 16px', fontWeight: 700, color: r.total_emission > 0 ? '#C62828' : '#9E9E9E' }}>
                          {r.total_emission > 0 ? r.total_emission.toFixed(2) : '—'}
                        </td>

                        {/* Status badge */}
                        <td style={{ padding: '10px 16px' }}>
                          {isLocked ? (
                            <span style={{ background: '#E8F5E9', color: '#2D6A4F', borderRadius: 6, padding: '3px 10px', fontWeight: 700, fontSize: '0.75rem' }}>
                              🔒 Submitted
                            </span>
                          ) : r.isDirty ? (
                            <span style={{ background: '#FFF3E0', color: '#E65100', borderRadius: 6, padding: '3px 10px', fontWeight: 700, fontSize: '0.75rem' }}>
                              ✏️ Unsaved
                            </span>
                          ) : (
                            <span style={{ background: '#FFFDE7', color: '#F57F17', borderRadius: 6, padding: '3px 10px', fontWeight: 700, fontSize: '0.75rem' }}>
                              🟢 Active
                            </span>
                          )}
                        </td>

                        {/* Save button */}
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          {!isLocked && r.isDirty && (
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
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .em-page { padding: 16px 12px 48px !important; }
        }
      `}</style>
      <Footer />
    </div>
  )
}
