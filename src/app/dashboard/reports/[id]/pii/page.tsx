'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useReport } from '@/lib/context/ReportContext'
import { ShieldCheck } from 'lucide-react'
import type { PIIAction, PIIEntityType } from '@/lib/pii/detect'

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * UI-side shape. The API returns DB-native columns (detected_value,
 * source_file, is_excluded, ...); we map once at fetch time into this
 * flatter shape so the rest of the component stays unchanged from the
 * original demo design.
 */
interface DetectedPII {
  id: string
  type: PIIEntityType
  detected: string
  token: string
  source: string
  confidence: number
  action: PIIAction
  flagged?: boolean
  is_excluded?: boolean
  is_confirmed?: boolean
}

interface PIIRow {
  id: string
  entity_type: PIIEntityType
  detected_value: string
  token: string
  action: PIIAction
  source_file: string | null
  confidence: number | null
  needs_review: boolean | null
  is_excluded: boolean | null
  is_confirmed: boolean | null
}

// ─── Demo entities (used as fallback when no real detections exist) ─────────

const DEMO: DetectedPII[] = [
  { id: 'p1',  type: 'STUDENT',         detected: 'Mateo Rivera',       token: '[STUDENT_001]',            source: 'parent_intake.pdf · pg 1',   confidence: 0.99, action: 'replace' },
  { id: 'p2',  type: 'STUDENT',         detected: 'M. Rivera',          token: '[STUDENT_001]',            source: 'CELF-5_Rivera.pdf · cover',  confidence: 0.96, action: 'replace' },
  { id: 'p3',  type: 'STUDENT',         detected: 'Mateo R.',           token: '[STUDENT_001]',            source: 'teacher_email.txt',          confidence: 0.94, action: 'replace' },
  { id: 'p4',  type: 'DOB',             detected: '03/14/2016',         token: '[AGE: 9 years 4 months]',  source: 'parent_intake.pdf · pg 1',   confidence: 0.99, action: 'semantic' },
  { id: 'p5',  type: 'PARENT_GUARDIAN', detected: 'Lucia Rivera',       token: '[PARENT_001]',             source: 'parent_intake.pdf · pg 2',   confidence: 0.97, action: 'replace' },
  { id: 'p6',  type: 'PARENT_GUARDIAN', detected: 'Carlos Rivera',      token: '[PARENT_002]',             source: 'parent_intake.pdf · pg 2',   confidence: 0.97, action: 'replace' },
  { id: 'p7',  type: 'SCHOOL',          detected: 'Lincoln Elementary', token: '[SCHOOL_001]',             source: 'teacher_email.txt',          confidence: 0.98, action: 'replace' },
  { id: 'p8',  type: 'TEACHER',         detected: 'Ms. Hartwell',       token: '[TEACHER_001]',            source: 'teacher_email.txt',          confidence: 0.95, action: 'replace' },
  { id: 'p9',  type: 'ADDRESS',         detected: '1248 Maple Ave',     token: '[ADDRESS]',                source: 'parent_intake.pdf · pg 1',   confidence: 0.92, action: 'remove' },
  { id: 'p10', type: 'PHONE',           detected: '(415) 555-0142',     token: '[PHONE]',                  source: 'parent_intake.pdf · pg 2',   confidence: 0.99, action: 'remove' },
  { id: 'p11', type: 'MRN',             detected: 'MRN 47-2891-A',      token: '[MEDICAL_ID]',             source: 'developmental_history.pdf',  confidence: 0.88, action: 'remove', flagged: true },
  { id: 'p12', type: 'DATE',            detected: '10/22/2025',         token: '[ASSESSMENT_DATE]',        source: 'CELF-5_Rivera.pdf',          confidence: 0.97, action: 'semantic' },
]

const TYPE_COLOR: Record<PIIEntityType, string> = {
  STUDENT:         'var(--terracotta)',
  PARENT_GUARDIAN: '#9B7BAE',
  TEACHER:         '#8AA3B8',
  SCHOOL:          '#7B9E89',
  DOB:             '#C9A96E',
  DATE:            '#B5B091',
  ADDRESS:         '#A87B6A',
  PHONE:           '#A87B6A',
  EMAIL:           '#A87B6A',
  MRN:             '#b85a3c',
  SSN:             '#b85a3c',
  OTHER:           '#9a9a9a',
}

// Map the API row (DB-native column names) into the flat UI shape.
function rowToEntity(r: PIIRow): DetectedPII {
  return {
    id: r.id,
    type: r.entity_type,
    detected: r.detected_value,
    token: r.token,
    source: r.source_file ?? '(all files)',
    confidence: typeof r.confidence === 'number' ? r.confidence : 1,
    action: r.action,
    flagged: !!r.needs_review,
    is_excluded: !!r.is_excluded,
    is_confirmed: !!r.is_confirmed,
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PIIConfirmPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { report } = useReport()

  // `isDemo` flags that we're showing the fallback sample list — used to
  // disable live PATCH calls (the demo IDs don't exist in the DB).
  const [entities, setEntities] = useState<DetectedPII[]>(DEMO)
  const [isDemo, setIsDemo] = useState(true)
  const [tableMissing, setTableMissing] = useState(false)
  const [actions, setActions] = useState<Record<string, PIIAction>>(
    () => Object.fromEntries(DEMO.map((e) => [e.id, e.action]))
  )
  const [excluded, setExcluded] = useState<Record<string, boolean>>({})

  // Fetch real mappings on mount. Falls back to DEMO when the server says
  // the table is missing or the list is empty.
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/reports/${params.id}/pii`, { cache: 'no-store' })
        if (!res.ok) return
        const json = (await res.json()) as { mappings?: PIIRow[]; tableMissing?: boolean }
        if (cancelled) return

        if (json.tableMissing) setTableMissing(true)

        const rows = Array.isArray(json.mappings) ? json.mappings : []
        if (rows.length > 0) {
          const mapped = rows.map(rowToEntity)
          setEntities(mapped)
          setActions(Object.fromEntries(mapped.map((e) => [e.id, e.action])))
          setExcluded(Object.fromEntries(mapped.filter((e) => e.is_excluded).map((e) => [e.id, true])))
          setIsDemo(false)
        }
      } catch (err) {
        // Network failure — keep DEMO fallback, log for observability.
        console.warn('[pii] failed to load mappings', err)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [params.id])

  // ── Dirty-set + debounced PATCH ───────────────────────────────────────────
  const dirtyRef = useRef<Set<string>>(new Set())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const actionsRef = useRef(actions)
  const excludedRef = useRef(excluded)
  actionsRef.current = actions
  excludedRef.current = excluded

  const flush = () => {
    if (isDemo) {
      dirtyRef.current.clear()
      return
    }
    const ids = Array.from(dirtyRef.current)
    if (ids.length === 0) return
    dirtyRef.current.clear()
    const payload = {
      updates: ids.map((id) => ({
        id,
        action: actionsRef.current[id],
        is_excluded: !!excludedRef.current[id],
      })),
    }
    fetch(`/api/reports/${params.id}/pii`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.warn('[pii] failed to persist updates', err)
    })
  }

  const scheduleFlush = (id: string) => {
    dirtyRef.current.add(id)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(flush, 500)
  }

  // Flush on unmount so we don't drop a pending edit.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (dirtyRef.current.size > 0) flush()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setAction = (id: string, a: PIIAction) => {
    setActions((p) => ({ ...p, [id]: a }))
    scheduleFlush(id)
  }
  const toggleExcluded = (id: string) => {
    setExcluded((p) => ({ ...p, [id]: !p[id] }))
    scheduleFlush(id)
  }

  const grouped = useMemo(() => {
    const map: Record<string, DetectedPII[]> = {}
    entities.forEach((e) => {
      ;(map[e.type] ??= []).push(e)
    })
    return map
  }, [entities])

  const totalCount = entities.length
  const activeCount = entities.filter((e) => !excluded[e.id]).length
  const flaggedCount = entities.filter((e) => e.flagged && !excluded[e.id]).length
  const sourceCount = new Set(
    entities.map((e) => (e.source || '').split('·')[0].trim() || 'unknown')
  ).size
  const categoryCount = Object.keys(grouped).length

  const onContinue = () => {
    router.push(`/dashboard/reports/${params.id}`)
  }
  const onBack = () => {
    router.push(`/dashboard/reports/${params.id}/triage`)
  }

  const showDemoBanner = isDemo // true when we're showing fallback list

  return (
    <div className="min-h-full bg-[var(--paper)] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="wf-pii-wrap">
          {/* Header */}
          <div className="wf-pii-header">
            <ShieldCheck className="h-11 w-11" style={{ color: 'var(--terracotta-ink)', flexShrink: 0 }} />
            <div className="flex flex-col gap-1 flex-1">
              <div className="wf-label">Step 2 of 4 · before analysis · {report?.title}</div>
              <h1 className="wf-heading" style={{ fontSize: 28, margin: 0, lineHeight: 1.1 }}>
                De-identify before sending.
              </h1>
              <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-2)', maxWidth: '62ch', lineHeight: 1.55 }}>
                We detected <b>{totalCount} pieces of personal information</b> across your sources. Confirm what gets de-identified before we send anything to AI for analysis. The mapping stays on your server — the AI never sees real names, dates of birth, or addresses.
              </p>
            </div>
          </div>

          {/* Demo / empty-state banner */}
          {showDemoBanner && (
            <div className="wf-flag warn" role="status" style={{ margin: '6px 0' }}>
              {tableMissing
                ? 'PII storage is not yet set up — showing a sample detection list. Apply supabase/migrations/004_pii_mappings.sql to persist real detections.'
                : 'No real PII detected yet — showing a sample. Upload a file to see real detections.'}
            </div>
          )}

          {/* Stat strip */}
          <div className="wf-pii-stat-strip">
            <Stat num={activeCount} label={<>entities will be<br />de-identified</>} />
            <Stat num={categoryCount} label={<>categories<br />detected</>} />
            <Stat num={sourceCount} label={<>source files<br />scanned</>} />
            <Stat num={flaggedCount} label={<>low-confidence<br />need review</>} warn={flaggedCount > 0} />
          </div>

          {/* Section head */}
          <div className="flex justify-between items-center mt-1">
            <div className="wf-label bold">Detected entities</div>
            <div className="flex gap-1.5">
              <button type="button" className="wf-btn sm ghost" disabled>Group: by type</button>
              <button type="button" className="wf-btn sm ghost" disabled>Show source context</button>
            </div>
          </div>

          {/* Table */}
          <div className="wf-pii-table">
            <div className="wf-pii-row wf-pii-row-head">
              <div>Type</div>
              <div>Detected</div>
              <div>Will become</div>
              <div>Source</div>
              <div>Action</div>
              <div />
            </div>

            {entities.map((e) => {
              const ex = !!excluded[e.id]
              const a = actions[e.id]
              return (
                <div
                  key={e.id}
                  className={`wf-pii-row ${ex ? 'excluded' : ''} ${e.flagged ? 'flagged' : ''}`}
                >
                  <div className="wf-pii-type">
                    <span className="wf-pii-type-dot" style={{ background: TYPE_COLOR[e.type] }} />
                    <span>{e.type.replace('_', ' ')}</span>
                  </div>
                  <div className="wf-pii-detected" title={e.detected}>&ldquo;{e.detected}&rdquo;</div>
                  <div className="wf-pii-token">{a === 'remove' ? '—' : e.token}</div>
                  <div className="wf-pii-source" title={e.source || '(all files)'}>{e.source || '(all files)'}</div>
                  <div className="wf-pii-action">
                    <select
                      value={a}
                      onChange={(ev) => setAction(e.id, ev.target.value as PIIAction)}
                      disabled={ex}
                    >
                      <option value="replace">Replace with token</option>
                      <option value="semantic">Convert to semantic</option>
                      <option value="remove">Remove entirely</option>
                    </select>
                    {e.flagged && (
                      <span className="wf-pii-flag-pill">
                        low conf · {(e.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      className="wf-pii-exbtn"
                      onClick={() => toggleExcluded(e.id)}
                      title={ex ? 'Re-include' : 'Skip this — leave as-is'}
                      aria-label={ex ? 'Re-include entity' : 'Exclude entity'}
                    >
                      {ex ? '↺' : '✕'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-3 px-1 py-2">
            <button type="button" className="wf-btn sm ghost">+ Add manual redaction</button>
            <span className="wf-sm" style={{ fontSize: 10.5 }}>
              Found something we missed? Add it here. We&apos;ll learn from your input.
            </span>
          </div>

          {/* Pipeline explainer */}
          <div className="wf-pii-explainer">
            <div className="wf-label bold mb-2">What happens next</div>
            <div className="wf-pii-pipeline">
              <PipeStep num="01" title="De-identify locally" sub="Mapping stored on your server. Never transmitted." />
              <div className="wf-pii-pipe-arrow">→</div>
              <PipeStep num="02" title="AI analyzes tokens only" sub={'"[STUDENT_001] showed reduced MLU…"'} />
              <div className="wf-pii-pipe-arrow">→</div>
              <PipeStep num="03" title="Re-identify in your view" sub={'"Mateo showed reduced MLU…" — only you see it.'} />
            </div>
          </div>

          {/* Footer */}
          <div className="wf-pii-footer">
            <button type="button" className="wf-btn ghost" onClick={onBack}>
              ← Back to triage
            </button>
            <div className="flex items-center gap-3">
              <span className="wf-sm" style={{ fontSize: 10.5 }}>
                <span style={{ color: '#6b8a55' }}>✓</span> All entities reviewed
              </span>
              <button type="button" className="wf-btn primary" onClick={onContinue}>
                Confirm &amp; analyze {activeCount} entit{activeCount === 1 ? 'y' : 'ies'} →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function Stat({ num, label, warn }: { num: number; label: React.ReactNode; warn?: boolean }) {
  return (
    <div className={`wf-pii-stat ${warn ? 'warn' : ''}`}>
      <div className="wf-pii-stat-num">{num}</div>
      <div className="wf-pii-stat-label">{label}</div>
    </div>
  )
}

function PipeStep({ num, title, sub }: { num: string; title: string; sub: string }) {
  return (
    <div className="wf-pii-pipe-step">
      <div className="wf-pii-pipe-num">{num}</div>
      <div className="wf-pii-pipe-title">{title}</div>
      <div className="wf-pii-pipe-sub">{sub}</div>
    </div>
  )
}
