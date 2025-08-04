// Unified Editor System
// This file provides a clean interface for importing all editor components

export { BaseEditor } from './BaseEditor'
export type { 
  BaseEditorProps, 
  EditorRef, 
  EditorMode, 
  EditorVariant, 
  ToolbarConfig, 
  ToolbarItem 
} from './BaseEditor'

export { RichTextEditor } from './RichTextEditor'
export type { RichTextEditorProps } from './RichTextEditor'

export { StructuredEditor } from './StructuredEditor'
export type { 
  StructuredEditorProps,
  StructuredField,
  StructuredSchema,
  StructuredFieldType,
  StructuredDisplayMode
} from './StructuredEditor'

export { BulletListEditor } from './BulletListEditor'
export type { BulletListEditorProps } from './BulletListEditor'

export { CardStackEditor } from './CardStackEditor'
export type { CardStackEditorProps } from './CardStackEditor'

// Unified Editor Component - automatically chooses the right editor based on mode
export { UnifiedEditor } from './UnifiedEditor'
export type { UnifiedEditorProps } from './UnifiedEditor'

// Editor utilities and hooks
export { useEditorAutoSave } from './hooks/useEditorAutoSave'
export type { UseEditorAutoSaveOptions, UseEditorAutoSaveReturn } from './hooks/useEditorAutoSave'

export { useEditorValidation, commonValidationRules } from './hooks/useEditorValidation'
export type { 
  UseEditorValidationOptions, 
  UseEditorValidationReturn, 
  ValidationRule 
} from './hooks/useEditorValidation'

export { useEditorHistory } from './hooks/useEditorHistory'
export type { 
  UseEditorHistoryOptions, 
  UseEditorHistoryReturn, 
  HistoryEntry 
} from './hooks/useEditorHistory'