'use client'

import React, { useState, useEffect } from 'react'
import UploadModal from './UploadModal'
import DynamicSchemaEditor from './DynamicSchemaEditor'
import { generateText } from '@tiptap/react'
import { Settings, Edit3 } from 'lucide-react'

interface FieldSchema {
  key: string
  label: string
  type: 'string' | 'boolean' | 'number' | 'array' | 'object'
  required?: boolean
  options?: string[] // For select/dropdown fields
  placeholder?: string
  children?: FieldSchema[] // For nested objects
}

interface SectionSchema {
  key: string
  title: string
  fields: FieldSchema[]
  prose_template?: string // Template for generating natural language
}

interface DynamicStructuredBlockProps {
  schema: SectionSchema
  initialData?: any
  onChange: (data: any, generatedText: string) => void
  onSchemaChange?: (newSchema: SectionSchema) => void
  onSaveAsTemplate?: (schema: SectionSchema) => void
}

export default function DynamicStructuredBlock({ 
  schema, 
  initialData = {}, 
  onChange,
  onSchemaChange,
  onSaveAsTemplate
}: DynamicStructuredBlockProps) {
  const [data, setData] = useState<any>(initialData)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editMode, setEditMode] = useState<'data' | 'schema'>('data')

  // Initialize data based on schema
  useEffect(() => {
    const initializeData = (fields: FieldSchema[]): any => {
      const result: any = {}
      fields.forEach(field => {
        if (field.type === 'boolean') {
          result[field.key] = false
        } else if (field.type === 'number') {
          result[field.key] = 0
        } else if (field.type === 'array') {
          result[field.key] = []
        } else if (field.type === 'object' && field.children) {
          result[field.key] = initializeData(field.children)
        } else {
          result[field.key] = ''
        }
      })
      return result
    }

    if (Object.keys(data).length === 0) {
      const initializedData = initializeData(schema.fields)
      setData(initializedData)
    }
  }, [schema, data])



  // Generate prose text from structured data
  const generateProseText = (structuredData: any): string => {
    if (!structuredData || Object.keys(structuredData).length === 0) {
      return ''
    }

    // Use the prose template if available
    if (schema.prose_template) {
      let text = schema.prose_template
      // Replace placeholders with actual data
      Object.entries(structuredData).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`
        text = text.replace(new RegExp(placeholder, 'g'), String(value))
      })
      return text
    }

    // Default prose generation based on field types
    let prose = ''
    schema.fields.forEach(field => {
      const value = structuredData[field.key]
      if (!value) return

      switch (field.type) {
        case 'boolean':
          prose += `${field.label}: ${value ? 'Yes' : 'No'}. `
          break
        case 'string':
          if (value.trim()) {
            prose += `${field.label}: ${value}. `
          }
          break
        case 'number':
          if (value !== 0) {
            prose += `${field.label}: ${value}. `
          }
          break
        case 'array':
          if (Array.isArray(value) && value.length > 0) {
            prose += `${field.label}: ${value.join(', ')}. `
          }
          break
        case 'object':
          if (typeof value === 'object' && Object.keys(value).length > 0) {
            prose += `${field.label}: `
            Object.entries(value).forEach(([subKey, subValue]) => {
              if (subValue) {
                prose += `${subKey}: ${subValue}; `
              }
            })
            prose += '. '
          }
          break
      }
    })

    return prose.trim()
  }

  const updateData = (newData: any) => {
    setData(newData)
    const generatedText = generateProseText(newData)
    onChange(newData, generatedText)
  }

  // Render field based on type
  const renderField = (field: FieldSchema, value: any, path: string[] = []): React.ReactNode => {
    const fieldPath = [...path, field.key].join('.')
    
    const updateFieldValue = (newValue: any) => {
      const newData = { ...data }
      let current = newData
      
      // Navigate to the correct nested location
      for (let i = 0; i < path.length; i++) {
        current = current[path[i]]
      }
      
      current[field.key] = newValue
      updateData(newData)
    }

    switch (field.type) {
      case 'boolean':
        return (
          <div key={fieldPath} className="flex items-center gap-3">
            <label className="text-sm text-gray-700">{field.label}:</label>
            <div className="flex">
              <button
                onClick={() => updateFieldValue(true)}
                className={`rounded-l-full py-1 px-3 text-xs font-medium border ${
                  value 
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => updateFieldValue(false)}
                className={`rounded-r-full py-1 px-3 text-xs font-medium border-l-0 border ${
                  !value 
                    ? 'bg-red-100 text-red-700 border-red-200' 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                No
              </button>
            </div>
          </div>
        )

      case 'number':
        return (
          <div key={fieldPath} className="space-y-1">
            <label className="text-sm text-gray-700">{field.label}:</label>
            <input
              type="number"
              value={value || 0}
              onChange={(e) => updateFieldValue(parseFloat(e.target.value) || 0)}
              placeholder={field.placeholder}
              className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )

      case 'array':
        return (
          <div key={fieldPath} className="space-y-2">
            <label className="text-sm text-gray-700">{field.label}:</label>
            <textarea
              value={Array.isArray(value) ? value.join(', ') : ''}
              onChange={(e) => {
                const items = e.target.value.split(',').map(item => item.trim()).filter(item => item)
                updateFieldValue(items)
              }}
              placeholder="Enter items separated by commas..."
              className="w-full px-2 py-2 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              rows={2}
            />
            {Array.isArray(value) && value.length > 0 && (
              <div className="text-xs text-gray-500">
                {value.length} item{value.length !== 1 ? 's' : ''}: {value.join(', ')}
              </div>
            )}
          </div>
        )

      case 'object':
        return (
          <div key={fieldPath} className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">{field.label}</h4>
            <div className="pl-4 border-l-2 border-gray-200 space-y-2">
              {field.children?.map(childField => 
                renderField(childField, value?.[childField.key], [...path, field.key])
              )}
            </div>
          </div>
        )

      default: // string
        return (
          <div key={fieldPath} className="space-y-1">
            <label className="text-sm text-gray-700">{field.label}:</label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => updateFieldValue(e.target.value)}
              placeholder={field.placeholder}
              className="w-full border-b border-gray-300 focus:border-blue-400 outline-none py-1 text-sm bg-transparent"
            />
          </div>
        )
    }
  }

  // Generate initial text on mount
  useEffect(() => {
    if (Object.keys(data).length > 0) {
      const generatedText = generateProseText(data)
      onChange(data, generatedText)
    }
  }, [data])

  return (
    <div className="h-full">
      {/* Mode Toggle */}
      {(onSchemaChange || onSaveAsTemplate) && (
        <div className="border-b border-gray-200 px-6 py-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode('data')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                editMode === 'data' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Edit3 className="h-3 w-3 inline mr-1" />
              Data Entry
            </button>
            <button
              onClick={() => setEditMode('schema')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                editMode === 'schema' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="h-3 w-3 inline mr-1" />
              Edit Template
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {editMode === 'schema' ? (
        <DynamicSchemaEditor
          schema={schema}
          onSchemaChange={onSchemaChange!}
          onSaveAsTemplate={onSaveAsTemplate!}
        />
      ) : (
        <div className="p-6">
          {/* Dynamic Fields */}
          <div className="space-y-4 mb-6">
            {schema.fields.map(field => renderField(field, data[field.key]))}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onDataReceived={(receivedData) => {
            // Update structured data from uploaded content
            updateData({ ...data, ...receivedData })
            setShowUploadModal(false)
          }}
          sectionType={schema.key}
        />
      )}
    </div>
  )
}