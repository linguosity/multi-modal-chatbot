'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { useReport } from '@/lib/context/ReportContext'
import { parseContentSections } from '@/lib/export/report-to-export-data'
import { useReportCardEditing } from '@/lib/hooks/useReportCardEditing'
import { hydrateSection } from '@/lib/render/hydrateSection'
import { REPORT_COLORS } from '@/lib/styles/report-card-colors'
import ReportHeaderCard from './report-header-card'
import ReportSectionCard from './report-section-card'
import SectionEditModal from './section-edit-modal'
import { Pencil, Eye, Loader2, Check, AlertCircle, Brain, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/lib/context/ToastContext'
import { useRecentUpdates } from '@/lib/context/RecentUpdatesContext'

import type { ExportSection, StudentInfo } from '@/lib/export/report-to-export-data'
import type { Report, Section } from '@/types/report-types'

interface WYSIWYGReportPreviewProps {
  initialMode?: 'edit' | 'view'
}

// ── Helpers ───────────────────────────────────────────────────────────

function sectionToExportSection(s: Section, reportMeta?: Record<string, any>): ExportSection {
  const rawContent = s.content || ''

  // Hydrate content to replace placeholders with actual data for preview display
  let hydratedContent = rawContent
  if (s.structured_data && Object.keys(s.structured_data).length > 0) {
    try {
      hydratedContent = hydrateSection({
        html: rawContent,
        data: s.structured_data as Record<string, any>,
        reportMeta,
      })
    } catch (error) {
      console.error('Error hydrating section content in preview:', error)
      hydratedContent = rawContent
    }
  }

  const { mainContent, subsections } = parseContentSections(hydratedContent)
  return {
    title: s.title,
    sectionType: s.sectionType,
    order: s.order,
    content: mainContent,
    subsections,
  }
}

function extractStudentInfo(report: Report): {
  student: StudentInfo
  evaluatorName: string
  evaluationDate: string
  reportDate: string
} {
  const meta = report.metadata as Record<string, unknown> | null
  const bio = meta?.studentBio as Record<string, string> | undefined
  const studentSection = report.sections.find(
    (s) => s.title === 'Student Information' || s.sectionType === 'student_information'
  )
  const sd = studentSection?.structured_data as Record<string, string> | undefined

  const student: StudentInfo = {
    name: (() => {
      // Try structured_data from Student Information section first
      const sdFirst = sd?.first_name || sd?.firstName || ''
      const sdLast = sd?.last_name || sd?.lastName || ''
      if (sdFirst || sdLast) return `${sdFirst} ${sdLast}`.trim()
      // Then try report metadata
      if (bio?.firstName || bio?.lastName) return `${bio?.firstName || ''} ${bio?.lastName || ''}`.trim()
      // Then try report-level student_name
      if (report.student_name) return report.student_name
      return 'Unknown Student'
    })(),
    id: report.student_id || bio?.studentId || undefined,
    grade: sd?.grade || sd?.grade_level || bio?.grade || undefined,
    dateOfBirth: sd?.date_of_birth || sd?.dateOfBirth || bio?.dateOfBirth || undefined,
    age: sd?.age || sd?.chronological_age || bio?.age || undefined,
    primaryLanguage: sd?.primary_languages || sd?.primaryLanguages || bio?.primaryLanguages || undefined,
    eligibility: sd?.eligibility_status || sd?.eligibilityStatus || bio?.eligibilityStatus || undefined,
  }

  // Format DOB if it's ISO format
  if (student.dateOfBirth && /^\d{4}-\d{2}-\d{2}/.test(student.dateOfBirth)) {
    try {
      student.dateOfBirth = new Date(student.dateOfBirth).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    } catch {}
  }

  const evaluatorName = sd?.evaluator_name
    ? `${sd.evaluator_name}${sd.evaluator_credentials ? ', ' + sd.evaluator_credentials : ''}`
    : report.evaluator_id || ''

  const createdAt = report.created_at || new Date().toISOString()
  const evaluationDate = sd?.evaluation_dates || sd?.report_date || createdAt

  const fmt = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch { return d }
  }

  return {
    student,
    evaluatorName,
    evaluationDate: fmt(evaluationDate),
    reportDate: fmt(new Date().toISOString()),
  }
}

function formatReportType(type: string): string {
  const types: Record<string, string> = {
    initial: 'Initial Eligibility Evaluation',
    annual: 'Annual Review',
    triennial: 'Triennial Evaluation',
    progress: 'Progress Report',
    exit: 'Exit Report',
    consultation: 'Consultation Report',
    other: 'Report',
  }
  return types[type] || type.charAt(0).toUpperCase() + type.slice(1)
}

// ── Save status badge ─────────────────────────────────────────────────

function SaveStatusBadge({ status }: { status: string }) {
  if (status === 'idle') return null
  return (
    <div className={cn(
      'flex items-center gap-1 text-xs px-2 py-1 rounded-full',
      status === 'saving' && 'bg-blue-50 text-blue-600',
      status === 'saved' && 'bg-green-50 text-green-600',
      status === 'error' && 'bg-red-50 text-red-600',
    )}>
      {status === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === 'saved' && <Check className="w-3 h-3" />}
      {status === 'error' && <AlertCircle className="w-3 h-3" />}
      <span className="capitalize">{status}</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────

export default function WYSIWYGReportPreview({
  initialMode = 'edit',
}: WYSIWYGReportPreviewProps) {
  const { report, updateSectionData, setReport, refreshReport } = useReport()
  const { showToast } = useToast()
  const { addRecentUpdate } = useRecentUpdates()
  const [mode, setMode] = useState<'edit' | 'view'>(initialMode)
  const isEditing = mode === 'edit'

  // ── Batch narrative generation state ─────────────────────────
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 })

  // ── Modal state ─────────────────────────────────────────────
  const [activeSectionIdx, setActiveSectionIdx] = useState<number | null>(null)

  // ── Sortable section order ──────────────────────────────────
  const filteredSections = useMemo(() => {
    if (!report) return []
    return report.sections
      .filter((s) => s.title !== 'Student Information' && s.sectionType !== 'student_information')
      .sort((a, b) => a.order - b.order)
  }, [report])

  const [orderedIds, setOrderedIds] = useState<string[]>(() =>
    filteredSections.map((s) => s.id)
  )

  useEffect(() => {
    const ids = filteredSections.map((s) => s.id)
    setOrderedIds((prev) => {
      const prevSet = new Set(prev)
      const newSet = new Set(ids)
      if (prevSet.size !== newSet.size || ids.some((id) => !prevSet.has(id))) {
        return ids
      }
      return prev
    })
  }, [filteredSections])

  const sectionById = useMemo(() => {
    const map = new Map<string, Section>()
    filteredSections.forEach((s) => map.set(s.id, s))
    return map
  }, [filteredSections])

  const orderedSections = useMemo(
    () => orderedIds.map((id) => sectionById.get(id)).filter(Boolean) as Section[],
    [orderedIds, sectionById]
  )

  const exportSections = useMemo(
    () => orderedSections.map((s) => sectionToExportSection(s, report?.metadata as Record<string, any> | undefined)),
    [orderedSections, report?.metadata]
  )

  // ── dnd-kit ─────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id || !report) return

      setOrderedIds((prev) => {
        const oldIdx = prev.indexOf(active.id as string)
        const newIdx = prev.indexOf(over.id as string)
        if (oldIdx === -1 || newIdx === -1) return prev
        const next = arrayMove(prev, oldIdx, newIdx)

        const updatedSections = report.sections.map((s) => {
          const posInOrdered = next.indexOf(s.id)
          if (posInOrdered !== -1) return { ...s, order: posInOrdered }
          return s
        })
        setReport({ ...report, sections: updatedSections })
        return next
      })
    },
    [report, setReport]
  )

  // ── Auto-save ───────────────────────────────────────────────
  const { saveStatus, updateField, save } = useReportCardEditing({
    debounceMs: 2000,
    onSave: async (edits) => {
      if (!report) return
      for (const [sectionId, fields] of edits) {
        const section = report.sections.find((s) => s.id === sectionId)
        if (!section) continue
        const newContent = fields.content ?? section.content ?? ''
        updateSectionData(sectionId, section.structured_data, newContent)
      }
    },
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        save()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [save])

  // ── Header info ─────────────────────────────────────────────
  const headerInfo = useMemo(() => {
    if (!report) return null
    return extractStudentInfo(report)
  }, [report])

  // ── Callbacks ───────────────────────────────────────────────

  const handleHeaderFieldChange = useCallback(
    (field: string, value: string) => {
      if (!report) return
      const updated = { ...report }
      if (field === 'evaluatorName') updated.evaluator_id = value
      setReport(updated)
    },
    [report, setReport]
  )

  const handleStudentFieldChange = useCallback(
    (field: keyof StudentInfo, value: string) => {
      if (!report) return
      const meta = (report.metadata || {}) as Record<string, unknown>
      const bio = (meta.studentBio || {}) as Record<string, string>
      const fieldMap: Record<string, string> = {
        name: 'firstName', grade: 'grade', dateOfBirth: 'dateOfBirth',
        age: 'age', primaryLanguage: 'primaryLanguages', eligibility: 'eligibilityStatus',
      }
      const bioField = fieldMap[field] || field
      setReport({
        ...report,
        metadata: { ...meta, studentBio: { ...bio, [bioField]: value } },
      })
    },
    [report, setReport]
  )

  // ── Modal edit handlers ─────────────────────────────────────

  const handleSectionTitleChange = useCallback(
    (sectionId: string, value: string) => updateField(sectionId, 'title', value),
    [updateField]
  )

  const handleSectionContentChange = useCallback(
    (sectionId: string, html: string) => updateField(sectionId, 'content', html),
    [updateField]
  )

  const handleSubsectionChange = useCallback(
    (sectionId: string, subIdx: number, field: 'heading' | 'content', value: string) =>
      updateField(sectionId, `subsection.${subIdx}.${field}`, value),
    [updateField]
  )

  // ── Generate all narratives handler ─────────────────────────
  const handleGenerateAllNarratives = useCallback(async () => {
    if (!report) return

    setIsGeneratingAll(true)
    setGenerationProgress({ current: 0, total: 0 })

    try {
      console.log('🎯 Starting batch narrative generation for report:', report.id)

      const response = await fetch('/api/ai/generate-all-narratives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: report.id })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to generate narratives`)
      }

      const result = await response.json()
      const { results, successful, failed, skipped } = result

      console.log('✅ Batch generation results:', { successful, failed, skipped })

      // Update sections with generated narratives
      let updatedCount = 0
      for (const result of results) {
        if (result.error) {
          console.warn(`⚠️ Failed to generate narrative for ${result.sectionTitle}:`, result.error)
          continue
        }

        const section = report.sections.find(s => s.id === result.sectionId)
        if (!section) continue

        // Update the section with the generated narrative as its content
        updateSectionData(
          result.sectionId,
          section.structured_data,
          result.narrative
        )

        // Mark this section as AI-updated in the recent updates
        addRecentUpdate(result.sectionId, ['ai_narrative'], 'ai_narrative_generated')

        updatedCount++
        setGenerationProgress({ current: updatedCount, total: results.length })
      }

      // Show summary toast
      const summaryMessage = updatedCount === 1
        ? `Generated narrative for 1 section`
        : skipped > 0
        ? `Generated narratives for ${updatedCount} sections (${skipped} skipped — no data, ${failed} failed)`
        : `Generated narratives for ${updatedCount} sections`

      showToast({
        type: 'success',
        title: 'Narratives Generated',
        description: summaryMessage,
        duration: 4000
      })

      // Refresh the report to ensure latest state
      await refreshReport()
    } catch (error) {
      console.error('❌ Batch narrative generation error:', error)
      showToast({
        type: 'error',
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate narratives. Please try again.',
        duration: 4000
      })
    } finally {
      setIsGeneratingAll(false)
      setGenerationProgress({ current: 0, total: 0 })
    }
  }, [report, updateSectionData, addRecentUpdate, showToast, refreshReport])

  // Check if all sections are empty — declared before early returns so
  // the hook call order is consistent across renders.
  const areAllSectionsEmpty = useMemo(() => {
    if (!report || !report.sections || report.sections.length === 0) return false
    return report.sections.every(section => {
      const isEmpty = (!section.content || section.content.trim() === '') &&
                      (!section.structured_data || Object.keys(section.structured_data).length === 0)
      return isEmpty
    })
  }, [report])

  // ── Render ──────────────────────────────────────────────────

  if (!report || !headerInfo) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading report…
      </div>
    )
  }

  const reportType = formatReportType(report.type || 'other')
  const reportSubtitle = `Speech and Language ${reportType.toUpperCase()}`

  // Active section for the modal
  const activeExportSection = activeSectionIdx !== null ? exportSections[activeSectionIdx] : null
  const activeSectionId = activeSectionIdx !== null ? orderedIds[activeSectionIdx] : null

  // Show empty state if all sections are empty
  if (areAllSectionsEmpty) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md px-6">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-indigo-100 rounded-full">
              <Brain className="h-12 w-12 text-indigo-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your report is empty</h2>
          <p className="text-gray-600 mb-8">
            Get started by uploading your clinical notes and letting AI fill in the sections.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.dispatchEvent(new Event('open-ai'))}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Brain className="h-5 w-5" />
              Start with AI
              <ArrowRight className="h-5 w-5" />
            </button>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (orderedSections.length > 0) {
                  setActiveSectionIdx(0)
                }
              }}
              className="block px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-colors duration-300"
            >
              Or fill sections manually
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 flex items-center justify-between bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b px-4 py-2 mb-4 rounded-t no-print">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Report Preview
        </h2>
        <div className="flex items-center gap-2">
          {/* Generate All Narratives Button */}
          <button
            onClick={handleGenerateAllNarratives}
            disabled={isGeneratingAll || !report || filteredSections.length === 0}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              isGeneratingAll
                ? 'bg-indigo-100 text-indigo-700 cursor-wait'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            )}
            title={!report || filteredSections.length === 0 ? 'No sections with data available' : 'Generate narratives for all sections'}
          >
            {isGeneratingAll ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">
                  Generating... ({generationProgress.current}/{generationProgress.total})
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Generate All Narratives</span>
              </>
            )}
          </button>

          <SaveStatusBadge status={saveStatus} />
          <button
            onClick={() => setMode(isEditing ? 'view' : 'edit')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              isEditing
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {isEditing ? (
              <><Pencil className="w-3.5 h-3.5" /> Editing</>
            ) : (
              <><Eye className="w-3.5 h-3.5" /> View Only</>
            )}
          </button>
        </div>
      </div>

      {/* Header card — compact at the top */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <div className="bg-white dark:bg-gray-950 rounded-lg border shadow-sm p-5">
          <ReportHeaderCard
            organizationName="Linguosity"
            confidentialityNotice="Confidential Information — For Professional Use Only"
            reportSubtitle={reportSubtitle}
            student={headerInfo.student}
            evaluatorName={headerInfo.evaluatorName}
            evaluationDate={headerInfo.evaluationDate}
            reportDate={headerInfo.reportDate}
            onFieldChange={handleHeaderFieldChange}
            onStudentFieldChange={handleStudentFieldChange}
            readOnly={!isEditing}
          />
        </div>
      </div>

      {/* Section card grid */}
      <div className="max-w-5xl mx-auto px-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {exportSections.map((section, idx) => {
                const sectionId = orderedIds[idx]
                return (
                  <ReportSectionCard
                    key={sectionId}
                    id={sectionId}
                    section={section}
                    sectionIndex={idx}
                    onClick={() => setActiveSectionIdx(idx)}
                    readOnly={!isEditing}
                  />
                )
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Section edit modal */}
      {activeExportSection && activeSectionId && activeSectionIdx !== null && (
        <SectionEditModal
          open={true}
          onOpenChange={(open) => {
            if (!open) setActiveSectionIdx(null)
          }}
          section={activeExportSection}
          sectionIndex={activeSectionIdx}
          sectionId={activeSectionId}
          onTitleChange={(val) => handleSectionTitleChange(activeSectionId, val)}
          onContentChange={(html) => handleSectionContentChange(activeSectionId, html)}
          onContentBlur={(html) => handleSectionContentChange(activeSectionId, html)}
          onSubsectionHeadingChange={(subIdx, val) =>
            handleSubsectionChange(activeSectionId, subIdx, 'heading', val)
          }
          onSubsectionContentChange={(subIdx, html) =>
            handleSubsectionChange(activeSectionId, subIdx, 'content', html)
          }
          onSubsectionContentBlur={(subIdx, html) =>
            handleSubsectionChange(activeSectionId, subIdx, 'content', html)
          }
        />
      )}
    </div>
  )
}
