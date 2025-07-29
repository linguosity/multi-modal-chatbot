'use client'

import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { FieldHighlight } from './ui/FieldHighlight'

interface StandardizedTest {
  test_name?: string
  test_title?: string
  scores?: {
    standard_score?: number
    percentile?: number
    qualitative_description?: string
    total_language?: {
      standard_score?: number
      percentile?: number
      description?: string
    }
    auditory_comprehension?: {
      standard_score?: number
      percentile?: number
      description?: string
    }
    expressive_communication?: {
      standard_score?: number
      percentile?: number
      description?: string
    }
  }
  standard_score?: number
  percentile?: number
  description?: string
  test_summary?: {
    author?: string
    target_population?: string
    domains_assessed?: string
  }
}

interface StandardizedTestEditorProps {
  tests: StandardizedTest[]
  onChange: (tests: StandardizedTest[]) => void
  sectionId?: string
}

export function StandardizedTestEditor({ tests, onChange, sectionId }: StandardizedTestEditorProps) {
  const addTest = () => {
    const newTest: StandardizedTest = {
      test_title: '',
      scores: {
        standard_score: 0,
        percentile: 0,
        qualitative_description: ''
      },
      test_summary: {
        author: '',
        target_population: '',
        domains_assessed: ''
      }
    }
    onChange([...tests, newTest])
  }

  const updateTest = (index: number, field: string, value: any) => {
    const updatedTests = [...tests]
    if (field.includes('.')) {
      // Handle nested field updates
      const [parent, child] = field.split('.')
      updatedTests[index] = {
        ...updatedTests[index],
        [parent]: {
          ...updatedTests[index][parent as keyof StandardizedTest],
          [child]: value
        }
      }
    } else {
      updatedTests[index] = { ...updatedTests[index], [field]: value }
    }
    onChange(updatedTests)
  }

  const removeTest = (index: number) => {
    const updatedTests = tests.filter((_, i) => i !== index)
    onChange(updatedTests)
  }

  const getTestName = (test: StandardizedTest) => {
    return test.test_title || test.test_name || 'Unnamed Test'
  }

  const getMainScore = (test: StandardizedTest) => {
    // Handle different score structures from AI
    if (test.scores?.standard_score) return test.scores.standard_score
    if (test.standard_score) return test.standard_score
    if (test.scores?.total_language?.standard_score) return test.scores.total_language.standard_score
    return 0
  }

  const getMainPercentile = (test: StandardizedTest) => {
    if (test.scores?.percentile) return test.scores.percentile
    if (test.percentile) return test.percentile
    if (test.scores?.total_language?.percentile) return test.scores.total_language.percentile
    return 0
  }

  const getMainDescription = (test: StandardizedTest) => {
    if (test.scores?.qualitative_description) return test.scores.qualitative_description
    if (test.description) return test.description
    if (test.scores?.total_language?.description) return test.scores.total_language.description
    return ''
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-800">Standardized Tests</h4>
        <button
          onClick={addTest}
          className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add Test
        </button>
      </div>

      <div className="space-y-4">
        {tests.map((test, index) => (
          <div key={index} className="pl-4 border-l-2 border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium text-gray-800">
                {getTestName(test)}
              </h5>
              <button
                onClick={() => removeTest(index)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove test"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
                <FieldHighlight sectionId={sectionId || ''} fieldPath={`standardized_tests.${index}.scores.standard_score`}>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Score:</label>
                    <input
                      type="number"
                      value={getMainScore(test)}
                      onChange={(e) => updateTest(index, 'scores.standard_score', parseInt(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </FieldHighlight>

                <FieldHighlight sectionId={sectionId || ''} fieldPath={`standardized_tests.${index}.scores.percentile`}>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Percentile:</label>
                    <input
                      type="number"
                      value={getMainPercentile(test)}
                      onChange={(e) => updateTest(index, 'scores.percentile', parseInt(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </FieldHighlight>

                <FieldHighlight sectionId={sectionId || ''} fieldPath={`standardized_tests.${index}.scores.qualitative_description`}>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Level:</label>
                    <input
                      type="text"
                      value={getMainDescription(test)}
                      onChange={(e) => updateTest(index, 'scores.qualitative_description', e.target.value)}
                      placeholder="e.g., Average"
                      className="w-36 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </FieldHighlight>
              </div>

              {/* Collapsible subtest scores */}
              {test.scores?.auditory_comprehension && (
                <details className="group/details">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                    Subtests
                  </summary>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Auditory Comprehension</span>
                      <span className="font-medium">{test.scores.auditory_comprehension.standard_score} ({test.scores.auditory_comprehension.percentile}%)</span>
                    </div>
                    {test.scores.expressive_communication && (
                      <div className="flex justify-between">
                        <span>Expressive Communication</span>
                        <span className="font-medium">{test.scores.expressive_communication.standard_score} ({test.scores.expressive_communication.percentile}%)</span>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          ))}

        {tests.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
            No standardized tests added yet.
          </div>
        )}
      </div>
    </div>
  )
}