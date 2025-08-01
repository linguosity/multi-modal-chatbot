'use client'

import React, { useState, useEffect, useMemo } from 'react'
import UploadModal from './UploadModal'
import DynamicSchemaEditor from './DynamicSchemaEditor'
import { CustomModal } from './ui/custom-modal'
import { Plus, Trash2 } from 'lucide-react'
import { FieldHighlight } from './ui/FieldHighlight'
import { AssessmentItemEditor } from './AssessmentItemEditor'
import { AssessmentToolsDisplay } from './AssessmentToolsDisplay'
import { AssessmentToolsGrid } from './AssessmentToolsGrid'

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
  onChange: (data: any, generatedText: string) => void;
  onSchemaChange?: (newSchema: SectionSchema) => void;
  onSaveAsTemplate?: (schema: SectionSchema) => void;
  mode?: 'data' | 'template'; // Accept mode as prop instead of managing internally
  sectionId?: string; // Add sectionId for field highlighting
  updateSectionData: (sectionId: string, data: any) => void;
}

export default function DynamicStructuredBlock({ 
  schema, 
  initialData = {}, 
  onChange,
  onSchemaChange,
  onSaveAsTemplate,
  mode = 'data',
  sectionId,
  updateSectionData
}: DynamicStructuredBlockProps) {
  const [data, setData] = useState<any>(initialData)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Helper to get default values for a schema
  const getDefaultValuesForSchema = (fields: FieldSchema[]): any => {
    const result: any = {};
    fields.forEach(field => {
      if (field.type === 'boolean' || field.type === 'checkbox') {
        result[field.key] = false;
      } else if (field.type === 'number') {
        result[field.key] = 0;
      } else if (field.type === 'array') {
        result[field.key] = [];
      } else if (field.type === 'object' && field.children) {
        result[field.key] = getDefaultValuesForSchema(field.children);
      } else {
        result[field.key] = '';
      }
    });
    return result;
  };

  // Helper to merge existing data with the schema's default values
  const mergeDataWithSchema = (existingData: any, schemaFields: FieldSchema[]): any => {
    const defaultValues = getDefaultValuesForSchema(schemaFields);
    const mergedData = { ...defaultValues };

    for (const key in existingData) {
      if (Object.prototype.hasOwnProperty.call(existingData, key)) {
        const schemaField = schemaFields.find(f => f.key === key);
        if (schemaField) {
          if (schemaField.type === 'object' && schemaField.children && typeof existingData[key] === 'object' && !Array.isArray(existingData[key])) {
            mergedData[key] = mergeDataWithSchema(existingData[key], schemaField.children);
          } else if (schemaField.type === 'array' && schemaField.children && Array.isArray(existingData[key])) {
            // For arrays of objects, we need to merge each item individually if they have a schema
            mergedData[key] = existingData[key].map((item: any) => 
              typeof item === 'object' && item !== null ? mergeDataWithSchema(item, schemaField.children!) : item
            );
          } else {
            mergedData[key] = existingData[key];
          }
        } else {
          // If a field exists in data but not in schema, keep it (for backward compatibility or dynamic fields)
          mergedData[key] = existingData[key];
        }
      }
    }
    return mergedData;
  };

  // Memoize the merged data to prevent unnecessary re-renders
  const mergedInitialData = useMemo(() => {
    return mergeDataWithSchema(initialData, schema.fields);
  }, [initialData, schema.fields]);

  useEffect(() => {
    // Only update if the data has actually changed (shallow comparison for performance)
    if (data !== mergedInitialData) {
      setData(mergedInitialData);
    }
  }, [mergedInitialData]);



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
    setData(newData);
    const generatedText = generateProseText(newData);
    onChange(newData, generatedText);
    if (sectionId) {
      updateSectionData(sectionId, newData);
    }
  };

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
        if (field.key === 'assessment_items') {
          return wrapWithHighlight(fieldPath, (
            <div key={fieldPath}>
              <div className="space-y-1">
                <h4 className="text-[var(--text-base)] font-medium text-gray-700">Assessment Tools Used</h4>
                
                {/* Assessment Items List */}
                {(Array.isArray(value) ? value : []).map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="group flex items-center justify-between py-2 px-3 border-l-2 border-slate-200 hover:border-[var(--clr-accent)] hover:bg-slate-50 transition-all cursor-pointer"
                    onClick={() => {
                      setEditingItem(item);
                      setEditingItemIndex(idx);
                      setIsModalOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Tool name and type */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[var(--text-base)] font-medium text-gray-900 truncate">
                          {item.title || 'Unnamed Tool'}
                        </div>
                        {item.type && (
                          <div className="text-[var(--text-label)] text-slate-500">
                            {item.type}
                          </div>
                        )}
                      </div>

                      {/* Scores (if available) */}
                      <div className="flex items-center gap-2 text-[var(--text-label)] text-slate-600">
                        {item.standard_score && (
                          <span className="font-medium">SS: {item.standard_score}</span>
                        )}
                        {item.percentile && (
                          <span className="font-medium">%: {item.percentile}</span>
                        )}
                        {item.qualitative_description && (
                          <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <title>Has qualitative notes</title>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const newArray = (Array.isArray(value) ? value : []).filter((_: any, i: number) => i !== idx);
                        updateFieldValue(newArray);
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

                {/* Add button */}
                <button
                  onClick={() => {
                    setEditingItem(field.children!.reduce((acc, child) => {
                      if (child.type === 'object' && child.children) {
                        acc[child.key] = child.children.reduce((childAcc, grandChild) => {
                          childAcc[grandChild.key] = grandChild.type === 'number' ? 0 : 
                                                   grandChild.type === 'boolean' ? false : 
                                                   grandChild.type === 'array' ? [] : ''
                          return childAcc
                        }, {} as any)
                      } else {
                        acc[child.key] = child.type === 'number' ? 0 : 
                                        child.type === 'boolean' ? false : 
                                        child.type === 'array' ? [] : ''
                      }
                      return acc
                    }, {} as any));
                    setEditingItemIndex(null);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 py-2 px-3 text-[var(--text-base)] text-slate-500 hover:text-[var(--clr-accent)] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add assessment item
                </button>

                {/* Empty state */}
                {(Array.isArray(value) ? value : []).length === 0 && (
                  <div className="text-[var(--text-base)] text-slate-400 text-center py-6 border-l-2 border-slate-200">
                    No assessment tools added yet
                  </div>
                )}
              </div>

              <CustomModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem?.title || 'Add/Edit Assessment Item'}
              >
                {editingItem && (
                  <AssessmentItemEditor
                    item={editingItem}
                    onChange={setEditingItem}
                    onRemove={() => {
                      if (editingItemIndex !== null) {
                        const newArray = (Array.isArray(value) ? value : []).filter((_: any, i: number) => i !== editingItemIndex);
                        updateFieldValue(newArray);
                      }
                      setIsModalOpen(false);
                    }}
                    sectionId={sectionId!}
                    itemIndex={editingItemIndex !== null ? editingItemIndex : (Array.isArray(value) ? value.length : 0)}
                    schemaFields={field.children!}
                    isNewItem={editingItemIndex === null}
                  />
                )}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (editingItemIndex !== null) {
                        const newArray = [...(Array.isArray(value) ? value : [])];
                        newArray[editingItemIndex] = editingItem;
                        updateFieldValue(newArray);
                      } else {
                        updateFieldValue([...(Array.isArray(value) ? value : []), editingItem]);
                      }
                      setIsModalOpen(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </CustomModal>
            </div>
          ));
        }


        
        // Handle arrays with complex children (like standardized tests)
        if (field.children && field.children.length > 0) {
          const arrayValue = Array.isArray(value) ? value : []
          
          return wrapWithHighlight(fieldPath, (
            <div key={fieldPath} className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">{field.label}:</label>
                <button
                  onClick={() => {
                    const newItem = field.children!.reduce((acc, child) => {
                      if (child.type === 'object' && child.children) {
                        acc[child.key] = child.children.reduce((childAcc, grandChild) => {
                          childAcc[grandChild.key] = grandChild.type === 'number' ? 0 : 
                                                   grandChild.type === 'boolean' ? false : 
                                                   grandChild.type === 'array' ? [] : ''
                          return childAcc
                        }, {} as any)
                      } else {
                        acc[child.key] = child.type === 'number' ? 0 : 
                                        child.type === 'boolean' ? false : 
                                        child.type === 'array' ? [] : ''
                      }
                      return acc
                    }, {} as any)
                    
                    const newArray = [...arrayValue, newItem]
                    updateFieldValue(newArray)
                  }}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Add {field.label.slice(0, -1)} {/* Remove 's' from plural */}
                </button>
              </div>
              
              <div className="space-y-4">
                {arrayValue.map((item: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-gray-800">
                        {field.label.slice(0, -1)} {index + 1} {/* Remove 's' and add number */}
                      </h5>
                      <button
                        onClick={() => {
                          const newArray = arrayValue.filter((_: any, i: number) => i !== index)
                          updateFieldValue(newArray)
                        }}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {field.children?.map(childField => {
                        const childPath = [...path, field.key, index.toString()]
                        const childValue = item[childField.key]
                        
                        return (
                          <div key={childField.key}>
                            {renderField(childField, childValue, childPath)}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
                
                {arrayValue.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                    No {field.label.toLowerCase()} added yet. Click "Add {field.label.slice(0, -1)}" to get started.
                  </div>
                )}
              </div>
            </div>
          ))
        } else {
          // Handle simple arrays (comma-separated strings)
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
        }

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

  // Generate initial text on mount or when data changes
  useEffect(() => {
    if (Object.keys(data).length > 0) {
      const generatedText = generateProseText(data);
      onChange(data, generatedText);
    }
  }, [data, schema]);

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