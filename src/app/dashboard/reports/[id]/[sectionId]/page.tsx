'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useReport } from '@/lib/context/ReportContext'
import { Button } from '@/components/ui/button'
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

export default function SectionPage() {
  const { id: reportId, sectionId } = useParams<{ id: string; sectionId: string }>()
  const router = useRouter()
  const { report, handleSave } = useReport()
  const { settings } = useUserSettings()
  const [mode, setMode] = useState<'data' | 'template' | 'sources'>('data')
  const [showJsonDebug] = useState(false)
  const [sectionContent, setSectionContent] = useState('')
  const [currentSchema, setCurrentSchema] = useState<unknown>(null)
  const [structuredData, setStructuredData] = useState<Record<string, unknown>>({})
  
  
  const [isNavigating, setIsNavigating] = useState(false)
  const { showAIUpdateToast } = useToast()

  // Get section and related data
  const section = report?.sections.find(s => s.id === sectionId)
  const currentIndex = report?.sections.findIndex(s => s.id === sectionId) ?? -1
  const prevSection = currentIndex > 0 ? report?.sections[currentIndex - 1] : null
  const nextSection = currentIndex < (report?.sections.length ?? 0) - 1 ? report?.sections[currentIndex + 1] : null

  const sectionSchema = section ? getSectionSchemaForType(section.sectionType, settings.preferredState) : null
  const hasStructuredSchema = !!sectionSchema

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
      setCurrentSchema(sectionSchema)
    }
  }, [sectionSchema, currentSchema])

  // Memoize initial data to prevent infinite re-renders
  const memoizedInitialData = useMemo(() => {
    // Use local structured data state instead of section data to avoid circular updates
    console.log(`📊 Using local structured_data for ${section?.title || 'Unknown Section'} (${Object.keys(structuredData).length} keys)`);
    return structuredData;
  }, [structuredData, section?.title])

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
    setSectionContent(newContent)
  }, [])

  // Save function for autosave
  const saveSection = useCallback(async (showToast = false) => {
    if (!report) return
    
    const updatedReport = {
      ...report,
      sections: report.sections.map(s => 
        s.id === sectionId 
          ? { 
              ...s, 
              content: sectionContent, 
              structured_data: structuredData,
              lastUpdated: new Date().toISOString() 
            } 
          : s
      )
    }
    
    await handleSave(updatedReport)
    
    // Show toast notification for manual saves
    if (showToast) {
      showAIUpdateToast([], [], 'Report saved successfully')
    }
  }, [report, sectionId, sectionContent, structuredData, handleSave, showAIUpdateToast])

  // Setup autosave with better UX timing - only for emergency backup
  const { hasUnsavedChanges } = useAutosave({
    data: { content: sectionContent, structuredData },
    onSave: async () => await saveSection(false), // No toast for auto-saves
    debounceMs: 30000, // 30 seconds - reasonable debounce for structured data
    enabled: !!section
  })

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
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className={cn(getClinicalTypographyClass('sectionHeading'), 'mb-2')}>Report not found</h2>
          <p className={getClinicalTypographyClass('bodyText', 'gray-600')}>The requested report could not be loaded.</p>
        </div>
      </div>
    )
  }

  if (!section) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className={cn(getClinicalTypographyClass('sectionHeading'), 'mb-2')}>Section not found</h2>
          <p className={getClinicalTypographyClass('bodyText', 'gray-600')}>The requested section could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex items-end justify-between">
          <div>
            <motion.h1 
              key={`title-${sectionId}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: 0.05 }}
              className={getClinicalTypographyClass('reportTitle')}
            >
              {section.title}
            </motion.h1>

          </div>


        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setMode('data')}
            className={`px-4 py-2 text-sm font-medium border-r border-gray-200 transition-colors ${
              mode === 'data'
                ? 'bg-white text-gray-900 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Data Entry
          </button>
          {hasStructuredSchema && (
            <button
              onClick={() => setMode('template')}
              className={`px-4 py-2 text-sm font-medium border-r border-gray-200 transition-colors ${
                mode === 'template'
                  ? 'bg-white text-gray-900 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Edit Template
            </button>
          )}
          <button
            onClick={() => setMode('sources')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'sources'
                ? 'bg-white text-gray-900 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
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
                      schema={currentSchema}
                      initialData={memoizedInitialData}
                      mode={mode}
                      sectionId={section.id}
                      onChange={(newStructuredData, generatedText) => {
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
                      schema={currentSchema}
                      initialData={memoizedInitialData}
                      mode={mode}
                      sectionId={section.id}
                      onChange={(newStructuredData, generatedText) => {
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

        {/* Narrative View Section - Full Width Background */}
        {hasStructuredSchema && currentSchema && mode === 'data' && (
          <>
            {/* Subtle 3-Point Gradient Transition - Full Width */}
            <div className="relative h-16 bg-gradient-to-b from-white via-blue-50/30 to-blue-50/50 w-full">
              {/* Elegant Divider with Gradient Background */}
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200/60"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <div className="bg-gradient-to-r from-blue-50/80 via-white to-blue-50/80 px-6 py-2 rounded-full border border-gray-200/40 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-1 bg-blue-400/60 rounded-full animate-pulse"></div>
                          <FileText className="h-4 w-4 text-blue-500/70" />
                          <span className="text-xs font-medium text-blue-600/80 uppercase tracking-wider">
                            AI-Generated Narrative
                          </span>
                          <FileText className="h-4 w-4 text-blue-500/70" />
                          <div className="w-1 h-1 bg-blue-400/60 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Narrative Content with Full Width Gradient Background */}
            <div className="bg-gradient-to-b from-blue-50/50 via-blue-50/20 to-white w-full pb-6">
              <div className="w-full overflow-x-hidden">
                <div className="pt-4">
                  <NarrativeView
                    reportId={report.id}
                    sectionId={section.id}
                    sectionTitle={section.title}
                    structuredData={section.structured_data || {}}
                    onRegenerateNarrative={async () => {
                      // Trigger a refresh of the narrative
                      console.log('Regenerating narrative for section:', section.id)
                    }}
                  />
                </div>
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
      <div className="border-t border-gray-200 bg-white">
        <div className="flex justify-between items-center">
          <motion.div
            whileHover={{ scale: prevSection ? 1.02 : 1 }}
            whileTap={{ scale: prevSection ? 0.98 : 1 }}
            transition={{ duration: 0.1 }}
          >
            <Button
              variant="default"
              onClick={() => prevSection && navigateToSection(prevSection.id)}
              disabled={!prevSection || isNavigating}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              {prevSection?.title || 'Previous'}
            </Button>
          </motion.div>
          
          <div className="text-sm text-gray-500">
            Section {currentIndex + 1} of {report?.sections.length || 0}
          </div>
          
          <motion.div
            whileHover={{ scale: nextSection ? 1.02 : 1 }}
            whileTap={{ scale: nextSection ? 0.98 : 1 }}
            transition={{ duration: 0.1 }}
          >
            <Button
              onClick={() => nextSection && navigateToSection(nextSection.id)}
              disabled={!nextSection || isNavigating}
              className="flex items-center gap-2"
            >
              {nextSection?.title || 'Next'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}