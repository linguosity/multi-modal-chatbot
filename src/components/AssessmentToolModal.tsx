'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
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

interface AssessmentToolModalProps {
  tool: AssessmentTool
  isOpen: boolean
  onClose: () => void
  onUpdate: (field: string, value: any) => void
  sectionId?: string
  index: number
}

export function AssessmentToolModal({ 
  tool, 
  isOpen, 
  onClose, 
  onUpdate, 
  sectionId, 
  index 
}: AssessmentToolModalProps) {
  const [activeTab, setActiveTab] = useState<'tool' | 'scores' | 'details'>('tool')

  // Reset to first tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('tool')
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden' // Prevent background scroll
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal - positioned relative to viewport with consistent padding */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-full overflow-y-auto border border-gray-200"
           style={{ 
             maxHeight: 'calc(100vh - 4rem)', // Ensures consistent padding from top/bottom
             width: 'calc(100vw - 4rem)', // Ensures consistent padding from left/right
             maxWidth: '80rem' // Reasonable max width for very wide screens
           }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-[var(--clr-accent)] rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-900">
              Assessment Tool Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-lg transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-8" aria-label="Tabs">
            {[
              { id: 'tool', name: 'Tool', icon: '🔧' },
              { id: 'scores', name: 'Scores', icon: '📊' },
              { id: 'details', name: 'Details', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-[var(--clr-accent)] text-[var(--clr-accent)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {/* Tool Tab */}
          {activeTab === 'tool' && (
            <div className="space-y-6 bg-gradient-to-r from-gray-50 to-blue-50/30 p-6 rounded-lg border border-gray-100">
            <FieldHighlight sectionId={sectionId || ''} fieldPath={`assessment_tools.${index}.tool_name`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Tool Name</label>
                <input
                  type="text"
                  value={tool.tool_name}
                  onChange={(e) => onUpdate('tool_name', e.target.value)}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)] focus:border-[var(--clr-accent)] transition-all duration-200"
                  placeholder="e.g., PLS-5, Language Sample, Classroom Observation"
                />
              </div>
            </FieldHighlight>

            <FieldHighlight sectionId={sectionId || ''} fieldPath={`assessment_tools.${index}.tool_type`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Type</label>
                <select
                  value={tool.tool_type || ''}
                  onChange={(e) => onUpdate('tool_type', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)] focus:border-[var(--clr-accent)] transition-all duration-200"
                >
                  <option value="">Select type...</option>
                  <option value="Standardized Test">Standardized Test</option>
                  <option value="Informal Assessment">Informal Assessment</option>
                  <option value="Observation">Observation</option>
                  <option value="Interview">Interview</option>
                </select>
              </div>
            </FieldHighlight>
            </div>
          )}

          {/* Scores Tab */}
          {activeTab === 'scores' && (
            <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[var(--clr-accent)] rounded-full"></div>
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Test Scores</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <FieldHighlight sectionId={sectionId || ''} fieldPath={`assessment_tools.${index}.standard_score`}>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Standard Score</label>
                  <input
                    type="number"
                    value={tool.standard_score || ''}
                    onChange={(e) => onUpdate('standard_score', parseInt(e.target.value) || undefined)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)] focus:border-[var(--clr-accent)] transition-all duration-200"
                    placeholder="e.g., 85"
                  />
                </div>
              </FieldHighlight>

              <FieldHighlight sectionId={sectionId || ''} fieldPath={`assessment_tools.${index}.percentile`}>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Percentile Rank</label>
                  <input
                    type="number"
                    value={tool.percentile || ''}
                    onChange={(e) => onUpdate('percentile', parseInt(e.target.value) || undefined)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)] focus:border-[var(--clr-accent)] transition-all duration-200"
                    placeholder="e.g., 16"
                  />
                </div>
              </FieldHighlight>
            </div>

            <FieldHighlight sectionId={sectionId || ''} fieldPath={`assessment_tools.${index}.qualitative_description`}>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Results & Interpretation</label>
                <textarea
                  value={tool.qualitative_description || ''}
                  onChange={(e) => onUpdate('qualitative_description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)] focus:border-[var(--clr-accent)] resize-none transition-all duration-200"
                  placeholder="Describe the results, interpretation, observations, or qualitative findings..."
                />
              </div>
            </FieldHighlight>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6 bg-gray-50/50 p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-[var(--clr-accent)] rounded-full"></div>
                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Test Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
              <FieldHighlight sectionId={sectionId || ''} fieldPath={`assessment_tools.${index}.author`}>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Author(s)</label>
                  <input
                    type="text"
                    value={tool.author || ''}
                    onChange={(e) => onUpdate('author', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)] focus:border-[var(--clr-accent)] transition-all duration-200"
                    placeholder="Test author(s)"
                  />
                </div>
              </FieldHighlight>

              <FieldHighlight sectionId={sectionId || ''} fieldPath={`assessment_tools.${index}.year_published`}>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Year Published</label>
                  <input
                    type="number"
                    value={tool.year_published || ''}
                    onChange={(e) => onUpdate('year_published', parseInt(e.target.value) || undefined)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)] focus:border-[var(--clr-accent)] transition-all duration-200"
                    placeholder="Publication year"
                  />
                </div>
              </FieldHighlight>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50/30">
          <button
            onClick={onClose}
            className="px-6 py-3 text-sm font-medium text-white bg-[var(--clr-accent)] border border-[var(--clr-accent)] rounded-lg hover:bg-[var(--clr-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--clr-accent)] focus:ring-offset-2 transition-all duration-200 shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )

  // Render modal in a portal at document body level
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null
}