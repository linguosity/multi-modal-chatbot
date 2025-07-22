'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { useEffect, useState } from 'react'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'

// Validity Statement Block Component
const ValidityStatementView = ({ node, updateAttributes, deleteNode }: any) => {
  const data = node.attrs.data || {
    is_valid: true,
    student_cooperation: { cooperative: true, understanding: '', custom_notes: '' },
    validity_factors: { attention_issues: false, motivation_problems: false, cultural_considerations: false, other: '' }
  }

  const updateData = (newData: any) => {
    updateAttributes({ data: newData })
  }

  const generateText = () => {
    const studentName = '[Student]'
    let text = `The results of this evaluation are considered to be a ${data.is_valid ? 'valid' : 'potentially invalid'} representation of ${studentName}'s current speech and language skills. `
    
    if (data.student_cooperation.cooperative) {
      text += `${studentName} was cooperative throughout the assessment and appeared to understand task directions. `
    } else {
      text += `${studentName} showed some difficulty with cooperation during the assessment. `
    }

    if (data.student_cooperation.understanding) {
      text += `${data.student_cooperation.understanding} `
    }

    const factors = []
    if (data.validity_factors.attention_issues) factors.push('attention difficulties')
    if (data.validity_factors.motivation_problems) factors.push('motivation issues')
    if (data.validity_factors.cultural_considerations) factors.push('cultural/linguistic considerations')
    if (data.validity_factors.other) factors.push(data.validity_factors.other)

    if (factors.length > 0) {
      text += `Factors that may have affected test validity include: ${factors.join(', ')}.`
    }

    if (data.student_cooperation.custom_notes) {
      text += ` ${data.student_cooperation.custom_notes}`
    }

    return text
  }

  return (
    <NodeViewWrapper className="structured-block validity-block">
      <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
        {/* Block Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-blue-800 flex items-center gap-2">
            ✅ Validity Statement
          </h3>
          <button
            onClick={deleteNode}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        </div>

        {/* Generated Preview */}
        <div className="mb-4 p-3 bg-white rounded border text-sm leading-relaxed">
          {generateText()}
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
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { key: 'attention_issues', label: 'Attention issues' },
                { key: 'motivation_problems', label: 'Motivation problems' },
                { key: 'cultural_considerations', label: 'Cultural considerations' }
              ].map(factor => (
                <label key={factor.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.validity_factors[factor.key]}
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
    </NodeViewWrapper>
  )
}

// Assessment Results Block Component
const AssessmentResultsView = ({ node, updateAttributes, deleteNode }: any) => {
  const data = node.attrs.data || {
    standardized_tests: [],
    articulation: { error_patterns: '', stimulability: '', intelligibility: '' },
    language: { receptive: '', expressive: '', semantics: '', syntax: '', pragmatics: '' }
  }

  const updateData = (newData: any) => {
    updateAttributes({ data: newData })
  }

  const addTest = () => {
    const newTest = { test_name: '', score_type: '', score_value: 0, interpretation: '' }
    updateData({
      ...data,
      standardized_tests: [...data.standardized_tests, newTest]
    })
  }

  const updateTest = (index: number, field: string, value: any) => {
    const updatedTests = [...data.standardized_tests]
    updatedTests[index] = { ...updatedTests[index], [field]: value }
    updateData({ ...data, standardized_tests: updatedTests })
  }

  const removeTest = (index: number) => {
    const updatedTests = data.standardized_tests.filter((_: any, i: number) => i !== index)
    updateData({ ...data, standardized_tests: updatedTests })
  }

  return (
    <NodeViewWrapper className="structured-block assessment-block">
      <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
        {/* Block Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-green-800 flex items-center gap-2">
            📊 Assessment Results
          </h3>
          <button
            onClick={deleteNode}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        </div>

        {/* Standardized Tests */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Standardized Tests</h4>
            <button
              onClick={addTest}
              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
            >
              + Add Test
            </button>
          </div>
          
          <div className="space-y-2">
            {data.standardized_tests.map((test: any, index: number) => (
              <div key={index} className="bg-white p-2 rounded border">
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Test name"
                    value={test.test_name}
                    onChange={(e) => updateTest(index, 'test_name', e.target.value)}
                    className="px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    placeholder="Score type"
                    value={test.score_type}
                    onChange={(e) => updateTest(index, 'score_type', e.target.value)}
                    className="px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <input
                    type="number"
                    placeholder="Score"
                    value={test.score_value}
                    onChange={(e) => updateTest(index, 'score_value', parseFloat(e.target.value) || 0)}
                    className="px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <button
                    onClick={() => removeTest(index)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Interpretation..."
                  value={test.interpretation}
                  onChange={(e) => updateTest(index, 'interpretation', e.target.value)}
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Articulation/Phonology */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Articulation/Phonology</h4>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Error patterns..."
              value={data.articulation.error_patterns}
              onChange={(e) => updateData({
                ...data,
                articulation: { ...data.articulation, error_patterns: e.target.value }
              })}
              className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <input
              type="text"
              placeholder="Stimulability..."
              value={data.articulation.stimulability}
              onChange={(e) => updateData({
                ...data,
                articulation: { ...data.articulation, stimulability: e.target.value }
              })}
              className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <input
              type="text"
              placeholder="Intelligibility..."
              value={data.articulation.intelligibility}
              onChange={(e) => updateData({
                ...data,
                articulation: { ...data.articulation, intelligibility: e.target.value }
              })}
              className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Language Skills */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Language Skills</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'receptive', label: 'Receptive' },
              { key: 'expressive', label: 'Expressive' },
              { key: 'semantics', label: 'Semantics' },
              { key: 'syntax', label: 'Syntax' },
              { key: 'pragmatics', label: 'Pragmatics' }
            ].map(skill => (
              <input
                key={skill.key}
                type="text"
                placeholder={`${skill.label}...`}
                value={data.language[skill.key]}
                onChange={(e) => updateData({
                  ...data,
                  language: { ...data.language, [skill.key]: e.target.value }
                })}
                className="px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            ))}
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

// Define the custom nodes
const ValidityStatementBlock = Node.create({
  name: 'validityStatement',
  group: 'block',
  content: '',
  atom: true,

  addAttributes() {
    return {
      data: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="validity-statement"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'validity-statement' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ValidityStatementView)
  },
})

const AssessmentResultsBlock = Node.create({
  name: 'assessmentResults',
  group: 'block',
  content: '',
  atom: true,

  addAttributes() {
    return {
      data: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="assessment-results"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'assessment-results' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(AssessmentResultsView)
  },
})

interface SmartBlockEditorProps {
  content: string
  onChange?: (content: string, structuredData: any) => void
  onBlur?: (content: string, structuredData: any) => void
}

export default function SmartBlockEditor({ content, onChange, onBlur }: SmartBlockEditorProps) {
  const [structuredData, setStructuredData] = useState<any>({})

  const editor = useEditor({
    extensions: [
      StarterKit,
      ValidityStatementBlock,
      AssessmentResultsBlock,
    ],
    content: content,
    immediatelyRender: false,
    
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const extracted = extractStructuredData(editor)
      setStructuredData(extracted)
      
      if (onChange) {
        onChange(html, extracted)
      }
    },
    
    onBlur: ({ editor }) => {
      const html = editor.getHTML()
      const extracted = extractStructuredData(editor)
      
      if (onBlur) {
        onBlur(html, extracted)
      }
    },
  })

  // Extract structured data from all blocks
  const extractStructuredData = (editor: any) => {
    const data: any = {}
    
    editor.state.doc.descendants((node: any) => {
      if (node.type.name === 'validityStatement' && node.attrs.data) {
        data.validity_statement = node.attrs.data
      }
      if (node.type.name === 'assessmentResults' && node.attrs.data) {
        data.assessment_results = node.attrs.data
      }
    })
    
    return data
  }

  const insertValidityStatement = () => {
    if (editor) {
      editor.commands.insertContent({
        type: 'validityStatement',
        attrs: {
          data: {
            is_valid: true,
            student_cooperation: { cooperative: true, understanding: '', custom_notes: '' },
            validity_factors: { attention_issues: false, motivation_problems: false, cultural_considerations: false, other: '' }
          }
        }
      })
    }
  }

  const insertAssessmentResults = () => {
    if (editor) {
      editor.commands.insertContent({
        type: 'assessmentResults',
        attrs: {
          data: {
            standardized_tests: [],
            articulation: { error_patterns: '', stimulability: '', intelligibility: '' },
            language: { receptive: '', expressive: '', semantics: '', syntax: '', pragmatics: '' }
          }
        }
      })
    }
  }

  return (
    <div className="border rounded-lg">
      {/* Toolbar */}
      <div className="border-b p-3 bg-gray-50 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Insert Block:</span>
        <button
          onClick={insertValidityStatement}
          className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          ✅ Validity Statement
        </button>
        <button
          onClick={insertAssessmentResults}
          className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
        >
          📊 Assessment Results
        </button>
      </div>

      {/* Editor */}
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>

      {/* Debug Panel */}
      <details className="border-t">
        <summary className="p-2 bg-gray-50 text-xs text-gray-600 cursor-pointer">
          🔍 Structured Data ({Object.keys(structuredData).length} blocks)
        </summary>
        <pre className="p-3 bg-gray-900 text-green-400 text-xs overflow-auto max-h-48">
          {JSON.stringify(structuredData, null, 2)}
        </pre>
      </details>
    </div>
  )
}