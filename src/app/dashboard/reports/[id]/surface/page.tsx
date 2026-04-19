'use client'

import { useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useReport } from '@/lib/context/ReportContext'
import { EvidenceChip, fileKindFromType, type EvidenceKind } from '@/components/EvidenceChip'
import { ChevronDown } from 'lucide-react'

type InnerTab = 'outline' | 'canvas' | 'tray'

interface UploadedFile {
  id: string
  name?: string
  fileName?: string
  type?: string
}

type EnrichedFile = {
  id: string
  name: string
  kind: EvidenceKind
  sectionId: string | null
  method: 'norm-ref' | 'observation' | 'interview' | 'lang-sample' | 'record' | 'other'
  direction: 'toward' | 'against' | 'neutral' | 'unknown'
}

function deriveAssignment(name: string, kind: EvidenceKind, sections: Array<{ id: string; title: string }>): Omit<EnrichedFile, 'id' | 'name' | 'kind'> {
  const n = name.toLowerCase()
  const matchTitle = (regex: RegExp) => sections.find(s => regex.test(s.title.toLowerCase()))?.id ?? null

  let method: EnrichedFile['method'] = 'other'
  if (kind === 'pdf' && /test|celf|gfta|ppvt|evt|score/.test(n)) method = 'norm-ref'
  else if (kind === 'audio' || /obs/.test(n)) method = 'observation'
  else if (kind === 'note' || /email|intake|interview/.test(n)) method = 'interview'
  else if (/sample|transcript|mlu/.test(n)) method = 'lang-sample'
  else if (kind === 'pdf') method = 'record'

  let sectionId: string | null = null
  if (method === 'norm-ref') sectionId = matchTitle(/language|assessment|procedure/) ?? sections[2]?.id ?? null
  else if (method === 'observation') sectionId = matchTitle(/articulation|phonology|pragmatic/) ?? sections[3]?.id ?? null
  else if (method === 'interview') sectionId = matchTitle(/referral|background/) ?? sections[0]?.id ?? null
  else if (method === 'lang-sample') sectionId = matchTitle(/language|expressive/) ?? sections[4]?.id ?? null
  else sectionId = sections[0]?.id ?? null

  return { sectionId, method, direction: 'toward' }
}

export default function WorkingSurfacePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { report } = useReport()
  const [tab, setTab] = useState<InnerTab>('outline')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sections = report?.sections ?? []

  const files: EnrichedFile[] = useMemo(() => {
    const meta = (report?.metadata ?? {}) as Record<string, unknown>
    const raw = (meta.uploadedFiles as UploadedFile[] | undefined) ?? []
    if (!Array.isArray(raw)) return []
    return raw.map((f) => {
      const kind = fileKindFromType(f.type || '') as EvidenceKind
      const name = f.fileName || f.name || 'untitled'
      const assignment = deriveAssignment(name, kind, sections.map(s => ({ id: s.id, title: s.title })))
      return { id: f.id, name, kind, ...assignment }
    })
  }, [report, sections])

  const filesBySection = useMemo(() => {
    const map: Record<string, EnrichedFile[]> = {}
    files.forEach((f) => {
      if (f.sectionId) (map[f.sectionId] ??= []).push(f)
    })
    return map
  }, [files])

  const filledCount = Object.keys(filesBySection).length
  const totalSections = sections.length

  return (
    <div className="min-h-full bg-[var(--paper)] flex flex-col">
      <div className="px-6 pt-5 pb-3" style={{ borderBottom: '1.5px solid var(--line)' }}>
        <div className="wf-label">Working surface · {report?.title}</div>
        <h1 className="wf-heading" style={{ fontSize: 26, marginTop: 4 }}>Build the skeleton.</h1>
        <p className="wf-sm mt-1">
          Three views of the same underlying structure. Outline is the spine; Canvas is the spatial board; Tray is the evidence inbox docked left.
        </p>
      </div>

      {/* Inner tabs */}
      <div className="wf-inner-tabs">
        {([
          { id: 'outline', t: 'Outline', hint: 'collapsible spine' },
          { id: 'canvas', t: 'Canvas', hint: 'spatial board' },
          { id: 'tray', t: 'Tray rail', hint: 'evidence inbox docked' },
        ] as const).map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setTab(x.id)}
            className={`wf-inner-tab ${tab === x.id ? 'on' : ''}`}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14 }}>{x.t}</div>
            <div className="wf-sm">{x.hint}</div>
          </button>
        ))}
        <span className="ml-auto" />
        <div className="flex items-center gap-2 px-4">
          <span className="wf-pill terra">● {filledCount} of {totalSections} filled</span>
          <button
            type="button"
            className="wf-btn sm primary"
            onClick={() => {
              const first = sections[0]?.id
              if (first) router.push(`/dashboard/reports/${params.id}/${first}`)
            }}
          >
            Draft prose →
          </button>
        </div>
      </div>

      {tab === 'outline' && (
        <OutlineView
          sections={sections}
          filesBySection={filesBySection}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          onEdit={(sid) => router.push(`/dashboard/reports/${params.id}/${sid}`)}
        />
      )}

      {tab === 'canvas' && <CanvasStub />}

      {tab === 'tray' && (
        <TrayView sections={sections} files={files} filesBySection={filesBySection} />
      )}
    </div>
  )
}

// ─── Outline view ────────────────────────────────────────────────────────────

function OutlineView({
  sections,
  filesBySection,
  expandedId,
  setExpandedId,
  onEdit,
}: {
  sections: Array<{ id: string; title: string; sectionType?: string }>
  filesBySection: Record<string, EnrichedFile[]>
  expandedId: string | null
  setExpandedId: (id: string | null) => void
  onEdit: (sid: string) => void
}) {
  return (
    <div className="p-5">
      <div className="wf-outline wf-box" style={{ padding: 0 }}>
        {sections.map((s, i) => {
          const files = filesBySection[s.id] ?? []
          const filled = files.length > 0
          const open = expandedId === s.id
          const num = (i + 1).toString().padStart(2, '0')
          return (
            <div key={s.id} className={`wf-outline-item ${filled ? 'filled' : ''}`}>
              <button
                type="button"
                className="toggle"
                onClick={() => setExpandedId(open ? null : s.id)}
                aria-label={open ? 'Collapse' : 'Expand'}
              >
                <ChevronDown
                  className="h-3 w-3"
                  style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 120ms' }}
                />
              </button>
              <div className="num">{num}</div>
              <div className="body">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="title truncate">{s.title}</div>
                    <div className="sub">{s.sectionType?.replace(/_/g, ' ') || 'section'}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {filled ? (
                      <span className="wf-pill terra">● {files.length} source{files.length === 1 ? '' : 's'}</span>
                    ) : (
                      <span className="wf-pill">empty</span>
                    )}
                    <button type="button" className="wf-btn sm ghost" onClick={() => onEdit(s.id)}>✎</button>
                  </div>
                </div>

                {open && (
                  <>
                    {filled ? (
                      <div className="evidence-row">
                        {files.map((f) => (
                          <EvidenceChip key={f.id} kind={f.kind} name={f.name} meta={f.method} tone="tan" />
                        ))}
                      </div>
                    ) : (
                      <div className="droptarget">↳ drop evidence here — or route from triage</div>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
        {sections.length === 0 && (
          <div className="p-6 text-center wf-sm">No sections in this report.</div>
        )}
      </div>
    </div>
  )
}

// ─── Canvas stub ─────────────────────────────────────────────────────────────

function CanvasStub() {
  return (
    <div className="p-5">
      <div
        className="wf-box text-center"
        style={{ padding: 40, background: 'var(--paper-2)' }}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>
          Canvas · coming soon
        </div>
        <div className="wf-sm mb-4">
          A spatial board for dragging evidence chips onto section buckets with pan/zoom, wires, and auto-layout.
        </div>
        <div className="wf-hand accent" style={{ fontSize: 20 }}>
          preview once ROADMAP Phase 5 lands
        </div>
      </div>
    </div>
  )
}

// ─── Tray rail view ──────────────────────────────────────────────────────────

function TrayView({
  sections,
  files,
  filesBySection,
}: {
  sections: Array<{ id: string; title: string }>
  files: EnrichedFile[]
  filesBySection: Record<string, EnrichedFile[]>
}) {
  return (
    <div className="grid flex-1" style={{ gridTemplateColumns: '320px minmax(0, 1fr)' }}>
      <div className="wf-rail" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div className="flex items-baseline justify-between mb-3">
          <div className="wf-label bold">Evidence rail</div>
          <span className="wf-sm">{files.length} files</span>
        </div>
        <div className="flex flex-col gap-2">
          {files.map((f) => {
            const section = sections.find(s => s.id === f.sectionId)
            const sectionNum = section ? (sections.indexOf(section) + 1).toString().padStart(2, '0') : '—'
            return (
              <div key={f.id} className="wf-box" style={{ padding: '8px 10px' }}>
                <EvidenceChip kind={f.kind} name={f.name} />
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="wf-pill tan">§ {sectionNum}</span>
                  <span className="wf-pill">{f.method}</span>
                  <span className={`wf-pill ${f.direction === 'toward' ? 'terra' : f.direction === 'neutral' ? 'tan' : ''}`}>
                    {f.direction === 'toward' ? '▲ toward' :
                      f.direction === 'against' ? '▼ against' :
                        f.direction === 'neutral' ? '— neutral' : '? unknown'}
                  </span>
                </div>
              </div>
            )
          })}
          {files.length === 0 && (
            <div className="wf-sm">No files uploaded yet.</div>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="wf-label bold mb-2">Skeleton (read-only in tray mode)</div>
        <div className="wf-outline wf-box" style={{ padding: 0 }}>
          {sections.map((s, i) => {
            const count = (filesBySection[s.id] ?? []).length
            const num = (i + 1).toString().padStart(2, '0')
            return (
              <div key={s.id} className={`wf-outline-item ${count > 0 ? 'filled' : ''}`}>
                <div className="toggle" aria-hidden>
                  <ChevronDown className="h-3 w-3" style={{ transform: 'rotate(-90deg)' }} />
                </div>
                <div className="num">{num}</div>
                <div className="body">
                  <div className="title">{s.title}</div>
                </div>
                <span className={`wf-pill ${count > 0 ? 'terra' : ''}`}>
                  {count > 0 ? `● ${count}` : 'empty'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
