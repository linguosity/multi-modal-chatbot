'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { EvidenceChip, fileKindFromType, type EvidenceKind } from '@/components/EvidenceChip'

export type LoadingFileStatus = 'queued' | 'working' | 'done' | 'failed'

export interface LoadingFile {
  id: string
  name: string
  kind: EvidenceKind
  line?: string
  status?: LoadingFileStatus
}

interface LoadingMomentProps {
  /** Visible when true — renders as full-screen overlay */
  active: boolean
  /** Files being analyzed */
  files: LoadingFile[]
  /** Optional SSE operation id to advance file progress */
  operationId?: string | null
  /** User-initiated skip */
  onSkip?: () => void
  /** User-initiated pause (currently informational) */
  onPause?: () => void
}

const CYCLE_TEXT: Array<{ title: string; sub: string }> = [
  { title: 'De-identifying source files', sub: 'PII stays on your server. The AI never sees real names, DOBs, or addresses.' },
  { title: 'Reading documents',           sub: 'Parsing PDFs, transcribing audio, OCR-ing photos.' },
  { title: 'Extracting findings',         sub: 'Pulling scores, quotes, observations, timestamps.' },
  { title: 'Classifying method + domain', sub: 'Tagging norm-ref vs. observation vs. interview.' },
  { title: 'Weighing direction',          sub: 'Does this evidence point toward or away from eligibility?' },
  { title: 'Drafting skeleton',           sub: 'Mapping triangulated findings to your template sections.' },
]

const AUTO_ADVANCE_MS = 1800 // fallback pace when no SSE signal arrives

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000)
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export function LoadingMoment({ active, files, operationId, onSkip, onPause }: LoadingMomentProps) {
  const [statuses, setStatuses] = useState<Record<string, LoadingFileStatus>>({})
  const [tick, setTick] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const lastProgressRef = useRef<number>(0)

  // Initialize statuses on activation
  useEffect(() => {
    if (!active) return
    const initial: Record<string, LoadingFileStatus> = {}
    files.forEach((f, i) => {
      initial[f.id] = f.status ?? (i === 0 ? 'working' : 'queued')
    })
    setStatuses(initial)
    setStartedAt(Date.now())
    lastProgressRef.current = Date.now()
  }, [active, files.length]) // intentionally only on activation / file-count change

  // Elapsed timer
  useEffect(() => {
    if (!active || startedAt == null) return
    const id = setInterval(() => setElapsedMs(Date.now() - startedAt), 250)
    return () => clearInterval(id)
  }, [active, startedAt])

  // Cycle "What Linguosity is doing" text
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setTick(t => t + 1), 900)
    return () => clearInterval(id)
  }, [active])

  // Fallback auto-advance if no SSE progress in AUTO_ADVANCE_MS
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      const sinceLast = Date.now() - lastProgressRef.current
      if (sinceLast < AUTO_ADVANCE_MS) return
      setStatuses(prev => {
        const next = { ...prev }
        const workingId = files.find(f => next[f.id] === 'working')?.id
        if (!workingId) return prev
        next[workingId] = 'done'
        const nextQueuedIdx = files.findIndex(f => next[f.id] === 'queued')
        if (nextQueuedIdx >= 0) next[files[nextQueuedIdx].id] = 'working'
        lastProgressRef.current = Date.now()
        return next
      })
    }, 500)
    return () => clearInterval(id)
  }, [active, files])

  // Subscribe to SSE if operationId provided. Each `data:` payload is a
  // typed ProgressEvent — file events advance the per-file feed, other
  // kinds just keep the watchdog timer fresh so the auto-advance
  // fallback doesn't fire spuriously.
  useEffect(() => {
    if (!active || !operationId) return
    const es = new EventSource(`/api/stream/${operationId}`)
    es.onmessage = (evt) => {
      lastProgressRef.current = Date.now()
      const raw = String(evt?.data || '').trim()
      if (!raw) return
      let parsed: { kind?: string; filename?: string; status?: string } | null = null
      try {
        parsed = JSON.parse(raw)
      } catch {
        return
      }
      if (!parsed || parsed.kind !== 'file') return

      const target = files.find((f) => f.name === parsed!.filename)
      if (!target) return

      setStatuses((prev) => {
        const next = { ...prev }
        if (parsed!.status === 'done' && next[target.id] === 'working') {
          next[target.id] = 'done'
          const nextQueuedIdx = files.findIndex((x) => next[x.id] === 'queued')
          if (nextQueuedIdx >= 0) next[files[nextQueuedIdx].id] = 'working'
        } else if (parsed!.status === 'failed') {
          next[target.id] = 'failed'
          const nextQueuedIdx = files.findIndex((x) => next[x.id] === 'queued')
          if (nextQueuedIdx >= 0) next[files[nextQueuedIdx].id] = 'working'
        }
        return next
      })
    }
    es.onerror = () => { /* stream may close naturally */ }
    return () => es.close()
  }, [active, operationId, files])

  const done = useMemo(() => files.filter(f => statuses[f.id] === 'done').length, [files, statuses])
  const total = files.length
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const cycle = CYCLE_TEXT[tick % CYCLE_TEXT.length]
  const estSeconds = Math.max(45, total * 8)
  const estDisplay = `${String(Math.floor(estSeconds / 60)).padStart(2, '0')}:${String(estSeconds % 60).padStart(2, '0')}`

  if (!active) return null

  return (
    <div
      className="fixed inset-0 z-[60] bg-[var(--paper-2)] overflow-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-moment-title"
      aria-describedby="loading-moment-description"
    >
      <div className="max-w-6xl mx-auto px-10 py-10">
        {/* Headline */}
        <div className="flex items-baseline justify-between mb-6">
          <div className="flex flex-col gap-1">
            <div className="wf-label">Step 2</div>
            <div id="loading-moment-title" className="wf-heading" style={{ fontSize: 30 }}>
              Reading <span style={{ color: 'var(--terracotta)' }}>{total} source{total === 1 ? '' : 's'}</span>.
            </div>
            <div id="loading-moment-description" className="wf-sm">This takes about {estDisplay}. Feel free to grab coffee — we'll ping you when the skeleton's ready.</div>
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            <span className="wf-pill terra">● running locally</span>
            <div className="wf-ticker">elapsed {formatElapsed(elapsedMs)} · est {estDisplay}</div>
          </div>
        </div>

        {/* Big progress bar */}
        <div>
          <div className="wf-bar" style={{ height: 14, borderRadius: 3 }}>
            <span style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between mt-2 wf-ticker" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <span>{done} / {total} sources</span>
            <span>{pct}%</span>
          </div>
        </div>

        {/* Live feed + sidebar */}
        <div className="grid gap-8 mt-8" style={{ gridTemplateColumns: '1fr 340px' }}>
          <div className="flex flex-col gap-2">
            <div className="wf-label bold" id="loading-moment-feed-label">Live feed</div>
            {/* aria-live: screen readers announce each file's state change */}
            <div
              className="wf-box"
              style={{ padding: 0 }}
              role="log"
              aria-live="polite"
              aria-labelledby="loading-moment-feed-label"
            >
              {files.map((f, i) => {
                const status = statuses[f.id] ?? 'queued'
                const isDone = status === 'done'
                const isWorking = status === 'working'
                const isFailed = status === 'failed'
                return (
                  <div
                    key={f.id}
                    className="flex items-center gap-3"
                    style={{
                      padding: '10px 12px',
                      borderBottom: i < files.length - 1 ? '1px solid var(--line-2)' : 'none',
                      opacity: status === 'queued' ? 0.4 : 1,
                      background: isWorking ? '#fff5ee' : 'transparent',
                      transition: 'opacity 200ms, background 200ms',
                    }}
                  >
                    <EvidenceChip kind={f.kind} name={f.name} tone={isDone ? 'terra' : 'default'} />
                    <div className="flex-1 min-w-0">
                      <div className="wf-sm" style={{ color: 'var(--ink-2)' }}>{f.line || (isDone ? 'done' : isWorking ? 'analyzing…' : 'queued')}</div>
                    </div>
                    <div style={{ width: 140, display: 'flex', justifyContent: 'flex-end' }}>
                      {isDone && <span className="wf-pill terra">✓ done</span>}
                      {isWorking && (
                        <div className="flex items-center gap-2">
                          <div className="wf-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                          <span className="wf-ticker">working…</span>
                        </div>
                      )}
                      {isFailed && <span className="wf-pill" style={{ color: '#8a3030', borderColor: '#8a3030', background: '#fbe7e3' }}>✕ failed</span>}
                      {status === 'queued' && <span className="wf-sm">queued</span>}
                    </div>
                  </div>
                )
              })}
              {files.length === 0 && (
                <div className="wf-sm" style={{ padding: '14px 12px' }}>No files queued.</div>
              )}
            </div>
          </div>

          {/* What Linguosity is doing — sidebar */}
          <div className="flex flex-col gap-3">
            <div className="wf-label bold" id="loading-moment-cycle-label">What Linguosity is doing</div>
            <div
              className="wf-box tan"
              style={{ padding: 14 }}
              aria-live="polite"
              aria-atomic="true"
              aria-labelledby="loading-moment-cycle-label"
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, lineHeight: 1.2 }}>
                {cycle.title}…
              </div>
              <div className="wf-sm" style={{ marginTop: 6 }}>{cycle.sub}</div>
              <div className="wf-bar indeterm" style={{ marginTop: 12 }} aria-hidden="true"><span /></div>
            </div>

            <div className="wf-hand" style={{ textAlign: 'center', marginTop: 6 }}>
              you can safely close this tab — we'll ping you ✉
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-between items-center mt-8">
          <button type="button" className="wf-btn ghost sm" onClick={onPause} disabled={!onPause}>
            ⏸ pause
          </button>
          <button type="button" className="wf-btn" onClick={onSkip} disabled={!onSkip}>
            Skip ahead → skeleton
          </button>
        </div>
      </div>
    </div>
  )
}

export { fileKindFromType }
