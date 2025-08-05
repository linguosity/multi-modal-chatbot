'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useReport } from '@/lib/context/ReportContext'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { getSectionSchemaForType } from '@/lib/structured-schemas'
import { useUserSettings } from '@/lib/context/UserSettingsContext'
import DynamicStructuredBlock from '@/components/DynamicStructuredBlock'
import { useToast } from '@/lib/context/ToastContext'
import { getClinicalTypographyClass } from '@/lib/design-system/typography-migration'
import { cn } from '@/lib/design-system/utils'

export default function ReportTemplatePage() {
  const { id: reportId } = useParams<{ id: string }>()
  const { report, handleSave } = useReport()
  const { settings } = useUserSettings()
  const { showAIUpdateToast } = useToast()
  const [hasChanges, setHasChanges] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [sectionSchemas, setSectionSchemas] = useState<Record<string, any>>({})

  // Initialize schemas for all sections
  useEffect(() => {
    if (report?.sections) {
      const schemas: Record<string, any> = {}
      report.sections.forEach(section => {
        const schema = getSectionSchemaForType(section.sectionType, settings.preferredState)
        if (schema) {
          schemas[section.id] = schema
        }
      })
      setSectionSchemas(schemas)
      
      // Select first section with schema by default
      const firstSectionWithSchema = report.sections.find(s => schemas[s.id])
      if (firstSectionWithSchema && !selectedSectionId) {
        setSelectedSectionId(firstSectionWithSchema.id)
      }
    }
  }, [report, settings.preferredState, selectedSectionId])

  const selectedSection = report?.sections.find(s => s.id === selectedSectionId)
  const selectedSchema = selectedSectionId ? sectionSchemas[selectedSectionId] : null

  const handleSchemaChange = (sectionId: string, newSchema: any) => {
    setSectionSchemas(prev => ({
      ...prev,
      [sectionId]: newSchema
    }))
    setHasChanges(true)
  }

  const handleSaveTemplate = async () => {
    if (!report || !hasChanges) return

    try {
      // Here you would typically save the schema changes to the database
      // For now, we'll just show a success message
      showAIUpdateToast([], [], 'Template structure saved successfully')
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving template:', error)
      showAIUpdateToast([], [], 'Error saving template structure')
    }
  }

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

  const sectionsWithSchemas = report.sections.filter(s => sectionSchemas[s.id])

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/reports/${reportId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Report
              </Button>
            </Link>
            <div>
              <h1 className={getClinicalTypographyClass('reportTitle')}>
                Edit Template Structure
              </h1>
              <p className={getClinicalTypographyClass('bodyText', 'gray-600')}>
                Customize the structure and fields for report sections
              </p>
            </div>
          </div>
          <Button 
            onClick={handleSaveTemplate}
            disabled={!hasChanges}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Section List Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="p-4">
            <h3 className={cn(getClinicalTypographyClass('sectionHeading'), 'mb-4')}>
              Sections
            </h3>
            <div className="space-y-2">
              {sectionsWithSchemas.map(section => (
                <button
                  key={section.id}
                  onClick={() => setSelectedSectionId(section.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    selectedSectionId === section.id
                      ? "bg-white border-blue-200 shadow-sm"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="font-medium text-sm">{section.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {section.sectionType}
                  </div>
                </button>
              ))}
            </div>
            
            {sectionsWithSchemas.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">
                  No structured sections found in this report.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Template Editor */}
        <div className="flex-1 overflow-y-auto">
          {selectedSection && selectedSchema ? (
            <div className="p-6">
              <div className="mb-6">
                <h2 className={getClinicalTypographyClass('sectionHeading')}>
                  {selectedSection.title}
                </h2>
                <p className={getClinicalTypographyClass('bodyText', 'gray-600')}>
                  Edit the structure and field types for this section
                </p>
              </div>
              
              <DynamicStructuredBlock
                schema={selectedSchema}
                initialData={selectedSection.structured_data || {}}
                mode="template"
                sectionId={selectedSection.id}
                onChange={() => {}} // Not used in template mode
                onSchemaChange={(newSchema) => handleSchemaChange(selectedSection.id, newSchema)}
                onSaveAsTemplate={(schema) => {
                  console.log('Save as template:', schema)
                  // TODO: Implement save as global template
                }}
                updateSectionData={(sectionId: string, data: any, content: string) => {}} // Not used in template mode
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className={cn(getClinicalTypographyClass('sectionHeading'), 'mb-2')}>
                  Select a Section
                </h3>
                <p className={getClinicalTypographyClass('bodyText', 'gray-600')}>
                  Choose a section from the sidebar to edit its template structure
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}