'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useReport } from '@/lib/context/ReportContext'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Settings, Save, Download, FolderOpen, Upload, Trash2, Sparkles, FileText } from 'lucide-react'
import { SplitButton } from '@/components/ui/split-button'
import { getSectionSchemaForType } from '@/lib/structured-schemas'
import { useUserSettings } from '@/lib/context/UserSettingsContext'
import DynamicStructuredBlock from '@/components/DynamicStructuredBlock'
import TiptapEditor from '@/components/TiptapEditor'
import { useAutosave } from '@/lib/hooks/useAutosave'
import { CompactAIAssistant } from '@/components/CompactAIAssistant'
import { motion } from 'framer-motion'
import { SettingsButton } from '@/components/UserSettingsModal'
import { useRecentUpdates } from '@/lib/context/RecentUpdatesContext'
import { useToast } from '@/lib/context/ToastContext'
import { useProgressToasts } from '@/lib/context/ProgressToastContext'

import { NarrativeView } from '@/components/NarrativeView'
import SourcesGrid from '@/components/SourcesGrid'
import Link from 'next/link'

export default function SectionPage() {
  const { id: reportId, sectionId } = useParams<{ id: string; sectionId: string }>()
  const router = useRouter()
  const { report, handleSave, handleDelete, updateSectionData, refreshReport } = useReport()
  const { settings } = useUserSettings()
  const [mode, setMode] = useState<'data' | 'template' | 'sources'>('data')
  const [showJsonDebug] = useState(false)
  const [sectionContent, setSectionContent] = useState('')
  const [currentSchema, setCurrentSchema] = useState<any>(null)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const { addRecentUpdate } = useRecentUpdates()
  const { showAIUpdateToast, showProcessingSummaryToast } = useToast()
  const { processLogLine } = useProgressToasts()

  // Get section and related data
  const section = report?.sections.find(s => s.id === sectionId)
  const currentIndex = report?.sections.findIndex(s => s.id === sectionId) ?? -1
  const prevSection = currentIndex > 0 ? report?.sections[currentIndex - 1] : null
  const nextSection = currentIndex < (report?.sections.length ?? 0) - 1 ? report?.sections[currentIndex + 1] : null

  const sectionSchema = section ? getSectionSchemaForType(section.sectionType, settings.preferredState) : null
  const hasStructuredSchema = !!sectionSchema

  // Initialize schema state
  useEffect(() => {
    if (sectionSchema && !currentSchema) {
      setCurrentSchema(sectionSchema)
    }
  }, [sectionSchema, currentSchema])

  // Memoize initial data to prevent infinite re-renders
  const memoizedInitialData = useMemo(() => {
    if (!section) return {};
    // Safe logging to avoid circular reference issues
    try {
      console.log(`📊 Passing structured_data to ${section.title}:`, JSON.stringify(section.structured_data, null, 2));
    } catch (e) {
      console.log(`📊 Passing structured_data to ${section.title}: [Circular Reference Detected]`);
    }
    return section.structured_data || {};
  }, [section?.structured_data, section?.title])

  // Initialize section content from report
  useEffect(() => {
    if (section) {
      setSectionContent(section.content || '')
    }
  }, [section])

  // Update section content when report data changes (after AI processing)
  useEffect(() => {
    if (report && section) {
      const updatedSection = report.sections.find(s => s.id === sectionId)
      if (updatedSection && updatedSection.content !== sectionContent) {
        console.log('📝 Updating section content from refreshed report data')
        setSectionContent(updatedSection.content || '')
      }
    }
  }, [report, section, sectionId, sectionContent])

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
          ? { ...s, content: sectionContent, lastUpdated: new Date().toISOString() } 
          : s
      )
    }
    
    await handleSave(updatedReport)
    
    // Show toast notification for manual saves
    if (showToast) {
      showAIUpdateToast([], [], 'Report saved successfully')
    }
  }, [report, sectionId, sectionContent, handleSave, showAIUpdateToast])

  // Setup autosave with better UX timing - only for emergency backup
  const { isSaving, lastSaved, forceSave, hasUnsavedChanges } = useAutosave({
    data: sectionContent,
    onSave: async (data) => await saveSection(false), // No toast for auto-saves
    debounceMs: 180000, // 3 minutes - emergency backup only
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

  const handleGenerateContent = async (sectionIds: string[], input: string, files?: File[]) => {
    if (!sectionIds.includes(section.id)) return
    
    try {
      // Determine generation type based on section schema and input
      let generationType = 'prose'; // Default
      
      if (files && files.length > 0) {
        // Check if section has structured schema for structured processing
        const sectionSchema = getSectionSchemaForType(section.sectionType || '');
        if (sectionSchema && sectionSchema.fields && sectionSchema.fields.length > 0) {
          generationType = 'structured_data_processing';
        } else {
          generationType = 'multi_modal_assessment';
        }
      } else if (currentSchema && currentSchema.fields && currentSchema.fields.length > 0) {
        // For text-only input, use structured processing if schema exists
        generationType = 'structured_data_processing';
      }

      // Create request body
      let body: any = {
        reportId: report.id,
        sectionId: section.id,
        generation_type: generationType,
        unstructuredInput: input || `Generate content for ${section.title} section.`
      }
      
      // Handle file uploads if present
      if (files && files.length > 0) {
        const formData = new FormData()
        formData.append('reportId', report.id)
        // Don't append sectionId for multi-modal assessment - let AI determine sections
        formData.append('generation_type', generationType)
        formData.append('unstructuredInput', input || `Generate content based on uploaded assessment materials.`)
        
        files.forEach((file, index) => {
          formData.append(`file_${index}`, file)
        })
        
        body = formData
      }
      
      // Make API request with streaming support
      const res = await fetch('/api/ai/generate-section', {
        method: 'POST',
        ...(files && files.length > 0 ? {} : { headers: { 'Content-Type': 'application/json' } }),
        body: files && files.length > 0 ? body : JSON.stringify(body)
      })
      
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'AI generation failed')
      
      // Handle different response formats
      if (generationType === 'structured_data_processing' || generationType === 'multi_modal_assessment') {
        // Structured data or multi-modal assessment response
        try {
          console.log('🎯 AI Processing Response:', JSON.stringify(json, null, 2));
        } catch (e) {
          console.log('🎯 AI Processing Response: [Circular Reference Detected]');
        }
        
        if (json.updatedSections && json.updatedSections.length > 0) {
          // Collect all field changes for toast
          const allChanges: string[] = [];
          
          // Track updates for visual indicators
          json.updatedSections.forEach((updatedSectionId: string) => {
            // Extract field changes from the response if available
            const changes = json.analysisResult?.content_analysis?.identified_updates
              ?.filter((update: any) => update.section_id === updatedSectionId)
              ?.map((update: any) => update.field_path) || ['content'];
            
            console.log(`📍 Tracking update for section ${updatedSectionId}:`, changes);
            addRecentUpdate(updatedSectionId, changes, 'ai_update');
            allChanges.push(...changes);
          });
          
          // Show processing summary toast (persistent)
          // Extract processing summary from various possible locations
          let processingSummary = null;
          
          // Try to get from analysisResult (analyze_assessment_content tool)
          if (json.analysisResult?.content_analysis?.processing_notes) {
            processingSummary = json.analysisResult.content_analysis.processing_notes;
          }
          
          // Try to get from tool data (update_report_data tool)
          if (!processingSummary && json.analysisResult?.data?.processing_summary) {
            processingSummary = json.analysisResult.data.processing_summary;
          }
          
          // Try to get from message (fallback)
          if (!processingSummary && json.message) {
            processingSummary = json.message;
          }
          
          if (processingSummary) {
            showProcessingSummaryToast({
              summary: processingSummary,
              updatedSections: json.updatedSections,
              processedFiles: json.processedFiles || [],
              fieldUpdates: allChanges
            });
          }
          
          // Show quick update toast (auto-dismiss)
          showAIUpdateToast(json.updatedSections, allChanges);
          
          // Refresh the report data from database
          console.log('🔄 Refreshing report data to show updates...');
          setIsRefreshing(true);
          try {
            await refreshReport();
          } finally {
            setIsRefreshing(false);
          }
          
          // If current section was updated, show visual feedback
          if (json.updatedSections.includes(section.id)) {
            console.log('✨ Current section was updated, showing visual feedback');
            // Add a subtle animation or highlight effect
            const element = document.querySelector('[data-section-content]');
            if (element) {
              element.classList.add('animate-pulse');
              setTimeout(() => {
                element.classList.remove('animate-pulse');
              }, 2000);
            }
          }
        } else {
          console.log('ℹ️ Processing completed but no sections were updated:', json.message)
          // Show info message
          showAIUpdateToast([], []);
        }
      } else {
        // Single section response (legacy prose generation)
        console.log('📝 Legacy prose generation completed');
        handleContentChange(json.updatedSection.content)
        forceSave()
      }
    } catch (error) {
      console.error('AI generation failed:', error)
    }
  }

  // Early returns after all hooks
  if (!report) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Report not found</h2>
          <p className="text-gray-600">The requested report could not be loaded.</p>
        </div>
      </div>
    )
  }

  if (!section) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Section not found</h2>
          <p className="text-gray-600">The requested section could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 pt-4 pb-0">
        <div className="flex items-end justify-between">
          <div>
            <motion.h1 
              key={`title-${sectionId}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: 0.05 }}
              className="text-2xl font-semibold text-gray-900"
            >
              {section.title}
            </motion.h1>

          </div>

          <div className="flex items-end gap-4">
            {/* Mode Toggle Tabs */}
            <div className="flex gap-0 relative -mb-px z-10">
              {/* Data Tab */}
              <button
                onClick={() => setMode('data')}
                className={`px-4 py-2 text-sm rounded-t-md border border-b-0 outline-none flex items-center gap-1 transition-colors relative ${
                  mode === 'data' 
                    ? 'bg-white text-gray-900 font-semibold z-20 border-gray-200 shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-50 z-10 border-gray-200'
                }`}
              >
                Data Entry
              </button>
              
              {/* Template Tab - Only show when structured schema exists */}
              {hasStructuredSchema && (
                <button
                  onClick={() => setMode('template')}
                  className={`px-4 py-2 text-sm border border-b-0 outline-none flex items-center gap-1 transition-colors relative ${
                    mode === 'template' 
                      ? 'bg-white text-gray-900 font-semibold z-20 border-gray-200 shadow-sm' 
                      : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-50 z-10 border-gray-200'
                  } ${mode === 'data' ? '-ml-px' : ''}`}
                >
                  <Settings className="h-3 w-3" />
                  Edit Template
                </button>
              )}
              
              {/* Sources Tab */}
              <button
                onClick={() => setMode('sources')}
                className={`px-4 py-2 text-sm rounded-t-md border border-b-0 outline-none flex items-center gap-1 transition-colors relative ${
                  mode === 'sources' 
                    ? 'bg-white text-gray-900 font-semibold z-20 border-gray-200 shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-50 z-10 border-gray-200'
                } -ml-px`}
              >
                <FileText className="h-3 w-3" />
                Sources
              </button>
            </div>
          
            <div className="flex items-end gap-3">
            <div className="flex items-center gap-2 text-sm min-w-[120px] h-6">
              {isRefreshing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                  <span className="text-green-600">Updating...</span>
                </>
              ) : null}
            </div>
            
            {/* Consolidated Action Bar */}
            <div className="flex items-center gap-2">
              {/* View Report Button */}
              <Link href={`/dashboard/reports/${reportId}/view`} passHref>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  View Report
                </Button>
              </Link>

              {/* AI Assistant Button */}
              <div className="relative">
                <Button
                  onClick={() => setShowAIAssistant(!showAIAssistant)}
                  variant="secondary"
                  size="sm"
                  className={`flex items-center gap-1 ${showAIAssistant ? 'bg-blue-50 border-blue-300' : ''}`}
                >
                  <Sparkles className="h-4 w-4" />
                  AI
                </Button>
                
                <CompactAIAssistant
                  sections={[section]}
                  reportId={report.id}
                  isOpen={showAIAssistant}
                  onToggle={() => setShowAIAssistant(!showAIAssistant)}
                  onGenerateContent={(sectionIds, input, files) => handleGenerateContent(sectionIds, input, files)}
                />
              </div>
              
              <SplitButton
                onClick={() => saveSection(true)} // Show toast for manual saves
                variant="primary"
                size="sm"
                isSaving={isSaving}
                lastSaved={lastSaved}
                hasUnsavedChanges={hasUnsavedChanges}
                dropdownItems={[
                  {
                    label: "Save as Template",
                    icon: <FolderOpen className="h-4 w-4" />,
                    onClick: () => {
                      if (currentSchema) {
                        console.log('Save as template:', currentSchema)
                        // TODO: Implement save as template
                      }
                    }
                  },
                  {
                    label: "Download JSON",
                    icon: <Download className="h-4 w-4" />,
                    onClick: () => {
                      const reportData = {
                        id: section.id,
                        title: section.title,
                        sectionType: section.sectionType,
                        content: sectionContent,
                        lastUpdated: new Date().toISOString(),
                        schema: currentSchema
                      }
                      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${section.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_section.json`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }
                  },
                  {
                    label: "Upload Template JSON",
                    icon: <Upload className="h-4 w-4" />,
                    onClick: () => {
                      console.log('Upload template JSON')
                      // TODO: Implement upload template
                    }
                  },
                  {
                    label: "Upload Report JSON",
                    icon: <Upload className="h-4 w-4" />,
                    onClick: () => {
                      console.log('Upload report JSON')
                      // TODO: Implement upload report
                    }
                  },
                  {
                    label: "Delete Report",
                    icon: <Trash2 className="h-4 w-4 text-red-500" />,
                    separator: true,
                    onClick: () => {
                      if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
                        handleDelete()
                      }
                    }
                  }
                ]}
              >
                <Save className="h-4 w-4 mr-1" />
                Save Report
              </SplitButton>
              
              <SettingsButton />
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <motion.div 
          key={sectionId}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ 
            duration: 0.2, 
            ease: [0.4, 0.0, 0.2, 1] // Custom easing for smooth feel
          }}
          className="max-w-4xl mx-auto"
        >
          {/* Main Content Section */}
          <section className={`relative mx-6 ${hasStructuredSchema ? 'z-10 -translate-y-px' : 'mt-6'}`}>
            {/* Content Area */}
            <div className="bg-white rounded-t-lg" data-section-content>
              {mode === 'sources' ? (
                <SourcesGrid 
                  sources={report.metadata?.uploadedFiles?.map(file => ({
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
                <div className="p-6 pb-8">
                  {hasStructuredSchema && currentSchema && mode === 'template' ? (
                    <DynamicStructuredBlock
                      schema={currentSchema}
                      initialData={memoizedInitialData}
                      mode={mode}
                      sectionId={section.id}
                      onChange={(_, generatedText) => {
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
                      updateSectionData={updateSectionData}
                    />
                  ) : hasStructuredSchema && currentSchema && mode === 'data' ? (
                    <DynamicStructuredBlock
                      schema={currentSchema}
                      initialData={memoizedInitialData}
                      mode={mode}
                      sectionId={section.id}
                      onChange={(_, generatedText) => {
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
                      updateSectionData={updateSectionData}
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
                <div className="w-full max-w-4xl mx-auto px-6">
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
              <div className="max-w-4xl mx-auto px-6">
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
          <div className="max-w-4xl mx-auto px-6 mt-6">
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
      <div className="border-t border-gray-200 bg-white px-6 py-4">
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