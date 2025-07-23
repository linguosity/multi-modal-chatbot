'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useCallback, useEffect } from 'react'
import { useReport } from '@/lib/context/ReportContext'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Settings, Edit3, Save, Download, FolderOpen, Upload, Trash2 } from 'lucide-react'
import { SplitButton } from '@/components/ui/split-button'
import { getSectionSchemaForType } from '@/lib/structured-schemas'
import DynamicStructuredBlock from '@/components/DynamicStructuredBlock'
import TiptapEditor from '@/components/TiptapEditor'
import { useAutosave } from '@/lib/hooks/useAutosave'
import { FloatingAIAssistant } from '@/components/FloatingAIAssistant'
import { motion } from 'framer-motion'

export default function SectionPage() {
  const { id: reportId, sectionId } = useParams<{ id: string; sectionId: string }>()
  const router = useRouter()
  const { report, handleSave, handleDelete } = useReport()
  const [mode, setMode] = useState<'data' | 'template'>('data')
  const [showJsonDebug] = useState(false)
  const [sectionContent, setSectionContent] = useState('')
  const [currentSchema, setCurrentSchema] = useState<any>(null)

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

  const section = report.sections.find(s => s.id === sectionId)
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

  const currentIndex = report.sections.findIndex(s => s.id === sectionId)
  const prevSection = currentIndex > 0 ? report.sections[currentIndex - 1] : null
  const nextSection = currentIndex < report.sections.length - 1 ? report.sections[currentIndex + 1] : null

  const sectionSchema = getSectionSchemaForType(section.sectionType)
  const hasStructuredSchema = !!sectionSchema

  // Initialize schema state
  useEffect(() => {
    if (sectionSchema && !currentSchema) {
      setCurrentSchema(sectionSchema)
    }
  }, [sectionSchema, currentSchema])

  // Initialize section content from report
  useEffect(() => {
    if (section) {
      setSectionContent(section.content || '')
    }
  }, [section])

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    setSectionContent(newContent)
  }, [])

  // Save function for autosave
  const saveSection = useCallback(async () => {
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
  }, [report, sectionId, sectionContent, handleSave])

  // Setup autosave
  const { isSaving, lastSaved, forceSave } = useAutosave({
    data: sectionContent,
    onSave: saveSection,
    debounceMs: 2000,
    enabled: !!section
  })

  const [isNavigating, setIsNavigating] = useState(false)

  const navigateToSection = (targetSectionId: string) => {
    setIsNavigating(true)
    // Small delay to show the transition effect
    setTimeout(() => {
      router.push(`/dashboard/reports/${reportId}/${targetSectionId}`)
    }, 50)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-start justify-between">
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
            {lastSaved && (
              <div className="text-xs text-gray-500 mt-1">
                Last saved • {new Date(lastSaved).toLocaleTimeString()}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Tabs positioned to the right of header */}
            {hasStructuredSchema && (
              <div className="flex gap-0 relative" style={{ marginBottom: '-1px' }}>
                <button
                  onClick={() => setMode('data')}
                  className={`px-4 py-2 text-sm rounded-t-md border border-gray-200 border-b-0 outline-none flex items-center gap-1 transition-colors ${
                    mode === 'data' 
                      ? 'bg-white text-gray-900 font-semibold relative z-20' 
                      : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-50 relative z-10'
                  }`}
                >
                  <Edit3 className="h-3 w-3" />
                  Data Entry
                </button>
                <button
                  onClick={() => setMode('template')}
                  className={`px-4 py-2 text-sm rounded-t-md border border-gray-200 border-b-0 outline-none flex items-center gap-1 transition-colors ${
                    mode === 'template' 
                      ? 'bg-white text-gray-900 font-semibold relative z-20' 
                      : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-50 relative z-10'
                  }`}
                >
                  <Settings className="h-3 w-3" />
                  Edit Template
                </button>
              </div>
            )}
          
            <div className="flex items-center gap-3">
            {isSaving ? (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                Saving...
              </div>
            ) : null}
            
            {/* Consolidated Action Bar */}
            <div className="flex items-center gap-2">
              <SplitButton
                onClick={forceSave}
                variant="primary"
                size="sm"
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
          {/* Content card that connects with tabs */}
          <section className={`border border-gray-200 bg-white p-6 mx-6 mt-0 mb-6 ${hasStructuredSchema ? 'rounded-b-md rounded-tl-md' : 'rounded-md mt-6'}`}>
              {/* AI Assistant */}
              <FloatingAIAssistant
                sections={[section]}
                reportId={report.id}
                onGenerateContent={async (sectionIds, input, files) => {
                  if (!sectionIds.includes(section.id)) return
                  
                  try {
                    // Create request body
                    let body: any = {
                      reportId: report.id,
                      sectionId: section.id,
                      generation_type: 'prose',
                      unstructuredInput: input || `Generate content for ${section.title} section.`
                    }
                    
                    // Handle file uploads if present
                    if (files && files.length > 0) {
                      const formData = new FormData()
                      formData.append('reportId', report.id)
                      formData.append('sectionId', section.id)
                      formData.append('generation_type', 'prose')
                      formData.append('unstructuredInput', input || `Generate content for ${section.title} section.`)
                      
                      files.forEach((file, index) => {
                        formData.append(`file_${index}`, file)
                      })
                      
                      body = formData
                    }
                    
                    // Make API request
                    const res = await fetch('/api/ai/generate-section', {
                      method: 'POST',
                      ...(files && files.length > 0 ? {} : { headers: { 'Content-Type': 'application/json' } }),
                      body: files && files.length > 0 ? body : JSON.stringify(body)
                    })
                    
                    const json = await res.json()
                    if (!res.ok) throw new Error(json.error || 'AI generation failed')
                    
                    // Update content
                    handleContentChange(json.updatedSection.content)
                    forceSave()
                  } catch (error) {
                    console.error('AI generation failed:', error)
                  }
                }}
              />
              
              {/* Main Content */}
              {hasStructuredSchema && currentSchema ? (
                <DynamicStructuredBlock
                  schema={currentSchema}
                  initialData={{}}
                  mode={mode}
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
                />
              ) : (
                <div className="prose max-w-none">
                  <TiptapEditor
                    content={sectionContent}
                    onChange={handleContentChange}
                    onBlur={forceSave}
                    editable={true}
                    withBorder={false}
                  />
                </div>
              )}
              
              {/* JSON Debug View */}
              {showJsonDebug && (
                <div className="mt-8 border border-gray-200 rounded-lg overflow-hidden">
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
              )}
            </section>
          </motion.div>
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
              {prevSection ? prevSection.title : 'Previous'}
            </Button>
          </motion.div>
          
          <div className="text-sm text-gray-500">
            Section {currentIndex + 1} of {report.sections.length}
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
              {nextSection ? nextSection.title : 'Next'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}