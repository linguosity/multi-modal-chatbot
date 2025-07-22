'use client'

import React, { useState, useEffect } from 'react'

interface ValidityStatementData {
  is_valid: boolean
  student_cooperation: {
    cooperative: boolean
    understanding: string
    custom_notes: string
  }
  validity_factors: {
    attention_issues: boolean
    motivation_problems: boolean
    cultural_considerations: boolean
    other: string
  }
}

interface ValidityStatementBlockProps {
  initialData?: ValidityStatementData
  onChange: (data: ValidityStatementData, generatedText: string) => void
}

const DEFAULT_DATA: ValidityStatementData = {
  is_valid: true,
  student_cooperation: { cooperative: true, understanding: '', custom_notes: '' },
  validity_factors: { attention_issues: false, motivation_problems: false, cultural_considerations: false, other: '' }
}

export default function ValidityStatementBlock({ initialData = DEFAULT_DATA, onChange }: ValidityStatementBlockProps) {
  const [data, setData] = useState<ValidityStatementData>(initialData)

  const generateText = (currentData: ValidityStatementData) => {
    const studentName = '[Student]'
    let text = `The results of this evaluation are considered to be a ${currentData.is_valid ? 'valid' : 'potentially invalid'} representation of ${studentName}'s current speech and language skills. `
    
    if (currentData.student_cooperation.cooperative) {
      text += `${studentName} was cooperative throughout the assessment and appeared to understand task directions. `
    } else {
      text += `${studentName} showed some difficulty with cooperation during the assessment. `
    }

    if (currentData.student_cooperation.understanding) {
      text += `${currentData.student_cooperation.understanding} `
    }

    const factors = []
    if (currentData.validity_factors.attention_issues) factors.push('attention difficulties')
    if (currentData.validity_factors.motivation_problems) factors.push('motivation issues')
    if (currentData.validity_factors.cultural_considerations) factors.push('cultural/linguistic considerations')
    if (currentData.validity_factors.other) factors.push(currentData.validity_factors.other)

    if (factors.length > 0) {
      text += `Factors that may have affected test validity include: ${factors.join(', ')}.`
    }

    if (currentData.student_cooperation.custom_notes) {
      text += ` ${currentData.student_cooperation.custom_notes}`
    }

    return text
  }

  const updateData = (newData: ValidityStatementData) => {
    setData(newData)
    const generatedText = generateText(newData)
    onChange(newData, generatedText)
  }

  // Generate initial text
  useEffect(() => {
    const generatedText = generateText(data)
    onChange(data, generatedText)
  }, [])

  return (
    <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
      {/* Generated Preview */}
      <div className="mb-4 p-3 bg-white rounded border text-sm leading-relaxed">
        <div className="text-xs text-blue-600 mb-2 font-medium">Generated Text:</div>
        {generateText(data)}
      </div>

      {/* Structured Inputs */}
      <div className="space-y-4">
        {/* Overall Validity */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Results are:</label>
          <div className="flex gap-2">
            <button
              onClick={() => updateData({ ...data, is_valid: true })}
              className={`px-3 py-1 rounded text-xs ${
                data.is_valid ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Valid
            </button>
            <button
              onClick={() => updateData({ ...data, is_valid: false })}
              className={`px-3 py-1 rounded text-xs ${
                !data.is_valid ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Invalid
            </button>
          </div>
        </div>

        {/* Student Cooperation */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Student Cooperation</h4>
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600">Cooperative:</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateData({
                  ...data,
                  student_cooperation: { ...data.student_cooperation, cooperative: true }
                })}
                className={`px-2 py-1 rounded text-xs ${
                  data.student_cooperation.cooperative ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => updateData({
                  ...data,
                  student_cooperation: { ...data.student_cooperation, cooperative: false }
                })}
                className={`px-2 py-1 rounded text-xs ${
                  !data.student_cooperation.cooperative ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                No
              </button>
            </div>
          </div>
          
          <input
            type="text"
            placeholder="Additional understanding notes..."
            value={data.student_cooperation.understanding}
            onChange={(e) => updateData({
              ...data,
              student_cooperation: { ...data.student_cooperation, understanding: e.target.value }
            })}
            className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          
          <input
            type="text"
            placeholder="Custom notes..."
            value={data.student_cooperation.custom_notes}
            onChange={(e) => updateData({
              ...data,
              student_cooperation: { ...data.student_cooperation, custom_notes: e.target.value }
            })}
            className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Validity Factors */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Validity Factors</h4>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {[
              { key: 'attention_issues', label: 'Attention issues' },
              { key: 'motivation_problems', label: 'Motivation problems' },
              { key: 'cultural_considerations', label: 'Cultural considerations' }
            ].map(factor => (
              <label key={factor.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data.validity_factors[factor.key as keyof typeof data.validity_factors]}
                  onChange={(e) => updateData({
                    ...data,
                    validity_factors: { ...data.validity_factors, [factor.key]: e.target.checked }
                  })}
                  className="rounded"
                />
                <span className="text-gray-600">{factor.label}</span>
              </label>
            ))}
          </div>
          
          <input
            type="text"
            placeholder="Other factors..."
            value={data.validity_factors.other}
            onChange={(e) => updateData({
              ...data,
              validity_factors: { ...data.validity_factors, other: e.target.value }
            })}
            className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )
}