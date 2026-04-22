'use client'

import { useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useReport } from '@/lib/context/ReportContext'
import { EvidenceChip, fileKindFromType, type EvidenceKind } from '@/components/EvidenceChip'

/** Staged upload wizard — matches wireframe direction-staged.jsx StageUpload.
 * Local file queue → drag-drop or browse → per-file kind → context note → submit.
 * On submit, POSTs FormData to /api/ai/process-intake and advances to /pii. */

type StagedFile = { id: string; file: File }

interface ExistingFile {
  id: string
  name: string
  type?: string
  size?: number
  description?: string
  uploadDate?: string
}

const STEPS = [
  { n: '1', label: 'Upload evidence' },
  { n: '2', label: 'Analyze' },
  { n: '3', label: 'Review skeleton' },
  { n: '4', label: 'Draft prose' },
] as const

export default function UploadStagedPage() {
  const { id: reportId } = useParams<{ id: string }>()
  const router = useRouter()
  const { report } = useReport()

  const [staged, setStaged] = useState<StagedFile[]>([])
  const [context, setContext] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textInputRef = useRef<HTMLTextAreaElement>(null)

  const existing: ExistingFile[] = useMemo(() => {
    const raw = (report?.metadata as any)?.uploadedFiles
    return Array.isArray(raw) ? raw : []
  }, [report?.metadata])

  const addFiles = (fs: FileList | null | File[]) => {
    if (!fs) return
    const arr = Array.from(fs)
    if (arr.length === 0) return
    setStaged(prev => [
      ...prev,
      ...arr.map(f => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, file: f })),
    ])
    setError(null)
  }

  const removeStaged = (id: string) => {
    setStaged(prev => prev.filter(x => x.id !== id))
  }

  const handleSubmit = async () => {
    if (!report) return
    if (staged.length === 0 && !context.trim()) {
      setError('Add at least one file or describe the context before continuing.')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('reportId', reportId)
      const sectionIds = (report.sections || []).map(s => s.id)
      formData.append('sectionIds', JSON.stringify(sectionIds))
      formData.append('replace', 'false')
      formData.append('dryRun', 'false')
      formData.append('text', context)
      staged.forEach((s, i) => formData.append(`file_${i}`, s.file))

      const res = await fetch('/api/ai/process-intake', { method: 'POST', body: formData })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || `Upload failed (${res.status})`)
      }
      router.push(`/dashboard/reports/${reportId}/pii`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const totalQueued = staged.length + existing.length
  const estSeconds = Math.max(30, totalQueued * 8)
  const estDisplay = `${String(Math.floor(estSeconds / 60)).padStart(2, '0')}:${String(estSeconds % 60).padStart(2, '0')}`

  return (
    <div className="min-h-full bg-[var(--paper)]">
      {/* Stepper */}
      <div className="wf-stepper" role="navigation" aria-label="Upload wizard progress">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center gap-3">
            <div className={`step ${i === 0 ? 'active' : ''}`} aria-current={i === 0 ? 'step' : undefined}>
              <span className="num">{s.n}</span>
              <span>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="sep" />}
          </div>
        ))}
        <span className="ml-auto wf-sm">
          {report?.type ? `Template · ${report.type}` : 'Template · default'}
        </span>
      </div>

      <div className="max-w-5xl mx-auto px-10 py-8">
        {/* Header */}
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex flex-col gap-1">
            <div className="wf-label">Step 1</div>
            <h1 className="wf-heading" style={{ fontSize: 26 }}>
              Drop everything you have for this student.
            </h1>
            <p className="wf-sm" style={{ maxWidth: '62ch' }}>
              PDFs · audio · images · plain text · handwritten photos. All stays local until you hit
              submit — PII is reviewed on the next step before anything reaches AI.
            </p>
          </div>
          <span className="wf-pill tan">HIPAA · FERPA safe</span>
        </div>

        {/* Dropzone */}
        <div
          className={`wf-dropzone ${dragActive ? 'active' : ''}`}
          style={{ textAlign: 'center' }}
          onDragOver={e => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={e => {
            e.preventDefault()
            setDragActive(false)
            addFiles(e.dataTransfer?.files || null)
          }}
        >
          <div className="wf-hand accent" style={{ fontSize: 28, marginBottom: 10 }}>
            drop files here
          </div>
          <div className="wf-sm">or</div>
          <div className="flex gap-2 justify-center mt-3 flex-wrap">
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,.pdf,audio/*,.docx,.csv,.txt,.md,.html,.rtf"
              onChange={e => {
                addFiles(e.target.files)
                e.target.value = ''
              }}
            />
            <button type="button" className="wf-btn sm" onClick={() => inputRef.current?.click()}>
              📄 Browse
            </button>
            <button
              type="button"
              className="wf-btn sm ghost"
              onClick={() => textInputRef.current?.focus()}
            >
              ✏ Type note
            </button>
          </div>
          <div className="wf-sm mt-3" style={{ fontSize: 10.5 }}>
            Up to 25 files · 50 MB each · audio under 60 min.
          </div>
        </div>

        {/* Queue */}
        {totalQueued > 0 && (
          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <div className="wf-label bold">
                Queued · {totalQueued} file{totalQueued === 1 ? '' : 's'}
              </div>
              <span className="wf-sm">Est. analysis time ~{estDisplay}</span>
            </div>

            <div className="flex gap-2 flex-wrap mt-2.5">
              {existing.map(f => {
                const kind: EvidenceKind = fileKindFromTypeOrExt(f.type, f.name)
                return (
                  <EvidenceChip
                    key={`e-${f.id}`}
                    kind={kind}
                    name={f.name}
                    meta={f.description || 'already uploaded'}
                    tone="tan"
                    title="Already uploaded in a previous session"
                  />
                )
              })}
              {staged.map(s => (
                <div key={s.id} className="relative group">
                  <EvidenceChip
                    kind={fileKindFromType(s.file.type)}
                    name={s.file.name}
                    meta={formatFileSize(s.file.size)}
                    tone="default"
                  />
                  <button
                    type="button"
                    onClick={() => removeStaged(s.id)}
                    aria-label={`Remove ${s.file.name} from queue`}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[var(--terracotta-ink)] text-white text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="wf-divider my-5" />

        {/* Context */}
        <div className="flex flex-col gap-2">
          <label className="wf-label bold" htmlFor="intake-context">
            Tell Linguosity the context <span style={{ color: 'var(--ink-4)' }}>(optional)</span>
          </label>
          <textarea
            id="intake-context"
            ref={textInputRef}
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder='e.g., "Initial eval, 2nd grade, referred by teacher for intelligibility concerns."'
            className="wf-box"
            style={{
              minHeight: 80,
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--ink)',
              lineHeight: 1.5,
              resize: 'vertical',
              background: 'var(--card-surface)',
            }}
          />
        </div>

        {error && (
          <div className="wf-flag warn mt-3" role="alert">
            <span className="wf-flag-glyph">!</span>
            <span>{error}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            className="wf-btn ghost"
            onClick={() => router.push(`/dashboard/reports/${reportId}`)}
            disabled={uploading}
          >
            Save draft
          </button>
          <button
            type="button"
            className="wf-btn primary"
            onClick={handleSubmit}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <span
                  className="wf-spinner"
                  style={{ width: 14, height: 14, borderWidth: 2, marginRight: 6 }}
                  aria-hidden="true"
                />
                Uploading…
              </>
            ) : (
              <>Submit for analysis →</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── helpers ────────────────────────────────────────────────────────────────

function formatFileSize(bytes?: number): string {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let size = bytes / 1024
  let i = 0
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[i]}`
}

function fileKindFromTypeOrExt(mime?: string, name?: string): EvidenceKind {
  if (mime) {
    const k = fileKindFromType(mime)
    if (k !== 'document') return k
  }
  const ext = (name || '').toLowerCase().split('.').pop() || ''
  if (['pdf'].includes(ext)) return 'pdf'
  if (['mp3', 'm4a', 'wav', 'webm', 'ogg', 'aac'].includes(ext)) return 'audio'
  if (['jpg', 'jpeg', 'png', 'heic', 'gif', 'webp'].includes(ext)) return 'image'
  if (['txt', 'md'].includes(ext)) return 'note'
  return 'document'
}
