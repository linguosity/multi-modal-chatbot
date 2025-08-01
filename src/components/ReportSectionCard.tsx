'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Info, Pencil, Puzzle } from 'lucide-react'
import { useReport } from '@/lib/context/ReportContext'
import TiptapEditor from './TiptapEditor'
import DynamicStructuredBlock from './DynamicStructuredBlock'
import { ReportSection } from '@/lib/schemas/report'
import { getSectionSchemaForType } from '@/lib/structured-schemas'
import { useRecentUpdates } from '@/lib/context/RecentUpdatesContext'
import { cn } from '@/lib/utils'

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
  const { updateSectionData } = useReport();
  const { isRecentlyUpdated, clearRecentUpdate } = useRecentUpdates();
  const [tab, setTab] = useState<'report' | 'template'>('report')
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [currentSchema, setCurrentSchema] = useState<any>(null)
  const [isClicked, setIsClicked] = useState(false)

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

  // Handle section click to clear update indicator
  const handleSectionClick = useCallback(() => {
    console.log(`🖱️ Section clicked: ${section.id} (${section.title})`);
    console.log(`📊 Is recently updated: ${isRecentlyUpdated(section.id)}, Is clicked: ${isClicked}`);
    
    if (isRecentlyUpdated(section.id) && !isClicked) {
      console.log(`✨ Starting fade animation for section ${section.id}`);
      setIsClicked(true);
      // Clear the update indicator after a brief delay to show the fade animation
      setTimeout(() => {
        console.log(`🧹 Clearing indicator for section ${section.id} after fade`);
        clearRecentUpdate(section.id);
        setIsClicked(false);
      }, 300);
    }
  }, [section.id, section.title, isRecentlyUpdated, clearRecentUpdate, isClicked]);

  // Check if this section was recently updated
  const isUpdated = isRecentlyUpdated(section.id);
  const shouldShowUpdateIndicator = isUpdated && !isClicked;

  return (
    <Card 
      className={cn(
        "w-full mb-4 transition-all duration-300 cursor-pointer",
        shouldShowUpdateIndicator && "bg-blue-50 border-blue-200 shadow-lg shadow-blue-100/50 ring-1 ring-blue-200/30",
        isClicked && "bg-blue-25"
      )}
      onClick={handleSectionClick}
    >
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className={cn(
              "transition-colors duration-300",
              shouldShowUpdateIndicator && "text-blue-700 font-medium"
            )}>
              {section.title}
            </span>
            {shouldShowUpdateIndicator && (
              <div className="flex items-center gap-1 text-blue-600 text-sm animate-fade-in">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">Updated</span>
              </div>
            )}
            {hasStructuredSchema && (
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => setTab('report')}
                  variant={tab === 'report' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Report
                </Button>
                <Button
                  onClick={() => setTab('template')}
                  variant={tab === 'template' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Puzzle className="h-4 w-4" />
                  Template
                </Button>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 h-full">
        {/* Tab Content */}
        {hasStructuredSchema && tab === 'report' ? (
          <DynamicStructuredBlock
            schema={currentSchema || sectionSchema!}
            initialData={section.structured_data} // Pass structured_data for template mode
            onChange={(structuredData, generatedText) => {
              try {
                setGeneratedContent(generatedText);
                try {
                  console.log('Structured data:', JSON.stringify(structuredData, null, 2));
                } catch (e) {
                  console.log('Structured data: [Circular Reference Detected]');
                }
              } catch (error) {
                console.error('Error handling structured content change:', error);
              }
            }}
            onSchemaChange={handleSchemaChange}
            onSaveAsTemplate={handleSaveAsTemplate}
            mode="data"
            updateSectionData={(sectionId, data) => updateSectionData(sectionId, data)}
          />
        ) : hasStructuredSchema && tab === 'template' ? (
          <DynamicStructuredBlock
            schema={currentSchema || sectionSchema!}
            initialData={section.structured_data} // Pass structured_data for template mode
            onChange={() => {}}
            onSchemaChange={handleSchemaChange}
            onSaveAsTemplate={handleSaveAsTemplate}
            mode="template"
            updateSectionData={(sectionId, data) => updateSectionData(sectionId, data)}
          />
        ) : (
          <div className="h-full">
            <TiptapEditor
              content={hasStructuredSchema ? generatedContent : section.content}
              onChange={handleContentChange}
              onBlur={handleContentBlur}
              editable={!hasStructuredSchema}
              withBorder={false}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}