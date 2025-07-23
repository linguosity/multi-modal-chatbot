'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useCallback, useEffect } from 'react'
import { useReport } from '@/lib/context/ReportContext'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Settings, Edit3, Save, FileJson } from 'lucide-react'
import { getSectionSchemaForType } from '@/lib/structured-schemas'
import DynamicStructuredBlock from '@/components/DynamicStructuredBlock'
import TiptapEditor from '@/components/TiptapEditor'
import { useAutosave } from '@/lib/hooks/useAutosave'
import { FloatingAIAssistant } from '@/components/FloatingAIAssistant'

export default function SectionPage() {
  const { id: reportId, sectionId } = useParams<{ id: string; sectionId: string }>()
  const router = useRouter()
  const { report, setReport, handleSave } = useReport()
  const [mode, setMode] = useState<'data' | 'template'>('data')
  const [showJsonDebug, setShowJsonDebug] = useState(false)
  const [sectionContent, setSectionContent] = useState('')

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

  const navigateToSection = (targetSectionId: string) => {
    router.push(`/dashboard/reports/${reportId}/${targetSectionId}`)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-gray-900">{section.title}</h1>
            {hasStructuredSchema && (
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setMode('data')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1 ${
                    mode === 'data' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Edit3 className="h-3 w-3" />
                  Data Entry
                </button>
                <button
                  onClick={() => setMode('template')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1 ${
                    mode === 'template' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Settings className="h-3 w-3" />
                  Edit Template
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {isSaving ? (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                Saving...
              </div>
            ) : lastSaved ? (
              <div className="text-xs text-gray-500">
                Saved {new Date(lastSaved).toLocaleTimeString()}
              </div>
            ) : null}
            
            <Button
              variant="outline"
              size="sm"
              onClick={forceSave}
              className="flex items-center gap-1"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowJsonDebug(!showJsonDebug)}
              className="flex items-center gap-1"
            >
              <FileJson className="h-4 w-4" />
              {showJsonDebug ? 'Hide JSON' : 'View JSON'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
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
          {hasStructuredSchema && mode === 'data' ? (
            <DynamicStructuredBlock
              schema={sectionSchema!}
              initialData={{}}
              onChange={(structuredData, generatedText) => {
                handleContentChange(generatedText)
              }}
            />
          ) : hasStructuredSchema && mode === 'template' ? (
            <DynamicStructuredBlock
              schema={sectionSchema!}
              initialData={{}}
              onChange={() => {}}
              onSchemaChange={(newSchema) => {
                console.log('Schema changed:', newSchema)
                // TODO: Save schema changes
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
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => prevSection && navigateToSection(prevSection.id)}
            disabled={!prevSection}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            {prevSection ? prevSection.title : 'Previous'}
          </Button>
          
          <div className="text-sm text-gray-500">
            Section {currentIndex + 1} of {report.sections.length}
          </div>
          
          <Button
            onClick={() => nextSection && navigateToSection(nextSection.id)}
            disabled={!nextSection}
            className="flex items-center gap-2"
          >
            {nextSection ? nextSection.title : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}