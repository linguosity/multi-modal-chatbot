# Task 7: Editor Consolidation - Migration Guide

## 🎯 Overview

We've successfully consolidated all editor components into a unified system that provides:
- **Consistent API** across all editor types
- **Shared functionality** through hooks
- **Better performance** through optimized implementations
- **Enhanced features** like auto-save, validation, and history

## 📁 New Editor System Structure

```
src/components/editors/
├── index.ts                    # Main exports
├── BaseEditor.tsx             # Base editor interface
├── RichTextEditor.tsx         # Consolidated Tiptap editor
├── StructuredEditor.tsx       # Consolidated structured editing
├── BulletListEditor.tsx       # Consolidated bullet list editing
├── CardStackEditor.tsx        # Consolidated card-based editing
├── UnifiedEditor.tsx          # Auto-selecting editor wrapper
└── hooks/
    ├── useEditorAutoSave.ts   # Auto-save functionality
    ├── useEditorValidation.ts # Validation system
    └── useEditorHistory.ts    # Undo/redo functionality
```

## 🔄 Migration Steps

### 1. Replace Old Editor Imports

**Before:**
```typescript
import { TiptapEditor } from '@/components/TiptapEditor'
import { StructuredTiptapEditor } from '@/components/StructuredTiptapEditor'
import { InlineBulletEditor } from '@/components/InlineBulletEditor'
import { SmartBlockEditor } from '@/components/SmartBlockEditor'
import { CardStackEditor } from '@/components/CardStackEditor'
```

**After:**
```typescript
import { 
  RichTextEditor, 
  StructuredEditor, 
  BulletListEditor, 
  CardStackEditor,
  UnifiedEditor 
} from '@/components/editors'
```

### 2. Update Component Usage

#### Rich Text Editor Migration

**Before (TiptapEditor):**
```typescript
<TiptapEditor
  content={content}
  onChange={handleChange}
  placeholder="Enter text..."
/>
```

**After (RichTextEditor):**
```typescript
<RichTextEditor
  content={content}
  onChange={handleChange}
  placeholder="Enter text..."
  variant="clinical"
  autoSave={true}
  onAutoSave={handleAutoSave}
  showWordCount={true}
  toolbar={{
    formatting: true,
    lists: true,
    headings: true
  }}
/>
```

#### Structured Editor Migration

**Before (StructuredTiptapEditor):**
```typescript
<StructuredTiptapEditor
  content={content}
  onChange={handleChange}
  schema={schema}
/>
```

**After (StructuredEditor):**
```typescript
<StructuredEditor
  schema={schema}
  initialData={data}
  onDataChange={handleDataChange}
  displayMode="form"
  showValidation={true}
  variant="clinical"
/>
```

#### Bullet List Migration

**Before (InlineBulletEditor):**
```typescript
<InlineBulletEditor
  items={items}
  onChange={handleItemsChange}
  placeholder="Add item..."
/>
```

**After (BulletListEditor):**
```typescript
<BulletListEditor
  initialItems={items}
  onItemsChange={handleItemsChange}
  itemPlaceholder="Add item..."
  showAIAssist={true}
  maxItems={10}
  variant="clinical"
/>
```

#### Card Stack Migration

**Before (CardStackEditor):**
```typescript
<CardStackEditor
  cards={cards}
  onChange={handleCardsChange}
/>
```

**After (CardStackEditor):**
```typescript
<CardStackEditor
  initialCards={cards}
  onCardsChange={handleCardsChange}
  collapsible={true}
  allowDuplication={true}
  maxCards={5}
  variant="clinical"
/>
```

### 3. Use UnifiedEditor for Dynamic Switching

```typescript
const [editorMode, setEditorMode] = useState<EditorMode>('rich-text')

<UnifiedEditor
  mode={editorMode}
  content={content}
  onChange={handleChange}
  variant="clinical"
  richTextProps={{
    enableStructuredParsing: true,
    showWordCount: true
  }}
  structuredProps={{
    schema: mySchema,
    displayMode: 'form'
  }}
  bulletListProps={{
    showAIAssist: true,
    maxItems: 10
  }}
  cardStackProps={{
    collapsible: true,
    allowDuplication: true
  }}
/>
```

### 4. Implement Editor Hooks

#### Auto-Save Hook

```typescript
import { useEditorAutoSave } from '@/components/editors'

const { isAutoSaving, lastSaved, triggerAutoSave } = useEditorAutoSave({
  delay: 2000,
  enabled: true,
  onAutoSave: async (content) => {
    await saveToDatabase(content)
  },
  onError: (error) => {
    console.error('Auto-save failed:', error)
  }
})

// Trigger auto-save on content change
useEffect(() => {
  triggerAutoSave(content)
}, [content, triggerAutoSave])
```

#### Validation Hook

```typescript
import { useEditorValidation, commonValidationRules } from '@/components/editors'

const { errors, isValid, validate } = useEditorValidation({
  rules: [
    commonValidationRules.required('Content'),
    commonValidationRules.minLength(10, 'Content'),
    commonValidationRules.professionalTone('Content')
  ],
  validateOnChange: true
})
```

#### History Hook

```typescript
import { useEditorHistory } from '@/components/editors'

const { canUndo, canRedo, undo, redo, addEntry } = useEditorHistory({
  maxEntries: 50,
  debounceDelay: 1000
})

// Add to history on content change
useEffect(() => {
  addEntry(content, 'Content updated')
}, [content, addEntry])
```

## 🎨 Enhanced Features

### 1. Clinical Variant Styling
All editors now support a `variant="clinical"` prop for professional medical styling:
- Blue-tinted backgrounds
- Professional typography
- Clinical-appropriate spacing

### 2. Auto-Save Functionality
Built-in auto-save with visual indicators:
- Configurable delay
- Error handling
- Last saved timestamp

### 3. Validation System
Comprehensive validation with common rules:
- Required fields
- Length limits
- Professional tone checking
- Custom validation functions

### 4. History Management
Undo/redo functionality:
- Configurable history size
- Debounced entry addition
- Jump to specific history points

### 5. Accessibility Improvements
- Full keyboard navigation
- Screen reader support
- Focus management
- ARIA labels

## 🔧 Component-Specific Updates

### ReportSectionCard.tsx
```typescript
// Replace existing editor with UnifiedEditor
<UnifiedEditor
  mode={sectionType === 'structured' ? 'structured' : 'rich-text'}
  content={section.content}
  onChange={handleContentChange}
  variant="clinical"
  autoSave={true}
  onAutoSave={handleAutoSave}
  structuredProps={{
    schema: sectionSchema,
    showValidation: true
  }}
/>
```

### Template Editor Updates
```typescript
// Use StructuredEditor for template field editing
<StructuredEditor
  schema={templateSchema}
  initialData={templateData}
  onDataChange={handleTemplateChange}
  displayMode="form"
  allowFieldManagement={true}
  variant="clinical"
/>
```

## 📊 Performance Improvements

1. **Reduced Bundle Size**: Consolidated components eliminate duplicate code
2. **Better Tree Shaking**: Modular exports allow importing only needed components
3. **Optimized Re-renders**: Improved state management reduces unnecessary updates
4. **Lazy Loading**: Components can be loaded on-demand

## 🧪 Testing Updates

Update tests to use the new editor system:

```typescript
import { render, screen } from '@testing-library/react'
import { RichTextEditor } from '@/components/editors'

test('renders rich text editor', () => {
  render(
    <RichTextEditor
      content="Test content"
      onChange={jest.fn()}
      data-testid="rich-text-editor"
    />
  )
  
  expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument()
})
```

## 🎯 Next Steps

1. **Update existing components** to use the new editor system
2. **Remove old editor files** after migration is complete
3. **Update documentation** to reflect the new API
4. **Add comprehensive tests** for the new editor system
5. **Monitor performance** improvements in production

## 📝 Breaking Changes

- **Import paths changed**: Update all imports to use `@/components/editors`
- **Prop names changed**: Some props have been renamed for consistency
- **Event signatures changed**: Some event handlers have different signatures
- **Ref methods changed**: Editor ref methods have been standardized

## 🔍 Validation Checklist

- [ ] All editor imports updated
- [ ] Component props migrated to new API
- [ ] Event handlers updated
- [ ] Ref usage updated to new methods
- [ ] Tests updated for new components
- [ ] Old editor files removed
- [ ] Documentation updated

This consolidation provides a much more maintainable and feature-rich editor system while maintaining backward compatibility where possible.