'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReport } from '@/lib/context/ReportContext'
import { EvidenceChip, fileKindFromType, type EvidenceKind } from '@/components/EvidenceChip'
import { ChevronDown } from 'lucide-react'

type Method = 'norm-ref' | 'observation' | 'interview' | 'lang-sample' | 'record' | 'other'
type Direction = 'toward' | 'against' | 'neutral' | 'unknown'
type TriageState = 'pending' | 'confirmed' | 'needs-review'

interface TriageRow {
  id: string
  name: string
  kind: EvidenceKind
  sectionId: string | null
  method: Method
  direction: Direction
  confidence: number
  state: TriageState
}

const METHOD_SET: ReadonlySet<Method> = new Set<Method>([
  'norm-ref', 'observation', 'interview', 'lang-sample', 'record', 'other',
])
const DIRECTION_SET: ReadonlySet<Direction> = new Set<Direction>([
  'toward', 'against', 'neutral', 'unknown',
])
const TRIAGE_STATE_SET: ReadonlySet<TriageState> = new Set<TriageState>([
  'pending', 'confirmed', 'needs-review',
])

interface TriageApiRow {
  id: string
  filename: string
  file_type: string
  suggested_section_id?: string | null
  confirmed_section_id?: string | null
  evidence_method?: string | null
  clinical_direction?: string | null
  classification_confidence?: number | null
  triage_state?: string | null
}

const DEBOUNCE_MS = 500

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const METHOD_LABELS: Record<Method, string> = {
  'norm-ref': 'norm-ref',
  observation: 'observation',
  interview: 'interview',
  'lang-sample': 'lang-sample',
  record: 'record',
  other: 'other',
}

const DIRECTION_OPTIONS: Direction[] = ['toward', 'against', 'neutral', 'unknown']

/**
 * Until the AI pipeline returns classifications, derive stable mock defaults
 * from file metadata so the triage UI is usable end-to-end.
 */
function deriveDefaults(name: string, kind: EvidenceKind, sections: Array<{ id: string; title: string }>): Pick<TriageRow, 'sectionId' | 'method' | 'direction' | 'confidence' | 'state'> {
  const n = name.toLowerCase()

  let method: Method = 'other'
  if (kind === 'pdf' && /test|celf|gfta|ppvt|evt|score/.test(n)) method = 'norm-ref'
  else if (kind === 'audio' || /obs/.test(n)) method = 'observation'
  else if (kind === 'note' || /email|intake|interview/.test(n)) method = 'interview'
  else if (/sample|transcript|mlu/.test(n)) method = 'lang-sample'
  else if (kind === 'pdf') method = 'record'

  let sectionId: string | null = null
  const matchTitle = (regex: RegExp) => sections.find(s => regex.test(s.title.toLowerCase()))?.id ?? null
  if (method === 'norm-ref') sectionId = matchTitle(/language|assessment|procedure/) ?? sections[2]?.id ?? null
  else if (method === 'observation') sectionId = matchTitle(/articulation|phonology|pragmatic/) ?? sections[3]?.id ?? null
  else if (method === 'interview') sectionId = matchTitle(/referral|background/) ?? sections[0]?.id ?? null
  else if (method === 'lang-sample') sectionId = matchTitle(/language|expressive/) ?? sections[4]?.id ?? null
  else sectionId = sections[0]?.id ?? null

  const confidence = 0.5 + Math.random() * 0.45
  const direction: Direction = confidence < 0.6 ? 'unknown' : 'toward'
  const state: TriageState = confidence < 0.55 ? 'needs-review' : 'pending'

  return { sectionId, method, direction, confidence, state }
}

function toTriageState(value: string | null | undefined): TriageState {
  return value && TRIAGE_STATE_SET.has(value as TriageState) ? (value as TriageState) : 'pending'
}

function toMethod(value: string | null | undefined): Method {
  return value && METHOD_SET.has(value as Method) ? (value as Method) : 'other'
}

function toDirection(value: string | null | undefined): Direction {
  return value && DIRECTION_SET.has(value as Direction) ? (value as Direction) : 'unknown'
}

/**
 * Shape an API row into the TriageRow the UI operates on. The DB may have
 * nulls for triage columns (pre-classification or missing migration); we fall
 * back to stable defaults for those.
 */
function apiRowToTriageRow(api: TriageApiRow): TriageRow {
  const kind = fileKindFromType(api.file_type || '') as EvidenceKind
  const sectionId = api.confirmed_section_id ?? api.suggested_section_id ?? null
  const confidenceRaw = typeof api.classification_confidence === 'number' ? api.classification_confidence : 0.7
  const confidence = Math.max(0, Math.min(1, confidenceRaw))
  return {
    id: api.id,
    name: api.filename || 'untitled',
    kind,
    sectionId,
    method: toMethod(api.evidence_method),
    direction: toDirection(api.clinical_direction),
    confidence,
    state: toTriageState(api.triage_state),
  }
}

interface UploadedFile {
  id: string
  name: string
  type?: string
  fileName?: string
}

export default function TriagePage() {
  const { report } = useReport()
  const reportId = report?.id

  const sections = report?.sections ?? []

  // Extract uploaded files from report metadata (same surface as SourcesGrid)
  const uploadedFiles: UploadedFile[] = useMemo(() => {
    const meta = (report?.metadata ?? {}) as Record<string, unknown>
    const raw = (meta.uploadedFiles as UploadedFile[] | undefined) ?? []
    return Array.isArray(raw) ? raw : []
  }, [report])

  const [rows, setRows] = useState<TriageRow[]>([])
  // `persist` is false when the rows come from the in-memory demo fallback
  // (report.metadata.uploadedFiles). In that case PATCH is a no-op because
  // the file IDs don't exist in file_uploads.
  const [persist, setPersist] = useState<boolean>(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [tick, setTick] = useState(0) // drives the "Saved Ns ago" label refresh

  // Pending changes waiting for the debounced flush.
  const dirtyRef = useRef<Map<string, { confirmed_section_id?: string | null; evidence_method?: Method; clinical_direction?: Direction; triage_state?: TriageState }>>(new Map())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Load rows on mount / report change ────────────────────────────────────
  useEffect(() => {
    if (!reportId) return
    let cancelled = false

    const buildFallback = (): TriageRow[] =>
      uploadedFiles.map((f) => {
        const kind = fileKindFromType(f.type || '') as EvidenceKind
        const defaults = deriveDefaults(
          f.fileName || f.name || '',
          kind,
          sections.map((s) => ({ id: s.id, title: s.title })),
        )
        return {
          id: f.id,
          name: f.fileName || f.name || 'untitled',
          kind,
          ...defaults,
        }
      })

    const load = async () => {
      try {
        const res = await fetch(`/api/reports/${reportId}/triage`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`triage fetch ${res.status}`)
        const json = (await res.json()) as { rows: TriageApiRow[]; degraded?: boolean }
        if (cancelled) return
        const apiRows = Array.isArray(json.rows) ? json.rows : []
        if (apiRows.length > 0 && !json.degraded) {
          setRows(apiRows.map(apiRowToTriageRow))
          setPersist(true)
        } else {
          // Empty DB or migration missing → use in-memory demo rows.
          setRows(buildFallback())
          setPersist(Boolean(json.degraded) ? false : apiRows.length > 0)
        }
      } catch (err) {
        if (cancelled) return
        console.warn('Triage load failed, falling back to metadata-only rows', err)
        setRows(buildFallback())
        setPersist(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId])

  // ── Debounced flush of dirty rows ─────────────────────────────────────────
  const flush = useCallback(async () => {
    if (!reportId) return
    const pending = dirtyRef.current
    if (pending.size === 0) return

    // Snapshot + clear immediately so concurrent edits queue the next flush.
    const updates = Array.from(pending.entries()).map(([fileId, patch]) => ({ fileId, ...patch }))
    pending.clear()

    if (!persist) {
      // In-memory mode — just mark as "saved" for UX parity without a round-trip.
      setSaveStatus('saved')
      setLastSavedAt(Date.now())
      return
    }

    setSaveStatus('saving')
    try {
      const res = await fetch(`/api/reports/${reportId}/triage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      if (res.status === 503) {
        // Migration missing — downgrade to in-memory mode so the UI still works.
        console.warn('Triage persistence unavailable (missing migration); switching to in-memory mode.')
        setPersist(false)
        setSaveStatus('error')
        return
      }
      if (!res.ok) throw new Error(`triage patch ${res.status}`)
      setSaveStatus('saved')
      setLastSavedAt(Date.now())
    } catch (err) {
      console.warn('Triage save failed', err)
      setSaveStatus('error')
    }
  }, [reportId, persist])

  const scheduleFlush = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      void flush()
    }, DEBOUNCE_MS)
  }, [flush])

  // Flush any pending writes on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
        void flush()
      }
    }
  }, [flush])

  // Tick the "saved Ns ago" label.
  useEffect(() => {
    if (!lastSavedAt) return
    const timer = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(timer)
  }, [lastSavedAt])

  const markDirty = useCallback((row: TriageRow) => {
    dirtyRef.current.set(row.id, {
      confirmed_section_id: row.state === 'confirmed' ? row.sectionId : null,
      evidence_method: row.method,
      clinical_direction: row.direction,
      triage_state: row.state,
    })
    scheduleFlush()
  }, [scheduleFlush])

  const updateRow = useCallback((id: string, patch: Partial<TriageRow>) => {
    setRows((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
      const updated = next.find((r) => r.id === id)
      if (updated) markDirty(updated)
      return next
    })
  }, [markDirty])

  const toggleConfirm = useCallback((id: string) => {
    setRows((prev) => {
      const next = prev.map((r) =>
        r.id === id ? { ...r, state: r.state === 'confirmed' ? ('pending' as TriageState) : ('confirmed' as TriageState) } : r
      )
      const updated = next.find((r) => r.id === id)
      if (updated) markDirty(updated)
      return next
    })
  }, [markDirty])

  const confirmedCount = rows.filter(r => r.state === 'confirmed').length
  const pendingCount = rows.filter(r => r.state === 'pending').length
  const needsReviewCount = rows.filter(r => r.state === 'needs-review').length

  const populatedSectionIds = useMemo(
    () => new Set(rows.filter(r => r.state === 'confirmed' && r.sectionId).map(r => r.sectionId!)),
    [rows]
  )

  const sectionChips = useMemo(() => {
    const map: Record<string, TriageRow[]> = {}
    rows.forEach(r => {
      if (r.state === 'confirmed' && r.sectionId) {
        ;(map[r.sectionId] ??= []).push(r)
      }
    })
    return map
  }, [rows])

  return (
    <div className="min-h-full bg-[var(--paper)]">
      <div className="px-6 pt-5 pb-3" style={{ borderBottom: '1.5px solid var(--line)' }}>
        <div className="wf-label">Step 3 · {report?.title}</div>
        <h1 className="wf-heading" style={{ fontSize: 26, marginTop: 4 }}>Triage evidence.</h1>
        <p className="wf-sm mt-1">
          Linguosity pre-classified each source by section, method, and direction. Confirm each row or reroute with the dropdowns. Confirmed chips flow into the skeleton on the right.
        </p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', minHeight: 'calc(100vh - 180px)' }}>
        {/* LEFT — triage table */}
        <div className="p-5 flex flex-col gap-3" style={{ borderRight: '1px solid var(--line-2)' }}>
          <div className="flex items-center justify-between">
            <div className="wf-heading" style={{ fontSize: 18 }}>Evidence inbox</div>
            <div className="flex items-center gap-2">
              <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} tick={tick} persist={persist} />
              <div className="flex gap-1.5">
                <span className="wf-pill terra">● {confirmedCount} confirmed</span>
                <span className="wf-pill tan">◐ {pendingCount} pending</span>
                {needsReviewCount > 0 && (
                  <span className="wf-pill" style={{ borderColor: 'var(--terracotta)', color: 'var(--terracotta-ink)', background: '#fff5ee' }}>
                    ! {needsReviewCount} review
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="wf-box" style={{ padding: 0 }}>
            {/* Header row */}
            <div
              className="flex items-center"
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid var(--line-2)',
                background: 'var(--paper-2)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--ink-3)',
              }}
            >
              <div style={{ flex: '0 0 220px' }}>Source</div>
              <div style={{ flex: '1 1 0' }}>Section</div>
              <div style={{ flex: '0 0 130px' }}>Method</div>
              <div style={{ flex: '0 0 110px' }}>Direction</div>
              <div style={{ flex: '0 0 70px', textAlign: 'right' }}>✓</div>
            </div>

            {rows.length === 0 && (
              <div className="p-6 text-center wf-sm">
                No evidence queued for this report yet. Upload files via AI intake to get started.
              </div>
            )}

            {rows.map((row) => {
              const bg =
                row.state === 'confirmed'
                  ? '#fbf8f1'
                  : row.state === 'needs-review'
                    ? '#fff5ee'
                    : 'transparent'
              return (
                <div
                  key={row.id}
                  className="flex items-center"
                  style={{ padding: '10px 12px', borderBottom: '1px solid var(--line-2)', background: bg }}
                >
                  {/* Source chip */}
                  <div style={{ flex: '0 0 220px' }}>
                    <EvidenceChip kind={row.kind} name={row.name} meta={`${Math.round(row.confidence * 100)}% conf`} />
                  </div>

                  {/* Section dropdown */}
                  <div style={{ flex: '1 1 0' }}>
                    <SectionSelect
                      value={row.sectionId ?? ''}
                      sections={sections.map(s => ({ id: s.id, title: s.title }))}
                      onChange={(val) => updateRow(row.id, { sectionId: val || null })}
                      warn={row.state === 'needs-review'}
                    />
                  </div>

                  {/* Method dropdown */}
                  <div style={{ flex: '0 0 130px' }}>
                    <MethodSelect
                      value={row.method}
                      onChange={(val) => updateRow(row.id, { method: val })}
                    />
                  </div>

                  {/* Direction pill (click to cycle) */}
                  <div style={{ flex: '0 0 110px' }}>
                    <DirectionPill
                      value={row.direction}
                      onChange={(val) => updateRow(row.id, { direction: val })}
                    />
                  </div>

                  {/* Confirm checkbox / review flag */}
                  <div style={{ flex: '0 0 70px', textAlign: 'right' }}>
                    {row.state === 'needs-review' ? (
                      <span
                        style={{
                          color: 'var(--terracotta)',
                          fontFamily: 'var(--font-hand)',
                          fontSize: 17,
                          cursor: 'pointer',
                        }}
                        onClick={() => updateRow(row.id, { state: 'pending' })}
                      >
                        review →
                      </span>
                    ) : (
                      <button
                        type="button"
                        aria-label={row.state === 'confirmed' ? 'Un-confirm' : 'Confirm'}
                        onClick={() => toggleConfirm(row.id)}
                        className="w-4 h-4 border-[1.5px] inline-block align-middle"
                        style={{
                          borderColor: 'var(--line)',
                          background: row.state === 'confirmed' ? 'var(--ink)' : 'var(--card-surface)',
                          position: 'relative',
                          cursor: 'pointer',
                        }}
                      >
                        {row.state === 'confirmed' && (
                          <span
                            style={{
                              position: 'absolute',
                              inset: 2,
                              borderLeft: '2px solid #fff',
                              borderBottom: '2px solid #fff',
                              transform: 'rotate(-45deg) translate(1px, -1px)',
                            }}
                          />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer: bulk actions */}
          {rows.length > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <button
                type="button"
                className="wf-btn sm"
                onClick={() => {
                  // Confirm every row with confidence ≥ 0.75 that is currently pending.
                  setRows((prev) => {
                    const next = prev.map((r) =>
                      r.state === 'pending' && r.confidence >= 0.75
                        ? { ...r, state: 'confirmed' as TriageState }
                        : r
                    )
                    next.forEach((r, idx) => {
                      if (r !== prev[idx]) markDirty(r)
                    })
                    return next
                  })
                }}
                disabled={!rows.some((r) => r.state === 'pending' && r.confidence >= 0.75)}
                title="Confirms every pending row with confidence ≥ 75%. Leaves low-confidence rows for review."
              >
                ✓ Confirm all high-confidence
              </button>
              <button
                type="button"
                className="wf-btn sm ghost"
                onClick={() => {
                  setRows((prev) => {
                    const next = prev.map((r) =>
                      r.state === 'confirmed' ? { ...r, state: 'pending' as TriageState } : r
                    )
                    next.forEach((r, idx) => {
                      if (r !== prev[idx]) markDirty(r)
                    })
                    return next
                  })
                }}
                disabled={confirmedCount === 0}
              >
                ↺ Unconfirm all
              </button>
              <span className="ml-auto" />
              <button
                type="button"
                className="wf-btn sm primary"
                disabled={confirmedCount === 0}
              >
                Send {confirmedCount} confirmed → skeleton ▸
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — skeleton preview */}
        <div className="p-5 flex flex-col gap-3" style={{ background: 'var(--paper-2)' }}>
          <div className="flex items-baseline justify-between">
            <div className="wf-heading" style={{ fontSize: 18 }}>Skeleton</div>
            <span className="wf-sm">{populatedSectionIds.size} of {sections.length} sections populated</span>
          </div>

          <div className="flex flex-col gap-2">
            {sections.map((s, i) => {
              const chips = sectionChips[s.id] ?? []
              const populated = chips.length > 0
              const num = (i + 1).toString().padStart(2, '0')
              return (
                <div
                  key={s.id}
                  className={`wf-box ${populated ? '' : 'dashed'}`}
                  style={{ padding: 12, background: populated ? 'var(--card-surface)' : 'transparent' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="wf-label">{num}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginTop: 2 }}>{s.title}</div>
                    </div>
                    {populated ? (
                      <span className="wf-pill terra">● filling</span>
                    ) : (
                      <span className="wf-pill">empty</span>
                    )}
                  </div>
                  {populated && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {chips.map(c => (
                        <EvidenceChip key={c.id} kind={c.kind} name={c.name} tone="tan" />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Inline subcomponents ────────────────────────────────────────────────────

function SectionSelect({
  value,
  sections,
  onChange,
  warn,
}: {
  value: string
  sections: Array<{ id: string; title: string }>
  onChange: (id: string) => void
  warn?: boolean
}) {
  return (
    <div
      className="inline-flex items-center gap-2 bg-[var(--card-surface)]"
      style={{
        padding: '5px 8px',
        fontSize: 12,
        fontFamily: 'var(--font-mono)',
        border: `1.25px solid ${warn ? 'var(--terracotta-ink)' : 'var(--line-2)'}`,
        borderRadius: 3,
        position: 'relative',
      }}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent outline-none appearance-none pr-5 cursor-pointer"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)' }}
      >
        <option value="">— unclassified —</option>
        {sections.map((s, i) => (
          <option key={s.id} value={s.id}>
            {(i + 1).toString().padStart(2, '0')} · {s.title}
          </option>
        ))}
      </select>
      <ChevronDown className="h-3 w-3 pointer-events-none absolute right-2" style={{ color: 'var(--ink-3)' }} />
    </div>
  )
}

function MethodSelect({ value, onChange }: { value: Method; onChange: (val: Method) => void }) {
  return (
    <div
      className="inline-flex items-center gap-2 bg-[var(--card-surface)]"
      style={{
        padding: '4px 7px',
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        border: '1.25px solid var(--line-2)',
        borderRadius: 3,
        position: 'relative',
      }}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Method)}
        className="bg-transparent outline-none appearance-none pr-5 cursor-pointer"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)' }}
      >
        {(Object.keys(METHOD_LABELS) as Method[]).map((m) => (
          <option key={m} value={m}>{METHOD_LABELS[m]}</option>
        ))}
      </select>
      <ChevronDown className="h-3 w-3 pointer-events-none absolute right-1.5" style={{ color: 'var(--ink-3)' }} />
    </div>
  )
}

function DirectionPill({ value, onChange }: { value: Direction; onChange: (val: Direction) => void }) {
  const cycle = () => {
    const idx = DIRECTION_OPTIONS.indexOf(value)
    const next = DIRECTION_OPTIONS[(idx + 1) % DIRECTION_OPTIONS.length]
    onChange(next)
  }
  const classes: Record<Direction, string> = {
    toward: 'wf-pill terra',
    against: 'wf-pill',
    neutral: 'wf-pill tan',
    unknown: 'wf-pill',
  }
  const labels: Record<Direction, string> = {
    toward: '▲ toward',
    against: '▼ against',
    neutral: '— neutral',
    unknown: '? unknown',
  }
  return (
    <button type="button" onClick={cycle} className={classes[value]} aria-label={`Direction: ${labels[value]}. Click to cycle.`}>
      {labels[value]}
    </button>
  )
}

function SaveIndicator({
  status,
  lastSavedAt,
  tick: _tick,
  persist,
}: {
  status: SaveStatus
  lastSavedAt: number | null
  tick: number
  persist: boolean
}) {
  if (status === 'saving') {
    return <span className="wf-ticker">Saving…</span>
  }
  if (status === 'error') {
    return <span className="wf-ticker" style={{ color: 'var(--terracotta-ink)' }}>Save failed · retry on next edit</span>
  }
  if (status === 'saved' && lastSavedAt) {
    const seconds = Math.max(0, Math.round((Date.now() - lastSavedAt) / 1000))
    const label = seconds < 2
      ? 'just now'
      : seconds < 60
        ? `${seconds}s ago`
        : `${Math.round(seconds / 60)}m ago`
    return <span className="wf-ticker">{persist ? 'Saved' : 'Saved locally'} · {label}</span>
  }
  if (!persist && status === 'idle') {
    return <span className="wf-ticker" style={{ color: 'var(--ink-3)' }}>in-memory · migration pending</span>
  }
  return null
}
