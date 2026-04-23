'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import UploadModal from './UploadModal'
import DynamicSchemaEditor from './DynamicSchemaEditor'
import { BaseModal } from './ui/base-modal'
import { Button } from './ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { FieldHighlight } from './ui/FieldHighlight'
import { AssessmentItemEditor } from './AssessmentItemEditor'
import { AssessmentToolsDisplay } from './AssessmentToolsDisplay'
import { AssessmentToolsGrid } from './AssessmentToolsGrid'
import { safeStringify } from '@/lib/utils/safeStringify'
import type { Json } from '@/lib/types/json'
import { useUserSettings } from '@/lib/context/UserSettingsContext'
import FieldModeBadge from '@/components/ui/field-mode-badge'
import ProvenanceChips from '@/components/ui/provenance-chips'
import type { FieldMode, SourceRef } from '@/types/field-contracts'

interface FieldSchema {
  key: string
  label: string
  // Keep in sync with canonical union in src/lib/structured-schemas.ts
  type:
    | 'string'
    | 'boolean'
    | 'number'
    | 'array'
    | 'object'
    | 'date'
    | 'checkbox'
    | 'select'
    | 'paragraph'
    | 'enum'
    | 'table'
  required?: boolean
  options?: string[] // For select/dropdown fields
  placeholder?: string
  children?: FieldSchema[] // For nested objects
  // Optional AI/compute metadata (non-invasive)
  mode?: FieldMode
  source_refs?: SourceRef[]
}

interface SectionSchema {
  key: string
  title: string
  fields: FieldSchema[]
  prose_template?: string // Template for generating natural language
}

interface DynamicStructuredBlockProps {
  schema: SectionSchema
  initialData?: Json
  onChange: (data: Json, generatedText: string) => void;
  onSchemaChange?: (newSchema: SectionSchema) => void;
  onSaveAsTemplate?: (schema: SectionSchema) => void;
  mode?: 'data' | 'template'; // Accept mode as prop instead of managing internally
  sectionId?: string; // Add sectionId for field highlighting
  updateSectionData?: (sectionId: string, data: Json, content?: string) => void;
}

// Helper function to get nested values
function getNestedValue(obj: any, path: string[]): any {
  return path.reduce((current, key) => current?.[key], obj);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<Record<string, any>>((initialData as Record<string, any>) ?? {})
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [previewRef, setPreviewRef] = useState<SourceRef | null>(null);
  const { settings } = useUserSettings()
  const isHeaderSection = (schema?.key === 'header') || (schema?.title?.toLowerCase() === 'student information')

  // Map locked header fields to user settings keys
  const LOCKED_FIELD_SETTINGS_MAP: Record<string, keyof typeof settings> = {
    evaluator_name: 'evaluatorName',
    evaluator_credentials: 'evaluatorCredentials',
    school_name: 'schoolName',
  }
  
  // Initialization guard to prevent infinite loops
  const initializedRef = useRef(false);
  const lastDataRef = useRef<any>(null);

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

  // Initialize data only once on mount
  useEffect(() => {
    if (!initializedRef.current) {
      // Prefill locked fields from user settings on first mount
      const withLockedDefaults = { ...mergedInitialData } as any
      for (const f of schema.fields) {
        if ((f as any).mode === 'locked') {
          const settingsKey = LOCKED_FIELD_SETTINGS_MAP[f.key]
          const settingsVal = settingsKey ? (settings as any)[settingsKey] : undefined
          if ((withLockedDefaults[f.key] === '' || withLockedDefaults[f.key] == null) && settingsVal) {
            withLockedDefaults[f.key] = settingsVal
          }
        }
      }
      setData(withLockedDefaults)
      initializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  // When user settings change, populate locked fields that are still empty (non-destructive)
  useEffect(() => {
    const next = { ...(data as any) }
    let changed = false
    for (const f of schema.fields) {
      if ((f as any).mode === 'locked') {
        const settingsKey = LOCKED_FIELD_SETTINGS_MAP[f.key]
        const settingsVal = settingsKey ? (settings as any)[settingsKey] : undefined
        const currentVal = next[f.key]
        if ((currentVal === '' || currentVal == null) && settingsVal) {
          next[f.key] = settingsVal
          changed = true
        }
      }
    }
    if (changed) {
      setData(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.evaluatorName, settings.evaluatorCredentials, settings.schoolName])

  // Handle external initialData changes after initialization
  const prevMerged = useRef<Json | null>(null);
  useEffect(() => {
    // Simple reference check is enough – Next will give you a *new*
    // object when the parent really sends different data
    if (prevMerged.current !== mergedInitialData) {
      prevMerged.current = mergedInitialData;
      setData(mergedInitialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergedInitialData]); // <- note: data removed from deps



  // Generate prose text from structured data (memoized to prevent infinite loops)
  const generateProseText = useCallback((structuredData: any): string => {
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
  }, [schema.fields])



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
    const SHOW_PROVENANCE = (process.env.NEXT_PUBLIC_SHOW_PROVENANCE
      ? process.env.NEXT_PUBLIC_SHOW_PROVENANCE === 'true'
      : process.env.NODE_ENV !== 'production')

    const LabelRow = ({ children }: { children?: React.ReactNode }) => (
      <div className="flex items-center gap-2">
        <label className={`block ${isHeaderSection ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>{field.label}:</label>
        {SHOW_PROVENANCE && field.mode && (
          <FieldModeBadge mode={field.mode} />
        )}
        {children}
      </div>
    )

    const inputBaseClass = `w-full h-10 px-3 py-0.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500`
    const smallInputClass = `w-full h-10 px-2 py-0.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500`

    const updateFieldValue = (newValue: any, shouldTriggerSave = false) => {
      // Only log when actually saving, not on every keystroke
      if (shouldTriggerSave) {
        console.log('💾 DynamicStructuredBlock updateFieldValue (saving):', {
          sectionId,
          fieldKey: field.key,
          fieldPath: [...path, field.key].join('.'),
          oldValue: getNestedValue(data, [...path, field.key]),
          newValue,
          timestamp: new Date().toISOString()
        });
      }
      
      const newData = { ...data }
      let current = newData
      
      // Navigate to the correct nested location
      for (let i = 0; i < path.length; i++) {
        current = current[path[i]]
      }
      
      current[field.key] = newValue
      
      // Update local state immediately for responsive UI
      setData(newData);
      
      // Only trigger save callback when explicitly requested (onBlur, not onChange)
      if (shouldTriggerSave) {
        const generatedText = generateProseText(newData);
        console.log('💾 DynamicStructuredBlock calling onChange (saving):', {
          sectionId,
          dataKeys: Object.keys(newData),
          generatedTextLength: generatedText.length,
          timestamp: new Date().toISOString()
        });
        onChange(newData, generatedText);
      }
    }

    const isLocked = (field as any).mode === 'locked'
    const widthClass = (() => {
      if (!isHeaderSection) return ''
      switch (field.key) {
        case 'first_name':
        case 'last_name':
          return 'max-w-[20rem]'
        case 'student_id':
          return 'max-w-[18rem]'
        case 'date_of_birth':
        case 'report_date':
          return 'max-w-[14rem]'
        case 'age':
          return 'max-w-[8rem]'
        case 'grade':
          return 'max-w-[10rem]'
        case 'primary_languages':
          return 'max-w-[22rem]'
        case 'evaluation_dates':
          return 'max-w-[24rem]'
        default:
          return ''
      }
    })()
    switch (field.type) {
      case 'boolean':
        return wrapWithHighlight(fieldPath, (
          <div key={fieldPath} className="space-y-2 h-fit">
            <LabelRow />
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
            {SHOW_PROVENANCE && field.source_refs?.length ? (
              <ProvenanceChips 
                sources={field.source_refs} 
                className="mt-1"
                onOpenPreview={(ref) => setPreviewRef(ref)}
              />
            ) : null}
          </div>
        ))

      case 'checkbox':
        return wrapWithHighlight(fieldPath, (
          <div key={fieldPath} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => updateFieldValue(e.target.checked, true)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">{field.label}</label>
            {SHOW_PROVENANCE && field.mode && (
              <FieldModeBadge mode={field.mode} />
            )}
            {SHOW_PROVENANCE && field.source_refs?.length ? (
              <ProvenanceChips 
                sources={field.source_refs} 
                className="ml-2"
                onOpenPreview={(ref) => setPreviewRef(ref)}
              />
            ) : null}
          </div>
        ))

      case 'date':
        return wrapWithHighlight(fieldPath, (
          <div key={fieldPath} className={`space-y-0.5 ${widthClass}`}>
            <LabelRow />
            <input
              type="date"
              value={value || ''}
              onChange={(e) => updateFieldValue(e.target.value, false)}
              onBlur={(e) => updateFieldValue(e.target.value, true)}
              className={isHeaderSection ? inputBaseClass : smallInputClass}
              disabled={isLocked}
              title={isLocked ? 'Locked by user settings' : undefined}
            />
            {SHOW_PROVENANCE && field.source_refs?.length ? (
              <ProvenanceChips 
                sources={field.source_refs} 
                className="mt-1"
                onOpenPreview={(ref) => setPreviewRef(ref)}
              />
            ) : null}
          </div>
        ))

      case 'select': {
        // §2 primitive upgrade: when the option set is short (≤5), render
        // as a segmented control so the full answer space is visible without
        // a dropdown interaction. Dropdown still used for longer lists.
        const options = field.options || []
        const useSegmented = options.length > 0 && options.length <= 5 && !isLocked
        return wrapWithHighlight(fieldPath, (
          <div key={fieldPath} className={`space-y-0.5 ${widthClass}`}>
            <LabelRow />
            {useSegmented ? (
              <div
                role="radiogroup"
                aria-label={field.label}
                className="inline-flex rounded-md border border-gray-300 bg-white overflow-hidden"
              >
                {options.map((option) => {
                  const isSelected = value === option
                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => updateFieldValue(option, true)}
                      className={
                        'px-3 py-1.5 text-[13px] transition-colors border-l first:border-l-0 border-gray-200 ' +
                        (isSelected
                          ? 'bg-terracotta text-white font-medium'
                          : 'bg-white text-gray-700 hover:bg-gray-50')
                      }
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            ) : (
              <select
                value={value || ''}
                onChange={(e) => updateFieldValue(e.target.value, true)}
                className={isHeaderSection ? inputBaseClass : smallInputClass}
                disabled={isLocked}
                title={isLocked ? 'Locked by user settings' : undefined}
              >
                <option value="">Select an option...</option>
                {options.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
            {SHOW_PROVENANCE && field.source_refs?.length ? (
              <ProvenanceChips
                sources={field.source_refs}
                className="mt-1"
                onOpenPreview={(ref) => setPreviewRef(ref)}
              />
            ) : null}
          </div>
        ))
      }

      case 'number':
        return wrapWithHighlight(fieldPath, (
          <div key={fieldPath} className={`space-y-0.5 ${widthClass}`}>
            <LabelRow />
            <input
              type="number"
              value={value || 0}
              onChange={(e) => updateFieldValue(parseFloat(e.target.value) || 0, false)}
              onBlur={(e) => updateFieldValue(parseFloat(e.target.value) || 0, true)}
              placeholder={field.placeholder}
              className={isHeaderSection ? inputBaseClass : smallInputClass}
              disabled={isLocked}
              title={isLocked ? 'Locked by user settings' : undefined}
            />
            {SHOW_PROVENANCE && field.source_refs?.length ? (
              <ProvenanceChips 
                sources={field.source_refs} 
                className="mt-1"
                onOpenPreview={(ref) => setPreviewRef(ref)}
              />
            ) : null}
          </div>
        ))

      case 'array':
        if (field.key === 'assessment_items') {
          return wrapWithHighlight(fieldPath, (
            <div key={fieldPath}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-[var(--text-base)] font-medium text-gray-700">Assessment Tools Used</h4>
                  {process.env.NEXT_PUBLIC_SHOW_PROVENANCE === 'true' && field.mode && (
                    <FieldModeBadge mode={field.mode} />
                  )}
                </div>
                
                {/* Assessment Items List (minimalist format) */}
                {(Array.isArray(value) ? value : []).map((item: any, idx: number) => {
                  const parts: string[] = []
                  if (item.title) parts.push(String(item.title))
                  if (item.acronym) parts.push(String(item.acronym).toUpperCase())
                  const authorYear = [item.author, item.year_published].filter(Boolean).join(', ')
                  if (authorYear) parts.push(authorYear)
                  const blurb = item.purpose || item.target_population || (Array.isArray(item.domains_assessed) ? item.domains_assessed.join(', ') : '')
                  if (blurb) parts.push(String(blurb))
                  const line = parts.join(' | ')
                  return (
                    <div
                      key={idx}
                      className="group flex items-center justify-between py-2 px-3 rounded hover:bg-slate-50 transition cursor-pointer"
                      onClick={() => { setEditingItem(item); setEditingItemIndex(idx); setIsModalOpen(true) }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 truncate">{line || 'Unnamed Tool'}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newArray = (Array.isArray(value) ? value : []).filter((_: any, i: number) => i !== idx)
                          updateFieldValue(newArray)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition"
                        title="Remove assessment tool"
                        aria-label="Remove assessment tool"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )
                })}

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
                  <div className="text-sm text-slate-400 text-center py-6">
                    No assessment tools added yet
                  </div>
                )}
              </div>

              <BaseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem?.title || 'Add/Edit Assessment Item'}
                size="xl"
                footer={
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
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
                    >
                      Save
                    </Button>
                  </>
                }
              >
                <div className="p-6">
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
                </div>
              </BaseModal>
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
              {(() => {
                const show = (process.env.NEXT_PUBLIC_SHOW_PROVENANCE ? process.env.NEXT_PUBLIC_SHOW_PROVENANCE === 'true' : process.env.NODE_ENV !== 'production')
                if (!show) return null
                const runtime = Array.isArray((data as any)?.__provenance) ? (data as any).__provenance : []
                const runtimeRefs: SourceRef[] = runtime
                  .filter((r: any) => r && r.field_path === fieldPath)
                  .map((r: any) => ({ artifactId: r.artifactId, page: r.page, confidence: r.confidence }))
                return runtimeRefs.length ? (
                  <ProvenanceChips
                    sources={runtimeRefs}
                    onOpenPreview={(ref) => setPreviewRef(ref)}
                  />
                ) : null
              })()}
              
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
                  updateFieldValue(items, false)
                }}
                onBlur={(e) => {
                  const items = e.target.value.split(',').map(item => item.trim()).filter(item => item)
                  updateFieldValue(items, true)
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
              {(() => {
                const show = (process.env.NEXT_PUBLIC_SHOW_PROVENANCE ? process.env.NEXT_PUBLIC_SHOW_PROVENANCE === 'true' : process.env.NODE_ENV !== 'production')
                if (!show) return null
                const runtime = Array.isArray((data as any)?.__provenance) ? (data as any).__provenance : []
                const runtimeRefs: SourceRef[] = runtime
                  .filter((r: any) => r && r.field_path === fieldPath)
                  .map((r: any) => ({ artifactId: r.artifactId, page: r.page, confidence: r.confidence }))
                return runtimeRefs.length ? (
                  <ProvenanceChips
                    sources={runtimeRefs}
                    onOpenPreview={(ref) => setPreviewRef(ref)}
                  />
                ) : null
              })()}
            </div>
          ))
        }

      case 'object':
        return (
          <div key={fieldPath} className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-gray-700">{field.label}</h4>
              {process.env.NEXT_PUBLIC_SHOW_PROVENANCE === 'true' && field.mode && (
                <FieldModeBadge mode={field.mode} />
              )}
            </div>
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
          <div key={fieldPath} className={`space-y-1 h-fit ${widthClass}`}>
            <LabelRow />
            {isHeaderSection && ['first_name','last_name','student_id','primary_languages','evaluator_name','evaluator_credentials','evaluation_dates','school_name'].includes(field.key) ? (
              <input
                type="text"
                value={value || ''}
                onChange={(e) => updateFieldValue(e.target.value, false)}
                onBlur={(e) => updateFieldValue(e.target.value, true)}
                placeholder={field.placeholder}
                className={inputBaseClass}
                disabled={isLocked}
                title={isLocked ? 'Locked by user settings' : undefined}
              />
            ) : (
              <textarea
                value={value || ''}
                onChange={(e) => updateFieldValue(e.target.value, false)}
                onBlur={(e) => updateFieldValue(e.target.value, true)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isLocked}
                title={isLocked ? 'Locked by user settings' : undefined}
              />
            )}
            {(() => {
              const show = (process.env.NEXT_PUBLIC_SHOW_PROVENANCE ? process.env.NEXT_PUBLIC_SHOW_PROVENANCE === 'true' : process.env.NODE_ENV !== 'production')
              if (!show) return null
              const schemaRefs = field.source_refs || []
              const runtime = Array.isArray((data as any)?.__provenance) ? (data as any).__provenance : []
              const runtimeRefs: SourceRef[] = runtime
                .filter((r: any) => r && r.field_path === fieldPath)
                .map((r: any) => ({ artifactId: r.artifactId, page: r.page, confidence: r.confidence }))
              const combined = [...schemaRefs, ...runtimeRefs]
              return combined.length ? (
                <ProvenanceChips
                  sources={combined}
                  onOpenPreview={(ref) => setPreviewRef(ref)}
                />
              ) : null
            })()}
          </div>
        ))
    }
  }

  // Stable onChange callback to prevent infinite loops
  const stableOnChange = useCallback((newData: any, generatedText: string) => {
    onChange(newData, generatedText);
  }, [onChange]);

  // Generate initial text on mount or when data changes (with loop prevention)
  const prevDataRef = useRef<Json | null>(null);
  useEffect(() => {
    // Use reference equality check instead of deep stringify
    if (prevDataRef.current !== data && Object.keys(data).length > 0) {
      prevDataRef.current = data;
      const generatedText = generateProseText(data);
      stableOnChange(data, generatedText);
    }
  }, [data, stableOnChange]);

  return (
    <div className="h-full">
      {/* Content */}
      {mode === 'template' ? (
        <DynamicSchemaEditor
          // DynamicSchemaEditor defines its own SectionSchema shape; cast
          // through unknown to bridge the duplicate-name drift.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          schema={schema as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onSchemaChange={onSchemaChange as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onSaveAsTemplate={onSaveAsTemplate as any}
        />
      ) : (
        <div className="p-6">
          {/* §5 per-section completion meter. Counts fields on the schema
              (descending one level into object children) and shows how many
              are filled. Skipped when the section has zero fields. */}
          {(() => {
            const isFilled = (v: unknown): boolean => {
              if (v === null || v === undefined) return false
              if (typeof v === 'string') return v.trim().length > 0
              if (typeof v === 'boolean') return true
              if (typeof v === 'number') return Number.isFinite(v)
              if (Array.isArray(v)) return v.length > 0
              if (typeof v === 'object') return Object.keys(v as object).length > 0
              return !!v
            }
            let filled = 0
            let total = 0
            for (const f of schema.fields) {
              if (f.type === 'object' && f.children?.length) {
                const obj = (data as Record<string, unknown>)?.[f.key]
                for (const child of f.children) {
                  total++
                  if (isFilled((obj as Record<string, unknown> | undefined)?.[child.key])) filled++
                }
              } else {
                total++
                if (isFilled((data as Record<string, unknown>)?.[f.key])) filled++
              }
            }
            if (total === 0) return null
            const pct = Math.round((filled / total) * 100)
            return (
              <div
                className="mb-4 flex items-center gap-3"
                aria-label={`${filled} of ${total} fields filled`}
              >
                <div className="h-1 flex-1 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-terracotta transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="whitespace-nowrap text-[11.5px] text-gray-500">
                  {filled} of {total} fields · {pct}%
                </span>
              </div>
            )
          })()}
          {(() => {
            const show = (process.env.NEXT_PUBLIC_SHOW_PROVENANCE ? process.env.NEXT_PUBLIC_SHOW_PROVENANCE === 'true' : process.env.NODE_ENV !== 'production')
            if (!show) return null
            const runtime = Array.isArray((data as any)?.__provenance) ? (data as any).__provenance : []
            // Deduplicate by artifactId + page so "Hernandez.pdf p.4" and
            // "Hernandez.pdf p.7" appear as separate chips in the section header.
            const sectionRefs: SourceRef[] = Array.from(new Map(
              runtime
                .filter((r: any) => r && r.artifactId)
                .map((r: any) => {
                  const key = `${r.artifactId}::${r.page ?? ''}`
                  return [key, { artifactId: r.artifactId, page: r.page, confidence: r.confidence } as SourceRef]
                })
            ).values()) as SourceRef[]
            if (sectionRefs.length === 0) return null
            return (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-700">Sources</h4>
                </div>
                <ProvenanceChips
                  sources={sectionRefs}
                  onOpenPreview={(ref) => setPreviewRef(ref)}
                />
              </div>
            )
          })()}
          {/* Dynamic Fields.
              For Student-Information-style headers, split into two lanes:
                - Main: clinician-edited manual fields (the reps they care about)
                - Auto-filled aside: computed / locked / AI-extracted fields
              For non-header sections, keep the simple single-grid render so
              those editors aren't destabilized. */}
          {isHeaderSection ? (() => {
            const isAutoField = (f: FieldSchema) => !!f.mode && f.mode !== 'manual'
            const manualFields = schema.fields.filter((f) => !isAutoField(f))
            const autoFields = schema.fields.filter(isAutoField)
            return (
              <div className={`mb-6 ${autoFields.length > 0 ? 'grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start' : ''}`}>
                <div className="rounded-md border border-gray-200 bg-gray-50/60 p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 items-start">
                    {manualFields.map((field) => (
                      <React.Fragment key={field.key}>
                        {renderField(field, data[field.key])}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                {autoFields.length > 0 && (
                  <aside
                    className="rounded-md border border-gray-200 bg-[#faf9f5] p-3 lg:sticky lg:top-4"
                    aria-label="Auto-filled fields"
                  >
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                      <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12l2 2 4-4" />
                        <path d="M12 2L4 7v6c0 5 3.8 8.5 8 9 4.2-.5 8-4 8-9V7l-8-5z" />
                      </svg>
                      <span>Auto-filled</span>
                      <span className="ml-1 opacity-60">· {autoFields.length}</span>
                    </div>
                    <div className="space-y-2.5">
                      {autoFields.map((field) => (
                        <React.Fragment key={field.key}>
                          {renderField(field, data[field.key])}
                        </React.Fragment>
                      ))}
                    </div>
                  </aside>
                )}
              </div>
            )
          })() : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-6 items-start">
              {schema.fields.map((field) => (
                <React.Fragment key={field.key}>
                  {renderField(field, data[field.key])}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onDataReceived={(receivedData) => {
          // Update structured data from uploaded content
          const newData = { ...data, ...receivedData }
          setData(newData)
          const generatedText = generateProseText(newData)
          onChange(newData, generatedText)
          setShowUploadModal(false)
        }}
        sectionType={schema.key}
        />

      {/* Provenance Preview (lightweight) */}
      {previewRef && (
        <BaseModal
          isOpen={!!previewRef}
          title="Source Preview"
          onClose={() => setPreviewRef(null)}
          footer={<></>}
        >
          <div className="p-4 space-y-2 text-sm">
            <div className="text-slate-700"><span className="font-medium">Artifact:</span> {previewRef.artifactId}</div>
            {previewRef.page !== undefined && (
              <div className="text-slate-700"><span className="font-medium">Page:</span> {previewRef.page}</div>
            )}
            {previewRef.timestamp && (
              <div className="text-slate-700"><span className="font-medium">Time:</span> {`${Math.floor(previewRef.timestamp.startSec/60)}:${String(Math.round(previewRef.timestamp.startSec%60)).padStart(2,'0')} – ${Math.floor(previewRef.timestamp.endSec/60)}:${String(Math.round(previewRef.timestamp.endSec%60)).padStart(2,'0')}`}</div>
            )}
            {previewRef.confidence !== undefined && (
              <div className="text-slate-700"><span className="font-medium">Confidence:</span> {Math.round(previewRef.confidence*100)}%</div>
            )}
            {previewRef.note && (
              <div className="text-slate-700"><span className="font-medium">Note:</span> {previewRef.note}</div>
            )}
            {previewRef.region && (
              <div className="text-slate-700"><span className="font-medium">Region:</span> x:{previewRef.region.x}, y:{previewRef.region.y}, w:{previewRef.region.width}, h:{previewRef.region.height}</div>
            )}
            <div className="mt-3 text-slate-500">
              Preview of the exact page/region can be wired to your Sources viewer. This is a safe placeholder.
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  )
}
