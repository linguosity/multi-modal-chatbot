'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useReport } from '@/lib/context/ReportContext'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { getSectionSchemaForType } from '@/lib/structured-schemas'
import { useUserSettings } from '@/lib/context/UserSettingsContext'
import DynamicStructuredBlock from '@/components/DynamicStructuredBlock'
import TiptapEditor from '@/components/TiptapEditor'
import { useAutosave } from '@/lib/hooks/useAutosave'
import { motion } from 'framer-motion'

import { useToast } from '@/lib/context/ToastContext'

import { NarrativeView } from '@/components/NarrativeView'
import SourcesGrid from '@/components/SourcesGrid'
import { getClinicalTypographyClass } from '@/lib/design-system/typography-migration'
import { cn } from '@/lib/design-system/utils'
import { useKeyboardNavigation } from '@/lib/context/NavigationContext'
import { safeStringify } from '@/lib/utils/safeStringify'
import type { Json } from '@/lib/types/json'
import type { SectionSchema } from '@/lib/structured-schemas'

export default function SectionPage() {
  const { id: reportId, sectionId } = useParams<{ id: string; sectionId: string }>()
  const router = useRouter()
  const { report, handleSave, updateSectionData } = useReport()
  const { settings } = useUserSettings()
  const [mode, setMode] = useState<'data' | 'template' | 'sources'>('data')
  const [showJsonDebug] = useState(false)
  const [sectionContent, setSectionContent] = useState('')
  const [currentSchema, setCurrentSchema] = useState<SectionSchema | null>(null)
  const [structuredData, setStructuredData] = useState<Json>({})
  
  
  const [isNavigating, setIsNavigating] = useState(false)
  const { showAIUpdateToast } = useToast()

  // Get section and related data
  const section = report?.sections.find(s => s.id === sectionId)
  const currentIndex = report?.sections.findIndex(s => s.id === sectionId) ?? -1
  const prevSection = currentIndex > 0 ? report?.sections[currentIndex - 1] : null
  const nextSection = currentIndex < (report?.sections.length ?? 0) - 1 ? report?.sections[currentIndex + 1] : null

  const sectionSchema = section ? getSectionSchemaForType(section.sectionType, settings.preferredState) : null
  const hasStructuredSchema = !!sectionSchema
  
  console.log('🔧 Section schema debug:', {
    sectionId,
    sectionTitle: section?.title,
    sectionType: section?.sectionType,
    hasSchema: !!sectionSchema,
    hasCurrentSchema: !!currentSchema,
    mode,
    preferredState: settings.preferredState
  });

  // Setup keyboard navigation
  useKeyboardNavigation(
    report?.sections.map(s => ({
      id: s.id,
      title: s.title,
      status: s.isCompleted ? 'completed' : 'not-started',
      isRequired: s.isRequired
    })) || [],
    sectionId
  )

  // Initialize schema state
  useEffect(() => {
    if (sectionSchema && !currentSchema) {
      console.log('🔧 Setting currentSchema:', sectionSchema);
      setCurrentSchema(sectionSchema)
    }
  }, [sectionSchema, currentSchema])

  // Memoize initial data to prevent unnecessary re-renders
  const memoizedInitialData = useMemo(() => {
    if (!section) return {}
    // Always use fresh data from the section
    const baseData = section.structured_data || {}
    console.log('🔄 SectionPage memoizedInitialData updated:', {
      sectionId: section.id,
      sectionTitle: section.title,
      dataKeys: Object.keys(baseData),
      timestamp: new Date().toISOString()
    });
    return baseData
  }, [section?.structured_data, section?.id, section?.title])

  // Initialize section content and structured data from report
  useEffect(() => {
    if (section) {
      setSectionContent(section.content || '')
      setStructuredData(section.structured_data || {})
    }
  }, [section])

  // Update section content when report data changes (after AI processing)
  useEffect(() => {
    if (report && section) {
      const updatedSection = report.sections.find(s => s.id === sectionId)
      if (updatedSection) {
        // Only update if content actually changed
        if (updatedSection.content !== section.content) {
          console.log('📝 Updating section content from refreshed report data')
          setSectionContent(updatedSection.content || '')
        }
        // Only update structured data if it's different (avoid circular refs)
        if (updatedSection.structured_data !== section.structured_data) {
          console.log('📝 Updating structured data from refreshed report data')
          setStructuredData(updatedSection.structured_data || {})
        }
      }
    }
  }, [report, sectionId, section])

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    console.log('🔄 SectionPage handleContentChange:', {
      sectionId,
      sectionTitle: section?.title,
      contentLength: newContent.length,
      contentPreview: newContent.substring(0, 100) + (newContent.length > 100 ? '...' : ''),
      timestamp: new Date().toISOString()
    });
    setSectionContent(newContent)
  }, [sectionId, section?.title])

  // Save function for autosave — saves directly to report_sections (single source of truth)
  const saveSection = useCallback(async (showToast = false) => {
    if (!report) return

    console.log('💾 SectionPage saveSection called:', {
      sectionId,
      sectionTitle: section?.title,
      contentLength: sectionContent.length,
      hasStructuredData: Object.keys((structuredData ?? {}) as object).length > 0,
      structuredDataKeys: Object.keys((structuredData ?? {}) as object),
      showToast,
      timestamp: new Date().toISOString()
    });

    // Save directly to report_sections via context (updates in-memory + persists to DB)
    updateSectionData(sectionId, structuredData, sectionContent)

    // Show toast notification for manual saves
    if (showToast) {
      showAIUpdateToast([], [], 'Section saved successfully')
    }
  }, [report, sectionId, sectionContent, structuredData, updateSectionData, showAIUpdateToast])

  // Setup autosave with better UX timing - much more responsive
  const { hasUnsavedChanges } = useAutosave({
    data: { content: sectionContent, structuredData },
    onSave: async () => await saveSection(false), // No toast for auto-saves
    debounceMs: 3000, // 3 seconds - much more responsive
    enabled: !!section
  })

  // Save on page unload/navigation - synchronous for reliability
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasUnsavedChanges) {
        // Synchronous save before leaving
        saveSection(false)
      }
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges) {
        // Synchronous save when tab becomes hidden
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

  // Keyboard shortcuts for saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (hasUnsavedChanges) {
          saveSection(true) // Show toast for keyboard saves
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [saveSection, hasUnsavedChanges])

  const navigateToSection = (targetSectionId: string) => {
    setIsNavigating(true)
    // Small delay to show the transition effect
    setTimeout(() => {
      router.push(`/dashboard/reports/${reportId}/${targetSectionId}`)
    }, 50)
  }

  

  // Early returns after all hooks
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

  const tabButtonCls = (isActive: boolean) => [
    'px-4 py-2.5 border-r',
    isActive
      ? 'bg-[var(--card-surface)] text-[var(--ink)]'
      : 'text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--paper)]',
  ].join(' ')

  return (
    <div className="h-full w-full flex flex-col overflow-x-hidden bg-[var(--paper)]">
      {/* Header */}
      <div
        className="bg-[var(--card-surface)]"
        style={{ borderBottom: '1.5px solid var(--line)' }}
      >
        <div className="flex items-end justify-between px-6 pt-5 pb-4">
          <div className="flex flex-col gap-1">
            <div className="wf-label">Section {(currentIndex + 1).toString().padStart(2, '0')} · {report.title}</div>
            <motion.h1
              key={`title-${sectionId}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: 0.05 }}
              className="wf-heading"
              style={{ fontSize: 26 }}
            >
              {section.title}
            </motion.h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex bg-[var(--paper-2)]"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', borderTop: '1px solid var(--line-2)', borderColor: 'var(--line-2)' }}
        >
          <button
            onClick={() => setMode('data')}
            className={tabButtonCls(mode === 'data')}
            style={{ borderRightColor: 'var(--line-2)', borderBottom: mode === 'data' ? '2px solid var(--terracotta)' : '2px solid transparent' }}
          >
            Data entry
          </button>
          {hasStructuredSchema && (
            <button
              onClick={() => setMode('template')}
              className={tabButtonCls(mode === 'template')}
              style={{ borderRightColor: 'var(--line-2)', borderBottom: mode === 'template' ? '2px solid var(--terracotta)' : '2px solid transparent' }}
            >
              Edit template
            </button>
          )}
          <button
            onClick={() => setMode('sources')}
            className={tabButtonCls(mode === 'sources')}
            style={{ borderBottom: mode === 'sources' ? '2px solid var(--terracotta)' : '2px solid transparent' }}
          >
            Sources
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <motion.div 
          key={sectionId}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ 
            duration: 0.2, 
            ease: [0.4, 0.0, 0.2, 1] // Custom easing for smooth feel
          }}
          className="w-full"
        >
          {/* Main Content Section */}
          <section className={`relative w-full ${hasStructuredSchema ? 'z-10 -translate-y-px' : ''}`}>
            {/* Content Area */}
            <div className="bg-white rounded-t-lg w-full" data-section-content>
              {mode === 'sources' ? (
                <SourcesGrid 
                  sources={(report.metadata as { uploadedFiles?: Array<{
                    id: string;
                    type: string;
                    name: string;
                    uploadDate: string;
                    size: number;
                    description?: string;
                  }> })?.uploadedFiles?.map((file) => ({
                    id: file.id,
                    type: file.type as 'text' | 'pdf' | 'image' | 'audio',
                    fileName: file.name,
                    uploadDate: file.uploadDate,
                    size: file.size,
                    description: file.description
                  })) || []}
                  reportId={reportId}
                  sectionId={sectionId}
                />
              ) : (
                <div className="w-full overflow-x-hidden">
                  {hasStructuredSchema && currentSchema && mode === 'template' ? (
                    <DynamicStructuredBlock
                      key={`template-${section.id}`}
                      schema={currentSchema}
                      initialData={memoizedInitialData}
                      mode={mode}
                      sectionId={section.id}
                      onChange={(newStructuredData, generatedText) => {
                        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
                          console.log('🔧 SectionPage DynamicStructuredBlock onChange (template mode):', {
                            sectionId,
                            sectionTitle: section?.title,
                            newStructuredDataKeys: Object.keys(newStructuredData || {}),
                            newStructuredData: safeStringify(newStructuredData, 2),
                            generatedTextLength: generatedText.length,
                            timestamp: new Date().toISOString()
                          });
                        }
                        setStructuredData(newStructuredData)
                        handleContentChange(generatedText)
                      }}
                      onSchemaChange={(newSchema) => {
                        console.log('Schema changed:', newSchema)
                        setCurrentSchema(newSchema) // Actually update the schema state!
                      }}
                      onSaveAsTemplate={(schema) => {
                        console.log('Save as template:', schema)
                        // TODO: Implement save as template
                      }}
                    />
                  ) : hasStructuredSchema && currentSchema && mode === 'data' ? (
                    <DynamicStructuredBlock
                      key={`data-${section.id}`}
                      schema={currentSchema}
                      initialData={memoizedInitialData}
                      mode={mode}
                      sectionId={section.id}
                      onChange={(newStructuredData, generatedText) => {
                        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
                          console.log('🔧 SectionPage DynamicStructuredBlock onChange (data mode):', {
                            sectionId,
                            sectionTitle: section?.title,
                            newStructuredDataKeys: Object.keys(newStructuredData || {}),
                            newStructuredData: safeStringify(newStructuredData, 2),
                            generatedTextLength: generatedText.length,
                            timestamp: new Date().toISOString()
                          });
                        }
                        setStructuredData(newStructuredData)
                        handleContentChange(generatedText)
                      }}
                      onSchemaChange={(newSchema) => {
                        console.log('Schema changed:', newSchema)
                        setCurrentSchema(newSchema) // Actually update the schema state!
                      }}
                      onSaveAsTemplate={(schema) => {
                        console.log('Save as template:', schema)
                        // TODO: Implement save as template
                      }}
                    />
                  ) : (
                    <div className="prose max-w-none">
                      <TiptapEditor
                        content={sectionContent}
                        onChange={handleContentChange}
                        onBlur={() => saveSection(false)} // Save on blur, no toast
                        editable={true}
                        withBorder={false}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </motion.div>

        {/* Narrative view */}
        {hasStructuredSchema && currentSchema && mode === 'data' && (
          <>
            <div className="py-6 flex items-center gap-3 px-6 bg-[var(--paper)]">
              <div className="h-px flex-1" style={{ background: 'var(--line-2)' }} />
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" style={{ color: 'var(--terracotta)' }} />
                <span className="wf-label bold" style={{ color: 'var(--terracotta-ink)' }}>
                  AI-generated narrative
                </span>
              </div>
              <div className="h-px flex-1" style={{ background: 'var(--line-2)' }} />
            </div>

            <div className="bg-[var(--paper)] w-full pb-6">
              <div className="w-full overflow-x-hidden px-6">
                <NarrativeView
                  reportId={report.id}
                  sectionId={section.id}
                  sectionTitle={section.title}
                  structuredData={section.structured_data || {}}
                  onRegenerateNarrative={async () => {
                    console.log('Regenerating narrative for section:', section.id)
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* JSON Debug View */}
        {showJsonDebug && (
          <div className="mt-6">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 font-mono text-sm">
                Section JSON Data
              </div>
              <pre className="p-4 overflow-auto bg-gray-50 text-xs max-h-96">
                {JSON.stringify({
                  id: section.id,
                  title: section.title,
                  sectionType: section.sectionType,
                  content: sectionContent,
                  lastUpdated: new Date().toISOString(),
                  schema: sectionSchema
                }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div
        className="bg-[var(--paper-2)] px-5 py-2"
        style={{ borderTop: '1px solid var(--line-2)' }}
      >
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => prevSection && navigateToSection(prevSection.id)}
            disabled={!prevSection || isNavigating}
            className="wf-btn sm ghost"
          >
            <ChevronLeft className="h-3 w-3" />
            <span className="truncate max-w-[220px]">{prevSection?.title || 'Previous'}</span>
          </button>

          <div className="wf-ticker">
            Section {currentIndex + 1} / {report?.sections.length || 0}
          </div>

          <button
            type="button"
            onClick={() => nextSection && navigateToSection(nextSection.id)}
            disabled={!nextSection || isNavigating}
            className="wf-btn sm ghost"
          >
            <span className="truncate max-w-[220px]">{nextSection?.title || 'Next'}</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Debug Section - only show in development */}
      {process.env.NODE_ENV === 'development' && showJsonDebug && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Information</h3>
          <pre className="p-4 bg-white rounded border text-xs overflow-auto max-h-96">
            {safeStringify({
              id: section?.id,
              title: section?.title,
              sectionType: section?.sectionType,
              hasStructuredSchema,
              currentSchemaKeys: currentSchema ? Object.keys(currentSchema) : [],
              structuredDataKeys: Object.keys((structuredData ?? {}) as object),
              contentLength: sectionContent.length,
              mode,
              hasUnsavedChanges
            }, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}