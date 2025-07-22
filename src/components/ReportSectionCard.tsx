'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Info } from 'lucide-react'
import TiptapEditor from './TiptapEditor'
import DynamicStructuredBlock from './DynamicStructuredBlock'
import { ReportSection } from '@/lib/schemas/report'
import { getSectionSchemaForType } from '@/lib/structured-schemas'

interface Props {
  section: ReportSection
  reportId: string
  onUpdateSectionAction: (
    sectionId: string,
    content: string,
    shouldSave?: boolean
  ) => void
}

export const ReportSectionCard: React.FC<Props> = ({
  section,
  reportId,
  onUpdateSectionAction
}) => {
  const [tab, setTab] = useState<'structured' | 'editor'>('structured')
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [currentSchema, setCurrentSchema] = useState<any>(null)

  // Check if structured schema is available for this section type
  const sectionSchema = getSectionSchemaForType(section.sectionType)
  const hasStructuredSchema = !!sectionSchema

  // Initialize current schema
  React.useEffect(() => {
    if (sectionSchema) {
      setCurrentSchema(sectionSchema)
    }
  }, [sectionSchema])

  const handleSchemaChange = (newSchema: any) => {
    setCurrentSchema(newSchema)
  }

  const handleSaveAsTemplate = async (schema: any) => {
    try {
      // TODO: Implement API call to save schema as template
      console.log('Saving schema as template:', schema)
      alert('Template saved successfully!')
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('Failed to save template')
    }
  }

  // Handle content changes (only update local state, save on blur)
  const handleContentChange = useCallback((newContent: string) => {
    // Just update local state, don't save yet
    onUpdateSectionAction(section.id, newContent, false); // Don't save on every keystroke
  }, [section.id, onUpdateSectionAction]);

  // Handle blur - save the content
  const handleContentBlur = useCallback((newContent: string) => {
    onUpdateSectionAction(section.id, newContent, true); // Save on blur
  }, [section.id, onUpdateSectionAction]);

  return (
    <Card className="w-full mb-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span>{section.title}</span>
            {hasStructuredSchema && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTab('structured')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    tab === 'structured' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Structured
                </button>
                <button
                  onClick={() => setTab('editor')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    tab === 'editor' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Editor
                </button>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 h-full">
        {/* Tab Content */}
        {hasStructuredSchema && tab === 'structured' ? (
          <DynamicStructuredBlock
            schema={currentSchema || sectionSchema!}
            initialData={{}}
            onChange={(structuredData, generatedText) => {
              try {
                setGeneratedContent(generatedText);
                console.log('Structured data:', structuredData);
              } catch (error) {
                console.error('Error handling structured content change:', error);
              }
            }}
            onSchemaChange={handleSchemaChange}
            onSaveAsTemplate={handleSaveAsTemplate}
          />
        ) : (
          <div className="h-full">
            <TiptapEditor
              content={hasStructuredSchema ? generatedContent : section.content}
              onChange={hasStructuredSchema ? () => {} : handleContentChange}
              onBlur={hasStructuredSchema ? () => {} : handleContentBlur}
              editable={!hasStructuredSchema}
              withBorder={false}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}