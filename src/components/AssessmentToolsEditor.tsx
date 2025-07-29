'use client'

import React, { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { FieldHighlight } from './ui/FieldHighlight'

interface FormalAssessment {
  tool_name: string
  acronym?: string
  authors?: string
  year_published?: number
  target_population?: string
  purpose?: string
}

interface InformalAssessment {
  tool_name: string
  tool_description?: string
  typical_use?: string
  specific_use_case?: string
  target_population?: string
}

interface ObservationContext {
  context_name: string
  context_description?: string
  duration?: string
  focus_areas?: string
}

interface AssessmentToolsData {
  formal_assessments?: FormalAssessment[]
  informal_assessments?: InformalAssessment[]
  observation_contexts?: ObservationContext[]
}

interface AssessmentToolsEditorProps {
  data: AssessmentToolsData
  onChange: (data: AssessmentToolsData) => void
  sectionId?: string
}

export function AssessmentToolsEditor({ data, onChange, sectionId }: AssessmentToolsEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['formal', 'informal', 'observation']))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const updateData = (field: keyof AssessmentToolsData, value: any) => {
    onChange({ ...data, [field]: value })
  }

  // Formal Assessments
  const addFormalAssessment = () => {
    const newAssessment: FormalAssessment = {
      tool_name: '',
      acronym: '',
      authors: '',
      year_published: new Date().getFullYear(),
      target_population: '',
      purpose: ''
    }
    const current = data.formal_assessments || []
    updateData('formal_assessments', [...current, newAssessment])
  }

  const updateFormalAssessment = (index: number, field: keyof FormalAssessment, value: any) => {
    const current = [...(data.formal_assessments || [])]
    current[index] = { ...current[index], [field]: value }
    updateData('formal_assessments', current)
  }

  const removeFormalAssessment = (index: number) => {
    const current = data.formal_assessments || []
    updateData('formal_assessments', current.filter((_, i) => i !== index))
  }

  // Informal Assessments
  const addInformalAssessment = () => {
    const newAssessment: InformalAssessment = {
      tool_name: '',
      tool_description: '',
      typical_use: '',
      specific_use_case: '',
      target_population: ''
    }
    const current = data.informal_assessments || []
    updateData('informal_assessments', [...current, newAssessment])
  }

  const updateInformalAssessment = (index: number, field: keyof InformalAssessment, value: any) => {
    const current = [...(data.informal_assessments || [])]
    current[index] = { ...current[index], [field]: value }
    updateData('informal_assessments', current)
  }

  const removeInformalAssessment = (index: number) => {
    const current = data.informal_assessments || []
    updateData('informal_assessments', current.filter((_, i) => i !== index))
  }

  // Observation Contexts
  const addObservationContext = () => {
    const newContext: ObservationContext = {
      context_name: '',
      context_description: '',
      duration: '',
      focus_areas: ''
    }
    const current = data.observation_contexts || []
    updateData('observation_contexts', [...current, newContext])
  }

  const updateObservationContext = (index: number, field: keyof ObservationContext, value: any) => {
    const current = [...(data.observation_contexts || [])]
    current[index] = { ...current[index], [field]: value }
    updateData('observation_contexts', current)
  }

  const removeObservationContext = (index: number) => {
    const current = data.observation_contexts || []
    updateData('observation_contexts', current.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Formal Assessments */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('formal')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            {expandedSections.has('formal') ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <h3 className="text-sm font-medium text-gray-800">Formal Assessment Tools</h3>
            <span className="text-xs text-gray-500">
              ({(data.formal_assessments || []).length} tools)
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              addFormalAssessment()
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Tool
          </button>
        </button>

        {expandedSections.has('formal') && (
          <div className="p-4 space-y-4">
            {(data.formal_assessments || []).map((assessment, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Formal Tool {index + 1}: {assessment.tool_name || 'Unnamed Tool'}
                  </h4>
                  <button
                    onClick={() => removeFormalAssessment(index)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldHighlight sectionId={sectionId || ''} fieldPath={`formal_assessments.${index}.tool_name`}>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tool Name *</label>
                      <input
                        type="text"
                        value={assessment.tool_name}
                        onChange={(e) => updateFormalAssessment(index, 'tool_name', e.target.value)}
                        placeholder="Full name of the assessment tool"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </FieldHighlight>

                  <FieldHighlight sectionId={sectionId || ''} fieldPath={`formal_assessments.${index}.acronym`}>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Acronym</label>
                      <input
                        type="text"
                        value={assessment.acronym || ''}
                        onChange={(e) => updateFormalAssessment(index, 'acronym', e.target.value)}
                        placeholder="e.g., PLS-5, CELF-5"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </FieldHighlight>

                  <FieldHighlight sectionId={sectionId || ''} fieldPath={`formal_assessments.${index}.authors`}>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Author(s)</label>
                      <input
                        type="text"
                        value={assessment.authors || ''}
                        onChange={(e) => updateFormalAssessment(index, 'authors', e.target.value)}
                        placeholder="Author names"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </FieldHighlight>

                  <FieldHighlight sectionId={sectionId || ''} fieldPath={`formal_assessments.${index}.year_published`}>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Year Published</label>
                      <input
                        type="number"
                        value={assessment.year_published || ''}
                        onChange={(e) => updateFormalAssessment(index, 'year_published', parseInt(e.target.value) || undefined)}
                        placeholder="Publication year"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </FieldHighlight>

                  <FieldHighlight sectionId={sectionId || ''} fieldPath={`formal_assessments.${index}.target_population`}>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Target Population</label>
                      <input
                        type="text"
                        value={assessment.target_population || ''}
                        onChange={(e) => updateFormalAssessment(index, 'target_population', e.target.value)}
                        placeholder="Age range, population characteristics"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </FieldHighlight>

                  <FieldHighlight sectionId={sectionId || ''} fieldPath={`formal_assessments.${index}.purpose`}>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Purpose of Use</label>
                      <textarea
                        value={assessment.purpose || ''}
                        onChange={(e) => updateFormalAssessment(index, 'purpose', e.target.value)}
                        placeholder="What this tool is designed to assess"
                        rows={2}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  </FieldHighlight>
                </div>
              </div>
            ))}

            {(data.formal_assessments || []).length === 0 && (
              <div className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                No formal assessment tools added yet.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Informal Assessments */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('informal')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            {expandedSections.has('informal') ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <h3 className="text-sm font-medium text-gray-800">Informal Assessment Tools</h3>
            <span className="text-xs text-gray-500">
              ({(data.informal_assessments || []).length} tools)
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              addInformalAssessment()
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Tool
          </button>
        </button>

        {expandedSections.has('informal') && (
          <div className="p-4 space-y-4">
            {(data.informal_assessments || []).map((assessment, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Informal Tool {index + 1}: {assessment.tool_name || 'Unnamed Tool'}
                  </h4>
                  <button
                    onClick={() => removeInformalAssessment(index)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                </div>

                <div className="space-y-3">
                  <FieldHighlight sectionId={sectionId || ''} fieldPath={`informal_assessments.${index}.tool_name`}>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tool Name *</label>
                      <input
                        type="text"
                        value={assessment.tool_name}
                        onChange={(e) => updateInformalAssessment(index, 'tool_name', e.target.value)}
                        placeholder="Name or description of the informal tool"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  </FieldHighlight>

                  <FieldHighlight sectionId={sectionId || ''} fieldPath={`informal_assessments.${index}.tool_description`}>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">What is this tool?</label>
                      <textarea
                        value={assessment.tool_description || ''}
                        onChange={(e) => updateInformalAssessment(index, 'tool_description', e.target.value)}
                        placeholder="Describe what this informal assessment tool is"
                        rows={2}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
                      />
                    </div>
                  </FieldHighlight>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FieldHighlight sectionId={sectionId || ''} fieldPath={`informal_assessments.${index}.typical_use`}>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Typical Use</label>
                        <textarea
                          value={assessment.typical_use || ''}
                          onChange={(e) => updateInformalAssessment(index, 'typical_use', e.target.value)}
                          placeholder="What is this tool typically used for?"
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
                        />
                      </div>
                    </FieldHighlight>

                    <FieldHighlight sectionId={sectionId || ''} fieldPath={`informal_assessments.${index}.specific_use_case`}>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Specific Use Case</label>
                        <textarea
                          value={assessment.specific_use_case || ''}
                          onChange={(e) => updateInformalAssessment(index, 'specific_use_case', e.target.value)}
                          placeholder="How was it used in this specific evaluation?"
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
                        />
                      </div>
                    </FieldHighlight>
                  </div>

                  <FieldHighlight sectionId={sectionId || ''} fieldPath={`informal_assessments.${index}.target_population`}>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Who is it used for?</label>
                      <input
                        type="text"
                        value={assessment.target_population || ''}
                        onChange={(e) => updateInformalAssessment(index, 'target_population', e.target.value)}
                        placeholder="Target population or age group"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  </FieldHighlight>
                </div>
              </div>
            ))}

            {(data.informal_assessments || []).length === 0 && (
              <div className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                No informal assessment tools added yet.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Observation Contexts */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('observation')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            {expandedSections.has('observation') ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <h3 className="text-sm font-medium text-gray-800">Observation Contexts</h3>
            <span className="text-xs text-gray-500">
              ({(data.observation_contexts || []).length} contexts)
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              addObservationContext()
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Context
          </button>
        </button>

        {expandedSections.has('observation') && (
          <div className="p-4 space-y-4">
            {(data.observation_contexts || []).map((context, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Context {index + 1}: {context.context_name || 'Unnamed Context'}
                  </h4>
                  <button
                    onClick={() => removeObservationContext(index)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FieldHighlight sectionId={sectionId || ''} fieldPath={`observation_contexts.${index}.context_name`}>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Context/Setting *</label>
                      <input
                        type="text"
                        value={context.context_name}
                        onChange={(e) => updateObservationContext(index, 'context_name', e.target.value)}
                        placeholder="e.g., Classroom, Playground, Therapy room"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </FieldHighlight>

                  <FieldHighlight sectionId={sectionId || ''} fieldPath={`observation_contexts.${index}.duration`}>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
                      <input
                        type="text"
                        value={context.duration || ''}
                        onChange={(e) => updateObservationContext(index, 'duration', e.target.value)}
                        placeholder="How long was the observation?"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </FieldHighlight>

                  <FieldHighlight sectionId={sectionId || ''} fieldPath={`observation_contexts.${index}.context_description`}>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                      <textarea
                        value={context.context_description || ''}
                        onChange={(e) => updateObservationContext(index, 'context_description', e.target.value)}
                        placeholder="Describe the observation context and what was observed"
                        rows={2}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                      />
                    </div>
                  </FieldHighlight>

                  <FieldHighlight sectionId={sectionId || ''} fieldPath={`observation_contexts.${index}.focus_areas`}>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Focus Areas</label>
                      <textarea
                        value={context.focus_areas || ''}
                        onChange={(e) => updateObservationContext(index, 'focus_areas', e.target.value)}
                        placeholder="What specific behaviors or skills were observed?"
                        rows={2}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                      />
                    </div>
                  </FieldHighlight>
                </div>
              </div>
            ))}

            {(data.observation_contexts || []).length === 0 && (
              <div className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                No observation contexts added yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}