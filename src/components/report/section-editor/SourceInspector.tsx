'use client'

/**
 * Source inspector — right-side Sheet that resolves a paragraph's
 * `source` token into displayable provenance. The chevron in the
 * editor opens this panel.
 *
 * Source token shapes we know about today (see process-intake/route.ts):
 *   • free-form provenance string  e.g. "celf_prek.pdf p.4"
 *     → match the filename token against file_uploads for this report;
 *       show file metadata + extracted-text preview + the raw marker.
 *   • "ai:*"                       e.g. "ai:process-intake"
 *     → labelled AI provenance — we don't have per-paragraph file
 *       attribution yet, so we show the operation kind only.
 *   • "user" / "user:*"
 *     → "edited by clinician" note.
 *   • anything else                → fall back to raw token display.
 */

import { useEffect, useState } from 'react'
import { FileText, FileAudio, FileImage, File as FileIcon, Loader2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { createBrowserSupabase } from '@/lib/supabase/browser'

interface FileRow {
  id: string
  filename: string
  file_type: string
  file_size: number | null
  storage_path: string | null
  extracted_text: string | null
  created_at: string
}

interface ParsedSource {
  kind: 'file' | 'ai' | 'user' | 'unknown'
  filename?: string
  marker?: string
  raw: string
}

const FILE_EXT_RE = /([A-Za-z0-9_\-.\s]+?\.(?:pdf|txt|md|png|jpg|jpeg|webp|gif|mp3|m4a|wav|aac|ogg|flac))/i

export function parseSource(raw: string): ParsedSource {
  const trimmed = raw.trim()
  if (!trimmed) return { kind: 'unknown', raw }
  if (trimmed.startsWith('ai:') || trimmed === 'ai') {
    return { kind: 'ai', raw: trimmed }
  }
  if (trimmed === 'user' || trimmed.startsWith('user:')) {
    return { kind: 'user', raw: trimmed }
  }
  const m = trimmed.match(FILE_EXT_RE)
  if (m) {
    const filename = m[1].trim()
    const after = trimmed.slice((m.index ?? 0) + m[1].length).trim()
    return {
      kind: 'file',
      filename,
      marker: after || undefined,
      raw: trimmed,
    }
  }
  return { kind: 'unknown', raw: trimmed }
}

interface SourceInspectorProps {
  open: boolean
  onOpenChange: (next: boolean) => void
  sourceRef: string | null
  reportId: string
}

export default function SourceInspector(props: SourceInspectorProps) {
  const { open, onOpenChange, sourceRef, reportId } = props
  const parsed = sourceRef ? parseSource(sourceRef) : null

  const [file, setFile] = useState<FileRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const p = sourceRef ? parseSource(sourceRef) : null
    if (!p || p.kind !== 'file' || !p.filename) {
      setFile(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    const supabase = createBrowserSupabase()
    supabase
      .from('file_uploads')
      .select('id, filename, file_type, file_size, storage_path, extracted_text, created_at')
      .eq('report_id', reportId)
      .ilike('filename', p.filename)
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setError(error.message)
          setFile(null)
        } else {
          setFile(data as FileRow | null)
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, reportId, sourceRef])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b" style={{ borderColor: 'var(--line-2)' }}>
          <SheetTitle className="wf-heading" style={{ fontSize: 18 }}>
            Source
          </SheetTitle>
          <SheetDescription className="wf-sm" style={{ color: 'var(--ink-2)' }}>
            Where this point came from.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!parsed && <EmptyState />}
          {parsed?.kind === 'ai' && <AISource raw={parsed.raw} />}
          {parsed?.kind === 'user' && <UserSource raw={parsed.raw} />}
          {parsed?.kind === 'unknown' && <UnknownSource raw={parsed.raw} />}
          {parsed?.kind === 'file' && (
            <FileSource
              parsed={parsed}
              file={file}
              loading={loading}
              error={error}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function EmptyState() {
  return (
    <p className="wf-sm" style={{ color: 'var(--ink-2)' }}>
      No source attached to this point.
    </p>
  )
}

function AISource({ raw }: { raw: string }) {
  const operation = raw.replace(/^ai:?/, '') || 'unknown'
  return (
    <div className="space-y-3">
      <div className="wf-label" style={{ color: 'var(--terracotta-ink)' }}>
        AI-generated
      </div>
      <p className="wf-sm" style={{ color: 'var(--ink-1)' }}>
        This point was extracted by the {operation || 'AI'} pipeline. We
        don't currently track which specific files contributed to this
        paragraph — the attribution is at the operation level.
      </p>
      <Field label="Token" value={raw} mono />
    </div>
  )
}

function UserSource({ raw }: { raw: string }) {
  return (
    <div className="space-y-3">
      <div className="wf-label" style={{ color: 'var(--terracotta-ink)' }}>
        Clinician edit
      </div>
      <p className="wf-sm" style={{ color: 'var(--ink-1)' }}>
        Authored or edited directly in the editor. No external evidence
        is attached.
      </p>
      {raw !== 'user' && <Field label="Note" value={raw} mono />}
    </div>
  )
}

function UnknownSource({ raw }: { raw: string }) {
  return (
    <div className="space-y-3">
      <div className="wf-label">Unrecognized provenance</div>
      <p className="wf-sm" style={{ color: 'var(--ink-1)' }}>
        We couldn't resolve this token to a known evidence source. The
        raw value is shown below.
      </p>
      <Field label="Token" value={raw} mono />
    </div>
  )
}

function FileSource(props: {
  parsed: ParsedSource
  file: FileRow | null
  loading: boolean
  error: string | null
}) {
  const { parsed, file, loading, error } = props
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <FileTypeIcon type={file?.file_type ?? extFromName(parsed.filename ?? '')} />
        <div className="min-w-0 flex-1">
          <div className="wf-label" style={{ color: 'var(--terracotta-ink)' }}>
            File evidence
          </div>
          <div
            className="truncate"
            style={{
              fontFamily: 'var(--font-display, var(--font-serif, serif))',
              fontSize: 17,
              color: 'var(--ink-1)',
            }}
            title={parsed.filename}
          >
            {parsed.filename}
          </div>
          {parsed.marker && (
            <div
              className="wf-sm mt-0.5"
              style={{ color: 'var(--ink-2)', fontFamily: 'var(--font-mono)' }}
            >
              {parsed.marker}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 wf-sm" style={{ color: 'var(--ink-2)' }}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Looking up file…
        </div>
      )}

      {error && (
        <p className="wf-sm" style={{ color: 'var(--terracotta)' }}>
          Couldn't load file metadata: {error}
        </p>
      )}

      {!loading && !error && !file && (
        <p className="wf-sm" style={{ color: 'var(--ink-2)' }}>
          The AI cited this filename but no matching file was found on the
          report. It may have been deleted, or the citation may have been
          paraphrased rather than exact.
        </p>
      )}

      {file && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <Field label="Type" value={file.file_type} />
            <Field label="Size" value={formatSize(file.file_size)} />
            <Field
              label="Uploaded"
              value={new Date(file.created_at).toLocaleDateString()}
            />
          </div>

          {file.extracted_text && (
            <div>
              <div className="wf-label mb-1.5">Extracted text</div>
              <div
                className="wf-box max-h-64 overflow-y-auto whitespace-pre-wrap"
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  color: 'var(--ink-1)',
                  fontFamily: 'var(--font-mono)',
                  padding: 12,
                }}
              >
                {file.extracted_text.slice(0, 4000)}
                {file.extracted_text.length > 4000 && '\n…'}
              </div>
            </div>
          )}

          <Field label="Raw provenance" value={parsed.raw} mono />
        </div>
      )}
    </div>
  )
}

// ── small bits ─────────────────────────────────────────────────────────

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="wf-label">{label}</div>
      <div
        className="break-words"
        style={{
          fontSize: 13,
          color: 'var(--ink-1)',
          fontFamily: mono ? 'var(--font-mono)' : undefined,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function FileTypeIcon({ type }: { type: string }) {
  const t = type.toLowerCase()
  const common = { className: 'h-5 w-5 mt-1', style: { color: 'var(--terracotta)' } } as const
  if (t.includes('pdf') || t === 'application/pdf') return <FileText {...common} />
  if (t.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(t))
    return <FileImage {...common} />
  if (t.startsWith('audio/') || ['mp3', 'm4a', 'wav', 'aac', 'ogg', 'flac'].includes(t))
    return <FileAudio {...common} />
  return <FileIcon {...common} />
}

function extFromName(name: string): string {
  const i = name.lastIndexOf('.')
  return i === -1 ? '' : name.slice(i + 1)
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
