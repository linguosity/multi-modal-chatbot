'use client'

import React, { useState, useEffect } from 'react'
import UploadModal from './UploadModal'
import DynamicSchemaEditor from './DynamicSchemaEditor'
import { Settings, Edit3 } from 'lucide-react'
import { FieldHighlight } from './ui/FieldHighlight'

interface FieldSchema {
  key: string
  label: string
  type: 'string' | 'boolean' | 'number' | 'array' | 'object' | 'date' | 'checkbox' | 'select'
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
  mode?: 'data' | 'template' // Accept mode as prop instead of managing internally
  sectionId?: string // Add sectionId for field highlighting
}

export default function DynamicStructuredBlock({ 
  schema, 
  initialData = {}, 
  onChange,
  onSchemaChange,
  onSaveAsTemplate,
  mode = 'data',
  sectionId
}: DynamicStructuredBlockProps) {
  const [data, setData] = useState<any>(initialData)
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Initialize data based on schema
  useEffect(() => {
    const initializeData = (fields: FieldSchema[]): any => {
      const result: any = {}
      fields.forEach(field => {
        if (field.type === 'boolean' || field.type === 'checkbox') {
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

  // Helper function to wrap fields with highlighting
  const wrapWithHighlight = (fieldPath: string, content: React.ReactNode) => {
    if (!sectionId || mode === 'template') {
      return content // No highlighting in template mode or without sectionId
    }
    
    return (
      <FieldHighlight key={fieldPath} sectionId={sectionId} fieldPath={fieldPath} className="group">
        {content}
      </FieldHighlight>
    )
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
        return wrapWithHighlight(fieldPath, (
          <div key={fieldPath} className="space-y-2 h-fit">
            <label className="block text-sm font-medium text-gray-700">{field.label}:</label>
            <div className="flex">
              <button
                onClick={() => updateFieldValue(true)}
                className={`rounded-l-full py-2 px-4 text-sm font-medium border ${
                  value 
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => updateFieldValue(false)}
                className={`rounded-r-full py-2 px-4 text-sm font-medium border-l-0 border ${
                  !value 
                    ? 'bg-red-100 text-red-700 border-red-200' 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                No
              </button>
            </div>
          </div>
        ))

      case 'checkbox':
        return wrapWithHighlight(fieldPath, (
          <div key={fieldPath} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => updateFieldValue(e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">{field.label}</label>
          </div>
        ))

      case 'date':
        return wrapWithHighlight(fieldPath, (
          <div key={fieldPath} className="space-y-1">
            <label className="text-sm text-gray-700">{field.label}:</label>
            <input
              type="date"
              value={value || ''}
              onChange={(e) => updateFieldValue(e.target.value)}
              className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ))

      case 'select':
        return wrapWithHighlight(fieldPath, (
          <div key={fieldPath} className="space-y-1">
            <label className="text-sm text-gray-700">{field.label}:</label>
            <select
              value={value || ''}
              onChange={(e) => updateFieldValue(e.target.value)}
              className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select an option...</option>
              {(field.options || []).map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ))

      case 'number':
        return wrapWithHighlight(fieldPath, (
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
        ))

      case 'array':
        return wrapWithHighlight(fieldPath, (
          <div key={fieldPath} className="space-y-2 h-fit">
            <label className="block text-sm font-medium text-gray-700">{field.label}:</label>
            <textarea
              value={Array.isArray(value) ? value.join(', ') : ''}
              onChange={(e) => {
                const items = e.target.value.split(',').map(item => item.trim()).filter(item => item)
                updateFieldValue(items)
              }}
              placeholder="Enter items separated by commas..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
            {Array.isArray(value) && value.length > 0 && (
              <div className="text-xs text-gray-500">
                {value.length} item{value.length !== 1 ? 's' : ''}: {value.join(', ')}
              </div>
            )}
          </div>
        ))

      case 'object':
        return (
          <div key={fieldPath} className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">{field.label}</h4>
            <div className="pl-4 border-l-2 border-gray-200 space-y-2">
              {field.children?.map(childField => (
                <React.Fragment key={childField.key}>
                  {renderField(childField, value?.[childField.key], [...path, field.key])}
                </React.Fragment>
              ))}
            </div>
          </div>
        )

      default: // string
        return wrapWithHighlight(fieldPath, (
          <div key={fieldPath} className="space-y-2 h-fit">
            <label className="block text-sm font-medium text-gray-700">{field.label}:</label>
            <textarea
              value={value || ''}
              onChange={(e) => updateFieldValue(e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        ))
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
      {/* Content */}
      {mode === 'template' ? (
        <DynamicSchemaEditor
          schema={schema}
          onSchemaChange={onSchemaChange!}
          onSaveAsTemplate={onSaveAsTemplate!}
        />
      ) : (
        <div className="p-6">
          {/* Dynamic Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-6 items-start">
            {schema.fields.map(field => (
              <React.Fragment key={field.key}>
                {renderField(field, data[field.key])}
              </React.Fragment>
            ))}
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