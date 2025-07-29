'use client'

import React from 'react'
import { FieldHighlight } from './ui/FieldHighlight'

interface AssessmentTool {
  tool_name: string
  tool_type?: string
  author?: string
  year_published?: number
  standard_score?: number
  percentile?: number
  qualitative_description?: string
}

interface AssessmentToolCardProps {
  tool: AssessmentTool
  index: number
  onUpdate: (field: string, value: any) => void
  onRemove: () => void
  sectionId?: string
}

export function AssessmentToolCard({ tool, index, onUpdate, onRemove, sectionId }: AssessmentToolCardProps) {
  const hasScores = tool.standard_score || tool.percentile || tool.qualitative_description

  return (
    <div className="group relative bg-white ring-1 ring-slate-200 rounded-[var(--radius)] p-[var(--pad-card)] hover:shadow-sm transition-shadow">
      {/* Remove button - hidden until hover */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
        title="Remove assessment tool"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {/* Tool name and type */}
      <div className="mb-3">
        <FieldHighlight sectionId={sectionId || ''} fieldPath={`assessment_tools.${index}.tool_name`}>
          <input
            type="text"
            value={tool.tool_name}
            onChange={(e) => onUpdate('tool_name', e.target.value)}
            placeholder="Assessment tool name"
            className="w-full text-[var(--text-base)] font-medium bg-transparent border-0 p-0 focus:outline-none focus:ring-0 placeholder:text-slate-400"
          />
        </FieldHighlight>
        
        {tool.tool_type && (
          <FieldHighlight sectionId={sectionId || ''} fieldPath={`assessment_tools.${index}.tool_type`}>
            <select
              value={tool.tool_type}
              onChange={(e) => onUpdate('tool_type', e.target.value)}
              className="mt-1 text-[var(--text-label)] text-slate-500 bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
            >
              <option value="">Select type...</option>
              <option value="Standardized Test">Standardized Test</option>
              <option value="Informal Assessment">Informal Assessment</option>
              <option value="Observation">Observation</option>
              <option value="Interview">Interview</option>
            </select>
          </FieldHighlight>
        )}
      </div>

      {/* Author and year - only show if populated */}
      {(tool.author || tool.year_published) && (
        <div className="mb-3 text-[var(--text-label)] text-slate-500">
          {tool.author && (
            <FieldHighlight sectionId={sectionId || ''} fieldPath={`assessment_tools.${index}.author`}>
              <input
                type="text"
                value={tool.author}
                onChange={(e) => onUpdate('author', e.target.value)}
                placeholder="Author(s)"
                className="bg-transparent border-0 p-0 focus:outline-none focus:ring-0 placeholder:text-slate-300"
              />
            </FieldHighlight>
          )}
          {tool.author && tool.year_published && <span className="mx-1">•</span>}
          {tool.year_published && (
            <FieldHighlight sectionId={sectionId || ''} fieldPath={`assessment_tools.${index}.year_published`}>
              <input
                type="number"
                value={tool.year_published || ''}
                onChange={(e) => onUpdate('year_published', parseInt(e.target.value) || undefined)}
                placeholder="Year"
                className="w-16 bg-transparent border-0 p-0 focus:outline-none focus:ring-0 placeholder:text-slate-300"
              />
            </FieldHighlight>
          )}
        </div>
      )}

      {/* Scores - only show if any are populated */}
      {hasScores && (
        <div className="grid grid-cols-3 gap-2">
          {tool.standard_score && (
            <FieldHighlight sectionId={sectionId || ''} fieldPath={`assessment_tools.${index}.standard_score`}>
              <div>
                <label className="block text-[var(--text-label)] font-medium text-slate-500 uppercase tracking-wide mb-1">Score</label>
                <input
                  type="number"
                  value={tool.standard_score}
                  onChange={(e) => onUpdate('standard_score', parseInt(e.target.value) || undefined)}
                  className="w-full text-[var(--text-base)] font-medium bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
                />
              </div>
            </FieldHighlight>
          )}
          
          {tool.percentile && (
            <FieldHighlight sectionId={sectionId || ''} fieldPath={`assessment_tools.${index}.percentile`}>
              <div>
                <label className="block text-[var(--text-label)] font-medium text-slate-500 uppercase tracking-wide mb-1">%ile</label>
                <input
                  type="number"
                  value={tool.percentile}
                  onChange={(e) => onUpdate('percentile', parseInt(e.target.value) || undefined)}
                  className="w-full text-[var(--text-base)] font-medium bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
                />
              </div>
            </FieldHighlight>
          )}
          
          {tool.qualitative_description && (
            <FieldHighlight sectionId={sectionId || ''} fieldPath={`assessment_tools.${index}.qualitative_description`}>
              <div>
                <label className="block text-[var(--text-label)] font-medium text-slate-500 uppercase tracking-wide mb-1">Level</label>
                <input
                  type="text"
                  value={tool.qualitative_description}
                  onChange={(e) => onUpdate('qualitative_description', e.target.value)}
                  placeholder="Below Avg"
                  className="w-full text-[var(--text-base)] font-medium bg-transparent border-0 p-0 focus:outline-none focus:ring-0 placeholder:text-slate-300"
                />
              </div>
            </FieldHighlight>
          )}
        </div>
      )}

      {/* Add fields button for empty fields */}
      {!hasScores && (
        <button
          onClick={() => {
            onUpdate('standard_score', 0)
            onUpdate('percentile', 0)
            onUpdate('qualitative_description', '')
          }}
          className="mt-2 text-[var(--text-label)] text-slate-400 hover:text-slate-600 transition-colors"
        >
          + Add scores
        </button>
      )}
    </div>
  )
}