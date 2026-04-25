'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useCallback, useEffect } from 'react'
import { useReport } from '@/lib/context/ReportContext'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { useAutosave } from '@/lib/hooks/useAutosave'
import { motion } from 'framer-motion'
import SectionEditor from '@/components/report/section-editor/SectionEditor'
import SourceInspector from '@/components/report/section-editor/SourceInspector'
import {
  contentToTree,
  interpolateTokens,
  treeToContent,
} from '@/components/report/section-editor/content-adapter'
import type { SectionTree } from '@/components/report/section-editor/types'

import { useToast } from '@/lib/context/ToastContext'

import SourcesGrid from '@/components/SourcesGrid'
import { useKeyboardNavigation } from '@/lib/context/NavigationContext'
import type { Json } from '@/lib/types/json'

export default function SectionPage() {
  const { id: reportId, sectionId } = useParams<{ id: string; sectionId: string }>()
  const router = useRouter()
  const { report, updateSectionData } = useReport()
  const [sectionContent, setSectionContent] = useState('')
  const [structuredData, setStructuredData] = useState<Json>({})
  const [proseTree, setProseTree] = useState<SectionTree | null>(null)

  const [isNavigating, setIsNavigating] = useState(false)
  const [activeSource, setActiveSource] = useState<string | null>(null)
  const { showAIUpdateToast } = useToast()

  const openSource = useCallback((ref: string) => setActiveSource(ref), [])
  const closeSource = useCallback((next: boolean) => {
    if (!next) setActiveSource(null)
  }, [])

  const section = report?.sections.find((s) => s.id === sectionId)
  const currentIndex = report?.sections.findIndex((s) => s.id === sectionId) ?? -1
  const prevSection = currentIndex > 0 ? report?.sections[currentIndex - 1] : null
  const nextSection =
    currentIndex < (report?.sections.length ?? 0) - 1
      ? report?.sections[currentIndex + 1]
      : null

  useKeyboardNavigation(
    report?.sections.map((s) => ({
      id: s.id,
      title: s.title,
      status: s.isCompleted ? 'completed' : 'not-started',
      isRequired: s.isRequired,
    })) || [],
    sectionId,
  )

  // Bootstrap local state from the report-context section record.
  useEffect(() => {
    if (!section) return
    setSectionContent(section.content || '')
    setStructuredData(section.structured_data || {})
  }, [section])

  // Rebuild the section tree whenever we switch to a different section. We
  // re-init only on section.id change — subsequent content updates that
  // originate from our own editor onChange run through setSectionContent
  // only, so ids stay stable across in-session edits.
  //
  // Interpolation applies here, at the client-side load boundary, because
  // the server RSC payload hands us `content: ""` and the real template
  // string arrives via Supabase client fetch. Running substitution here
  // ensures `{first_name}` etc. get replaced with structured_data before
  // the tree is built. Tradeoff: once the clinician saves, the resolved
  // values become canonical in `content` and the original {token} is
  // lost from that row. Acceptable for intake-style reports; a future
  // token-preserving render layer can reverse this if a section is
  // re-generated from source data.
  useEffect(() => {
    if (!section) return
    const ctx: Record<string, unknown> = {
      ...((section.structured_data as Record<string, unknown>) || {}),
      student_name:
        (section.structured_data as { first_name?: string; last_name?: string } | null)?.first_name &&
        (section.structured_data as { first_name?: string; last_name?: string } | null)?.last_name
          ? `${(section.structured_data as { first_name: string }).first_name} ${(section.structured_data as { last_name: string }).last_name}`
          : undefined,
    }
    const interpolated = interpolateTokens(section.content || '', ctx)
    setProseTree(contentToTree(interpolated))
  }, [section?.id])

  // Merge in external content updates (e.g. AI processing) when the
  // section changes under us.
  useEffect(() => {
    if (!report || !section) return
    const updated = report.sections.find((s) => s.id === sectionId)
    if (!updated) return
    if (updated.content !== section.content) {
      setSectionContent(updated.content || '')
    }
    if (updated.structured_data !== section.structured_data) {
      setStructuredData(updated.structured_data || {})
    }
  }, [report, sectionId, section])

  const handleContentChange = useCallback((newContent: string) => {
    setSectionContent(newContent)
  }, [])

  const handleProseTreeChange = useCallback(
    (next: SectionTree) => {
      setProseTree(next)
      handleContentChange(treeToContent(next))
    },
    [handleContentChange],
  )

  const saveSection = useCallback(
    async (showToast = false) => {
      if (!report) return
      updateSectionData(sectionId, structuredData, sectionContent)
      if (showToast) {
        showAIUpdateToast([], [], 'Section saved successfully')
      }
    },
    [report, sectionId, sectionContent, structuredData, updateSectionData, showAIUpdateToast],
  )

  const { hasUnsavedChanges } = useAutosave({
    data: { content: sectionContent, structuredData },
    onSave: async () => await saveSection(false),
    debounceMs: 3000,
    enabled: !!section,
  })

  // Save on navigation / tab-hide.
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasUnsavedChanges) saveSection(false)
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges) {
        saveSection(false)
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [hasUnsavedChanges, saveSection])

  // Cmd/Ctrl+S.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (hasUnsavedChanges) saveSection(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [saveSection, hasUnsavedChanges])

  const navigateToSection = (targetSectionId: string) => {
    setIsNavigating(true)
    setTimeout(() => {
      router.push(`/dashboard/reports/${reportId}/${targetSectionId}`)
    }, 50)
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center h-full bg-[var(--paper)]">
        <div className="wf-box text-center max-w-md">
          <div className="wf-label mb-2">404</div>
          <h2 className="wf-heading mb-2" style={{ fontSize: 20 }}>Report not found.</h2>
          <p className="wf-sm">The requested report could not be loaded.</p>
        </div>
      </div>
    )
  }

  if (!section) {
    return (
      <div className="flex items-center justify-center h-full bg-[var(--paper)]">
        <div className="wf-box text-center max-w-md">
          <div className="wf-label mb-2">404</div>
          <h2 className="wf-heading mb-2" style={{ fontSize: 20 }}>Section not found.</h2>
          <p className="wf-sm">The requested section could not be found.</p>
        </div>
      </div>
    )
  }

  // ── Unified block editor for every section. Structured schemas
  //    stay in context for future migration hooks but don't branch the
  //    render — the clinician works in the same outline/prose surface
  //    regardless of section kind. ──
  const uploadedFiles =
    ((report.metadata as { uploadedFiles?: UploadedFile[] })?.uploadedFiles ?? [])
      .map((f) => ({
        id: f.id,
        type: f.type as 'text' | 'pdf' | 'image' | 'audio',
        fileName: f.name,
        uploadDate: f.uploadDate,
        size: f.size,
        description: f.description,
      }))

  const sectionMeta = `Section ${(currentIndex + 1).toString().padStart(2, '0')} · ${report.title}`

  return (
    <div className="h-full w-full flex flex-col overflow-x-hidden bg-[var(--paper)]">
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <motion.div
          key={sectionId}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
          className="w-full"
        >
          <section className="relative w-full">
            <div className="w-full px-6 pt-8 pb-6">
              <div className="mx-auto max-w-3xl">
                {proseTree && (
                  <SectionEditor
                    key={section.id}
                    value={proseTree}
                    onChange={handleProseTreeChange}
                    label={section.title}
                    sectionMeta={sectionMeta}
                    sectionTitle={section.title}
                    onSourceClick={openSource}
                  />
                )}
              </div>
            </div>
          </section>
        </motion.div>

        {/* Sources panel — always visible below the editor on prose sections. */}
        <div className="py-6 flex items-center gap-3 px-6 bg-[var(--paper)]">
          <div className="h-px flex-1" style={{ background: 'var(--line-2)' }} />
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" style={{ color: 'var(--terracotta)' }} />
            <span className="wf-label bold" style={{ color: 'var(--terracotta-ink)' }}>
              Sources
            </span>
          </div>
          <div className="h-px flex-1" style={{ background: 'var(--line-2)' }} />
        </div>
        <div className="bg-[var(--paper)] w-full pb-6">
          <div className="w-full overflow-x-hidden px-6">
            <SourcesGrid sources={uploadedFiles} reportId={reportId} sectionId={sectionId} />
          </div>
        </div>
      </div>

      <SectionNavStrip
        prevSection={prevSection ?? null}
        nextSection={nextSection ?? null}
        onNavigate={navigateToSection}
        disabled={isNavigating}
        variant="rich"
        currentIndex={currentIndex}
        totalSections={report.sections.length}
      />

      <SourceInspector
        open={activeSource !== null}
        onOpenChange={closeSource}
        sourceRef={activeSource}
        reportId={reportId}
      />
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────

interface UploadedFile {
  id: string
  type: string
  name: string
  uploadDate: string
  size: number
  description?: string
}

interface NavStripProps {
  prevSection: { id: string; title: string } | null
  nextSection: { id: string; title: string } | null
  onNavigate: (id: string) => void
  disabled: boolean
  variant?: 'compact' | 'rich'
  currentIndex?: number
  totalSections?: number
}

function SectionNavStrip(props: NavStripProps) {
  const { prevSection, nextSection, onNavigate, disabled, variant = 'compact' } = props
  if (!prevSection && !nextSection) return null

  if (variant === 'rich') {
    return (
      <div
        className="bg-[var(--paper-2)] px-5 py-2"
        style={{ borderTop: '1px solid var(--line-2)' }}
      >
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => prevSection && onNavigate(prevSection.id)}
            disabled={!prevSection || disabled}
            className="wf-btn sm ghost"
          >
            <ChevronLeft className="h-3 w-3" />
            <span className="truncate max-w-[220px]">{prevSection?.title || 'Previous'}</span>
          </button>
          {typeof props.currentIndex === 'number' && typeof props.totalSections === 'number' && (
            <div className="wf-ticker">
              Section {props.currentIndex + 1} / {props.totalSections}
            </div>
          )}
          <button
            type="button"
            onClick={() => nextSection && onNavigate(nextSection.id)}
            disabled={!nextSection || disabled}
            className="wf-btn sm ghost"
          >
            <span className="truncate max-w-[220px]">{nextSection?.title || 'Next'}</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-2">
      <button
        type="button"
        disabled={!prevSection || disabled}
        onClick={() => prevSection && onNavigate(prevSection.id)}
        className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[13px] text-gray-600 hover:bg-gray-50 disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
        {prevSection ? prevSection.title : 'First section'}
      </button>
      <button
        type="button"
        disabled={!nextSection || disabled}
        onClick={() => nextSection && onNavigate(nextSection.id)}
        className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[13px] text-gray-600 hover:bg-gray-50 disabled:opacity-40"
      >
        {nextSection ? nextSection.title : 'Last section'}
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}
