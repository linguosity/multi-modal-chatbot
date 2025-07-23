'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, X, Edit2 } from 'lucide-react'

interface FieldSchema {
  key: string
  label: string
  type: 'string' | 'boolean' | 'number' | 'array' | 'object' | 'date' | 'checkbox' | 'select'
  required?: boolean
  options?: string[]
  placeholder?: string
  children?: FieldSchema[]
}

interface SectionSchema {
  key: string
  title: string
  fields: FieldSchema[]
  prose_template?: string
}

interface DynamicSchemaEditorProps {
  schema: SectionSchema
  onSchemaChange: (newSchema: SectionSchema) => void
  onSaveAsTemplate: (schema: SectionSchema) => void
}

interface FieldTypeOption {
  value: FieldSchema['type']
  label: string
  description: string
}

const FIELD_TYPES: FieldTypeOption[] = [
  { value: 'string', label: 'Text Field', description: 'Single line text input' },
  { value: 'boolean', label: 'Yes/No', description: 'Boolean choice buttons' },
  { value: 'checkbox', label: 'Checkbox', description: 'Single checkbox for true/false' },
  { value: 'number', label: 'Number', description: 'Numeric input' },
  { value: 'date', label: 'Date', description: 'Date picker input' },
  { value: 'select', label: 'Dropdown', description: 'Dropdown selection list' },
  { value: 'array', label: 'List', description: 'Multiple text items' },
  { value: 'object', label: 'Group', description: 'Container for other fields' }
]

export default function DynamicSchemaEditor({ 
  schema, 
  onSchemaChange, 
  onSaveAsTemplate 
}: DynamicSchemaEditorProps) {
  const [editingField, setEditingField] = useState<{ originalPath: string; currentPath: string } | null>(null)
  const [showAddField, setShowAddField] = useState<{ parentPath?: string } | null>(null)
  const [draftField, setDraftField] = useState<FieldSchema | null>(null)
  const [originalField, setOriginalField] = useState<FieldSchema | null>(null)
  const editingRef = useRef<HTMLDivElement>(null)

  const addField = (fieldType: FieldSchema['type'], parentPath?: string) => {
    const newField: FieldSchema = {
      key: `new_field_${Date.now()}`,
      label: 'New Field',
      type: fieldType,
      placeholder: fieldType === 'string' ? 'Enter value...' : undefined,
      children: fieldType === 'object' ? [] : undefined
    }

    const newSchema = { ...schema }
    
    if (parentPath) {
      // Add as child to specific parent
      const pathParts = parentPath.split('.')
      let current: any = newSchema.fields
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        const fieldIndex = current.findIndex((f: FieldSchema) => f.key === pathParts[i])
        current = current[fieldIndex].children || []
      }
      
      const parentIndex = current.findIndex((f: FieldSchema) => f.key === pathParts[pathParts.length - 1])
      if (!current[parentIndex].children) {
        current[parentIndex].children = []
      }
      current[parentIndex].children.push(newField)
    } else {
      // Add as sibling to root level
      newSchema.fields.push(newField)
    }

    onSchemaChange(newSchema)
    setShowAddField(null)
  }

  // Get field by path
  const getFieldByPath = (fieldPath: string): FieldSchema | null => {
    const pathParts = fieldPath.split('.')
    let current: any = schema.fields
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      const fieldIndex = current.findIndex((f: FieldSchema) => f.key === pathParts[i])
      if (fieldIndex === -1) return null
      current = current[fieldIndex].children || []
    }
    
    const fieldIndex = current.findIndex((f: FieldSchema) => f.key === pathParts[pathParts.length - 1])
    return fieldIndex !== -1 ? current[fieldIndex] : null
  }

  // Start editing a field
  const startEditing = (fieldPath: string) => {
    const field = getFieldByPath(fieldPath)
    if (!field) return
    
    setEditingField({ originalPath: fieldPath, currentPath: fieldPath })
    setOriginalField({ ...field })
    setDraftField({ ...field })
  }

  // Update draft field (local changes only)
  const updateDraftField = (updates: Partial<FieldSchema>) => {
    if (!draftField) return
    setDraftField({ ...draftField, ...updates })
  }

  // Save changes to schema
  const saveFieldChanges = () => {
    if (!editingField || !draftField) return
    
    const newSchema = { ...schema }
    const pathParts = editingField.originalPath.split('.')
    
    let current: any = newSchema.fields
    for (let i = 0; i < pathParts.length - 1; i++) {
      const fieldIndex = current.findIndex((f: FieldSchema) => f.key === pathParts[i])
      current = current[fieldIndex].children || []
    }
    
    const fieldIndex = current.findIndex((f: FieldSchema) => f.key === pathParts[pathParts.length - 1])
    current[fieldIndex] = { ...draftField }
    
    onSchemaChange(newSchema)
    cancelEditing()
  }

  // Cancel editing and revert changes
  const cancelEditing = () => {
    setEditingField(null)
    setDraftField(null)
    setOriginalField(null)
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      saveFieldChanges()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEditing()
    }
  }

  // Handle click outside to save changes
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingField && editingRef.current && !editingRef.current.contains(event.target as Node)) {
        saveFieldChanges()
      }
    }

    if (editingField) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [editingField, draftField])

  const removeField = (fieldPath: string) => {
    const newSchema = { ...schema }
    const pathParts = fieldPath.split('.')
    
    let current: any = newSchema.fields
    for (let i = 0; i < pathParts.length - 1; i++) {
      const fieldIndex = current.findIndex((f: FieldSchema) => f.key === pathParts[i])
      current = current[fieldIndex].children || []
    }
    
    const fieldIndex = current.findIndex((f: FieldSchema) => f.key === pathParts[pathParts.length - 1])
    current.splice(fieldIndex, 1)
    
    onSchemaChange(newSchema)
  }

  const renderField = (field: FieldSchema, path: string[] = []): React.ReactNode => {
    const fieldPath = [...path, field.key].join('.')
    const isEditing = editingField?.originalPath === fieldPath
    const displayField = isEditing && draftField ? draftField : field

    return (
      <div key={fieldPath} className="border border-gray-200 rounded-lg p-3 space-y-2">
        {/* Field Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span 
              className="text-sm font-medium cursor-pointer hover:text-blue-600"
              onClick={() => startEditing(fieldPath)}
            >
              {displayField.label}
            </span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {FIELD_TYPES.find(t => t.value === displayField.type)?.label}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            {field.type === 'object' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAddField({ parentPath: fieldPath })}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => startEditing(fieldPath)}
              className="h-6 w-6 p-0"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeField(fieldPath)}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Field Configuration */}
        {isEditing && draftField && (
          <div 
            ref={editingRef}
            className="space-y-2 bg-gray-50 p-2 rounded border-2 border-blue-200"
            onKeyDown={handleKeyDown}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-700">Edit Field</span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  onClick={saveFieldChanges}
                  className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelEditing}
                  className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mb-2">
              Press Ctrl+Enter to save, Esc to cancel
            </div>
            
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-600">Label:</label>
                <input
                  type="text"
                  value={draftField.label}
                  onChange={(e) => updateDraftField({ label: e.target.value })}
                  className="w-full text-xs border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600">Key:</label>
                  <input
                    type="text"
                    value={draftField.key}
                    onChange={(e) => updateDraftField({ key: e.target.value })}
                    className="w-full text-xs border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Type:</label>
                  <select
                    value={draftField.type}
                    onChange={(e) => updateDraftField({ 
                      type: e.target.value as FieldSchema['type'],
                      children: e.target.value === 'object' ? [] : undefined
                    })}
                    className="w-full text-xs border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                  >
                    {FIELD_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {(draftField.type === 'string' || draftField.type === 'date') && (
              <div>
                <label className="text-xs text-gray-600">Placeholder:</label>
                <input
                  type="text"
                  value={draftField.placeholder || ''}
                  onChange={(e) => updateDraftField({ placeholder: e.target.value })}
                  className="w-full text-xs border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            {draftField.type === 'select' && (
              <div>
                <label className="text-xs text-gray-600">Options (comma-separated):</label>
                <input
                  type="text"
                  value={(draftField.options || []).join(', ')}
                  onChange={(e) => updateDraftField({ 
                    options: e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt) 
                  })}
                  placeholder="Option 1, Option 2, Option 3"
                  className="w-full text-xs border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Child Fields */}
        {field.type === 'object' && field.children && (
          <div className="pl-4 border-l-2 border-gray-200 space-y-2">
            {field.children.map(childField => 
              renderField(childField, [...path, field.key])
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Schema Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-800">Template Structure</h3>
        <Button
          onClick={() => onSaveAsTemplate(schema)}
          size="sm"
          className="bg-green-600 hover:bg-green-700"
        >
          Save as Template
        </Button>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        {schema.fields.map(field => renderField(field))}
      </div>

      {/* Add Field Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => setShowAddField({})}
          variant="outline"
          size="sm"
          className="border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>

      {/* Add Field Modal */}
      {showAddField && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h4 className="font-medium mb-4">Add New Field</h4>
            <div className="space-y-3">
              {FIELD_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => {
                    addField(type.value, showAddField.parentPath)
                  }}
                  className="w-full text-left p-3 border rounded hover:bg-gray-50"
                >
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs text-gray-600">{type.description}</div>
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                onClick={() => setShowAddField(null)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}