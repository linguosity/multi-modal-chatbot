'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { AssessmentToolModal } from './AssessmentToolModal'

interface AssessmentTool {
  tool_name: string
  tool_type?: string
  author?: string
  year_published?: number
  standard_score?: number
  percentile?: number
  qualitative_description?: string
}

interface AssessmentToolsGridProps {
  tools: AssessmentTool[]
  onChange: (tools: AssessmentTool[]) => void
  sectionId?: string
}

export function AssessmentToolsGrid({ tools, onChange, sectionId }: AssessmentToolsGridProps) {
  const [selectedTool, setSelectedTool] = useState<{ tool: AssessmentTool; index: number } | null>(null)

  const addTool = () => {
    const newTool: AssessmentTool = {
      tool_name: 'New Assessment Tool',
      tool_type: 'Standardized Test'
    }
    onChange([...tools, newTool])
  }

  const updateTool = (index: number, field: string, value: any) => {
    const updatedTools = [...tools]
    updatedTools[index] = { ...updatedTools[index], [field]: value }
    onChange(updatedTools)
  }

  const removeTool = (index: number) => {
    const updatedTools = tools.filter((_, i) => i !== index)
    onChange(updatedTools)
  }

  const openToolModal = (tool: AssessmentTool, index: number) => {
    setSelectedTool({ tool, index })
  }

  const closeToolModal = () => {
    setSelectedTool(null)
  }

  const updateSelectedTool = (field: string, value: any) => {
    if (selectedTool) {
      updateTool(selectedTool.index, field, value)
      setSelectedTool({
        ...selectedTool,
        tool: { ...selectedTool.tool, [field]: value }
      })
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="text-[var(--text-base)] font-medium text-gray-700">Assessment Tools Used</h4>
      
      {/* Assessment Tools List */}
      <div className="space-y-1">
        {tools.map((tool, index) => (
          <div
            key={index}
            className="group flex items-center justify-between py-2 px-3 border-l-2 border-slate-200 hover:border-[var(--clr-accent)] hover:bg-slate-50 transition-all cursor-pointer"
            onClick={() => openToolModal(tool, index)}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Tool name and type */}
              <div className="flex-1 min-w-0">
                <div className="text-[var(--text-base)] font-medium text-gray-900 truncate">
                  {tool.tool_name || 'Unnamed Tool'}
                </div>
                {tool.tool_type && (
                  <div className="text-[var(--text-label)] text-slate-500">
                    {tool.tool_type}
                  </div>
                )}
              </div>

              {/* Scores (if available) */}
              <div className="flex items-center gap-2 text-[var(--text-label)] text-slate-600">
                {tool.standard_score && (
                  <span className="font-medium">SS: {tool.standard_score}</span>
                )}
                {tool.percentile && (
                  <span className="font-medium">%: {tool.percentile}</span>
                )}
                {tool.qualitative_description && (
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Has qualitative notes">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>
            </div>

            {/* Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeTool(index)
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
              title="Remove assessment tool"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={addTool}
        className="flex items-center gap-2 py-2 px-3 text-[var(--text-base)] text-slate-500 hover:text-[var(--clr-accent)] transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add assessment item
      </button>

      {/* Empty state */}
      {tools.length === 0 && (
        <div className="text-[var(--text-base)] text-slate-400 text-center py-6 border-l-2 border-slate-200">
          No assessment tools added yet
        </div>
      )}

      {/* Assessment Tool Detail Modal */}
      {selectedTool && (
        <AssessmentToolModal
          tool={selectedTool.tool}
          isOpen={true}
          onClose={closeToolModal}
          onUpdate={updateSelectedTool}
          sectionId={sectionId}
          index={selectedTool.index}
        />
      )}
    </div>
  )
}