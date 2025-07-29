'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Eye, Download, RefreshCw, MapPin, AlertCircle } from 'lucide-react'
import { Button } from './ui/button'
import TiptapEditor from './TiptapEditor'
import { useRecentUpdates } from '@/lib/context/RecentUpdatesContext'

interface SourceMapping {
  id: string
  text: string
  sources: {
    sectionId: string
    sectionTitle: string
    fieldPath: string
    fieldLabel: string
    value: any
    confidence: number
  }[]
  startIndex: number
  endIndex: number
}

interface NarrativeViewProps {
  reportId: string
  sectionId: string
  sectionTitle: string
  structuredData: any
  onRegenerateNarrative: () => Promise<void>
}

export function NarrativeView({
  reportId,
  sectionId,
  sectionTitle,
  structuredData,
  onRegenerateNarrative
}: NarrativeViewProps) {
  const [narrative, setNarrative] = useState('')
  const [sourceMappings, setSourceMappings] = useState<SourceMapping[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [hoveredMapping, setHoveredMapping] = useState<string | null>(null)
  const [selectedMapping, setSelectedMapping] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  // For tracking AI-generated changes in TOC
  const { addRecentUpdate } = useRecentUpdates()

  // Don't auto-generate - only generate when user clicks button

  // Check if there's sufficient data to generate narrative
  const hasValidData = () => {
    if (!structuredData || typeof structuredData !== 'object') return false
    
    // Check if there's any meaningful data
    const hasData = Object.values(structuredData).some(value => {
      if (value === null || value === undefined || value === '') return false
      if (Array.isArray(value) && value.length === 0) return false
      if (typeof value === 'object' && Object.keys(value).length === 0) return false
      if (typeof value === 'string' && value.trim() === '') return false
      return true
    })
    
    return hasData
  }

  const generateNarrative = async () => {
    if (!hasValidData()) {
      setNarrative('Please add some data to the section above before generating a narrative.')
      setSourceMappings([])
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/generate-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          sectionId,
          sectionTitle,
          structuredData,
          includeSourceMapping: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to generate narrative`)
      }

      const result = await response.json()
      setNarrative(result.narrative || 'No narrative was generated.')
      setSourceMappings(result.sourceMappings || [])
      
      // 🎯 Create "residue" - mark this section as AI-updated in TOC
      if (result.narrative) {
        console.log('✨ Adding AI narrative residue for section:', sectionId)
        addRecentUpdate(sectionId, ['ai_narrative'], 'ai_narrative_generated')
      }
    } catch (error) {
      console.error('Failed to generate narrative:', error)
      setNarrative(`Error: ${error instanceof Error ? error.message : 'Failed to generate narrative. Please try again.'}`)
      setSourceMappings([])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerateSection = async (mappingId: string) => {
    const mapping = sourceMappings.find(m => m.id === mappingId)
    if (!mapping) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/regenerate-narrative-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          sectionId,
          mappingId,
          currentText: mapping.text,
          sources: mapping.sources
        })
      })

      if (!response.ok) throw new Error('Failed to regenerate section')

      const result = await response.json()
      
      // Update the narrative with the new text
      const newNarrative = narrative.substring(0, mapping.startIndex) + 
                          result.newText + 
                          narrative.substring(mapping.endIndex)
      
      setNarrative(newNarrative)
      
      // Update the mapping
      const updatedMappings = sourceMappings.map(m => 
        m.id === mappingId 
          ? { ...m, text: result.newText, endIndex: mapping.startIndex + result.newText.length }
          : m
      )
      setSourceMappings(updatedMappings)
    } catch (error) {
      console.error('Failed to regenerate section:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const exportToPDF = async () => {
    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          sectionId,
          narrative,
          sectionTitle
        })
      })

      if (!response.ok) throw new Error('Failed to export PDF')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sectionTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_narrative.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export PDF:', error)
    }
  }

  const renderNarrativeWithMappings = () => {
    if (!narrative || sourceMappings.length === 0) {
      return (
        <div className="prose max-w-none">
          <TiptapEditor
            content={narrative}
            onChange={setNarrative}
            editable={isEditing}
            withBorder={false}
          />
        </div>
      )
    }

    // Split narrative into segments based on source mappings
    const segments: Array<{ text: string; mapping?: SourceMapping }> = []
    let lastIndex = 0

    sourceMappings
      .sort((a, b) => a.startIndex - b.startIndex)
      .forEach(mapping => {
        // Add text before this mapping
        if (mapping.startIndex > lastIndex) {
          segments.push({
            text: narrative.substring(lastIndex, mapping.startIndex)
          })
        }

        // Add the mapped text
        segments.push({
          text: mapping.text,
          mapping
        })

        lastIndex = mapping.endIndex
      })

    // Add remaining text
    if (lastIndex < narrative.length) {
      segments.push({
        text: narrative.substring(lastIndex)
      })
    }

    return (
      <div className="prose max-w-none leading-relaxed">
        {segments.map((segment, index) => (
          <span key={index}>
            {segment.mapping ? (
              <span
                className={`relative cursor-pointer transition-all duration-200 ${
                  hoveredMapping === segment.mapping.id || selectedMapping === segment.mapping.id
                    ? 'bg-blue-100 border-b-2 border-blue-400 px-1 rounded-sm'
                    : 'hover:bg-blue-50 px-1 rounded-sm'
                }`}
                onMouseEnter={() => setHoveredMapping(segment.mapping!.id)}
                onMouseLeave={() => setHoveredMapping(null)}
                onClick={() => setSelectedMapping(
                  selectedMapping === segment.mapping!.id ? null : segment.mapping!.id
                )}
              >
                {segment.text}
                {(hoveredMapping === segment.mapping.id || selectedMapping === segment.mapping.id) && (
                  <MapPin className="inline h-3 w-3 ml-1 text-blue-500" />
                )}
              </span>
            ) : (
              <span>{segment.text}</span>
            )}
          </span>
        ))}
      </div>
    )
  }

  const selectedMappingData = sourceMappings.find(m => m.id === selectedMapping)

  return (
    <div className="space-y-4">
      {/* Compact Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isGenerating && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating narrative...
            </div>
          )}
          {!hasValidData() && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              Add data above to generate narrative
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isExpanded && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              Collapse
            </Button>
          )}
          
          <Button
            variant={narrative ? "secondary" : "primary"}
            size="sm"
            onClick={generateNarrative}
            disabled={isGenerating || !hasValidData()}
            className="flex items-center gap-1"
            title={!hasValidData() ? "Add some data to the section above first" : ""}
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {narrative ? 'Regenerate' : 'Generate'} Narrative
          </Button>

          {narrative && (
            <>
              {!isExpanded && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsExpanded(true)}
                  className="flex items-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  Expand
                </Button>
              )}
              
              <Button
                variant="secondary"
                size="sm"
                onClick={exportToPDF}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${isExpanded ? 'grid grid-cols-1 lg:grid-cols-3 gap-6' : ''}`}>
        {/* Narrative Content */}
        <div className={isExpanded ? 'lg:col-span-2' : ''}>
          <div className={`bg-white/70 backdrop-blur-sm border border-blue-200/40 rounded-lg p-5 shadow-sm ${isExpanded ? 'min-h-[500px]' : 'min-h-[200px]'}`}>
            {isGenerating ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-blue-600/80">Generating narrative...</p>
                </div>
              </div>
            ) : !narrative ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm mb-2">No narrative generated yet</p>
                  <p className="text-xs text-gray-400">
                    {hasValidData() 
                      ? 'Click "Generate Narrative" to create AI-powered prose from your data'
                      : 'Add some data to the section above, then generate a narrative'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className={`${isExpanded ? '' : 'max-h-48 overflow-y-auto'}`}>
                {renderNarrativeWithMappings()}
              </div>
            )}
          </div>
        </div>

        {/* Source Panel - Only show when expanded */}
        {isExpanded && (
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm border border-blue-200/40 rounded-lg p-4 sticky top-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Source Information
              </h4>

              {selectedMappingData ? (
                <div className="space-y-4">
                  <div className="bg-blue-50/50 p-3 rounded border border-blue-200/30">
                    <p className="text-sm font-medium text-blue-800 mb-2">Selected Text:</p>
                    <p className="text-sm text-blue-900 italic">"{selectedMappingData.text}"</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Data Sources:</p>
                    {selectedMappingData.sources.map((source, index) => (
                      <div key={index} className="bg-blue-50/30 p-3 rounded border border-blue-200/30 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">{source.sectionTitle}</span>
                          <span className="text-xs text-gray-500">
                            {Math.round(source.confidence * 100)}% confidence
                          </span>
                        </div>
                        <p className="text-gray-600 mb-1">{source.fieldLabel}</p>
                        <p className="text-gray-900 font-mono text-xs bg-white/80 p-1 rounded">
                          {typeof source.value === 'object' 
                            ? JSON.stringify(source.value) 
                            : String(source.value)
                          }
                        </p>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRegenerateSection(selectedMappingData.id)}
                    disabled={isGenerating}
                    className="w-full flex items-center gap-1"
                  >
                    <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    Regenerate This Section
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Click on highlighted text to see its data sources</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instructions - Only show when expanded */}
      {isExpanded && (
        <div className="bg-blue-50/60 backdrop-blur-sm border border-blue-200/40 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 mb-2 text-sm">How to use Narrative View:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• <strong>Hover</strong> over text to see which parts are sourced from your data</li>
            <li>• <strong>Click</strong> highlighted text to view detailed source information</li>
            <li>• <strong>Regenerate</strong> specific sections to refine the narrative</li>
            <li>• <strong>Export PDF</strong> creates a clean, professional report</li>
          </ul>
        </div>
      )}
    </div>
  )
}