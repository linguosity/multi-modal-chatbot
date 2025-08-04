# Task 8: Auto-Save and Loading States Implementation Guide

## 🎯 Overview

We've implemented a comprehensive auto-save and loading state system that provides:
- **Enhanced AutoSaveIndicator** with connection status and clinical styling
- **Comprehensive LoadingState** components with accessibility features
- **Form Validation System** with inline error display and recovery guidance
- **Async Operation Management** with retry logic and error handling
- **Global Loading Context** for application-wide loading state management

## 📁 New Components Structure

```
src/components/ui/
├── auto-save-indicator.tsx    # Enhanced auto-save with connection status
├── loading-state.tsx          # Comprehensive loading states
├── form-validation.tsx        # Form validation with recovery actions
└── index.ts                   # Centralized exports

src/lib/
├── hooks/
│   └── useAsyncOperation.ts   # Async operation management
└── context/
    └── LoadingContext.tsx     # Global loading state management
```

## 🚀 Enhanced AutoSaveIndicator

### Features
- **Connection Status**: Shows online/offline state
- **Clinical Variant**: Professional medical styling
- **Error Recovery**: Retry and dismiss actions
- **Accessibility**: Full ARIA support and screen reader compatibility

### Usage Examples

#### Basic Auto-Save
```typescript
import { AutoSaveIndicator, useAutoSave } from '@/components/ui'

function ReportEditor() {
  const { status, lastSaved, error, markSaving, markSaved, markError } = useAutoSave()
  
  const handleSave = async (content: string) => {
    markSaving()
    try {
      await saveReport(content)
      markSaved()
    } catch (err) {
      markError('Failed to save report')
    }
  }

  return (
    <div>
      <AutoSaveIndicator
        status={status}
        lastSaved={lastSaved}
        error={error}
        variant="clinical"
        showConnectionStatus={true}
        onRetry={() => handleSave(currentContent)}
      />
    </div>
  )
}
```

#### Advanced Auto-Save with Hooks
```typescript
import { useAutoSave } from '@/lib/hooks/useAsyncOperation'

function SmartEditor() {
  const autoSave = useAutoSave({
    saveFunction: async (data) => {
      await fetch('/api/save', {
        method: 'POST',
        body: JSON.stringify(data)
      })
    },
    delay: 2000,
    enabled: true,
    onSuccess: () => console.log('Saved successfully'),
    onError: (error) => console.error('Save failed:', error)
  })

  const handleContentChange = (content: string) => {
    // Trigger auto-save
    autoSave.triggerSave({ content, timestamp: Date.now() })
  }

  return (
    <div>
      <textarea onChange={(e) => handleContentChange(e.target.value)} />
      <AutoSaveIndicator
        status={autoSave.isSaving ? 'saving' : autoSave.lastSaveSuccessful ? 'saved' : 'idle'}
        error={autoSave.saveError?.message}
        variant="clinical"
      />
    </div>
  )
}
```

## 🔄 Comprehensive Loading States

### LoadingState Component
```typescript
import { LoadingState } from '@/components/ui'

// Basic loading
<LoadingState
  state="loading"
  message="Generating report..."
  size="lg"
  variant="clinical"
/>

// Success with auto-dismiss
<LoadingState
  state="success"
  successMessage="Report generated successfully!"
  autoDismissSuccess={true}
  autoDismissDelay={3000}
  onDismiss={handleDismiss}
/>

// Error with retry
<LoadingState
  state="error"
  errorMessage="Failed to generate report"
  onRetry={handleRetry}
  onDismiss={handleDismiss}
/>

// Overlay loading
<LoadingState
  state="loading"
  message="Processing assessment data..."
  overlay={true}
  size="xl"
/>
```

### Skeleton Loading
```typescript
import { Skeleton, LoadingWrapper } from '@/components/ui'

// Text skeleton
<Skeleton lines={3} variant="clinical" />

// Custom skeleton
<Skeleton width="200px" height="40px" circular={true} />

// Loading wrapper
<LoadingWrapper
  isLoading={isLoadingData}
  useSkeleton={true}
  skeletonProps={{ lines: 5, variant: 'clinical' }}
>
  <ReportContent data={data} />
</LoadingWrapper>
```

## ✅ Form Validation System

### Comprehensive Validation
```typescript
import { FormValidation, FieldValidation, ValidationSummary } from '@/components/ui'

function ReportForm() {
  const [validationMessages, setValidationMessages] = useState<ValidationMessage[]>([
    {
      id: 'title-required',
      message: 'Report title is required',
      severity: 'error',
      field: 'title',
      recoveryAction: 'Add a descriptive title'
    },
    {
      id: 'content-length',
      message: 'Report content should be at least 100 words',
      severity: 'warning',
      field: 'content',
      recoveryAction: 'Add more detail to the assessment'
    }
  ])

  return (
    <form>
      <div>
        <input name="title" />
        <FieldValidation
          fieldName="title"
          messages={validationMessages}
        />
      </div>
      
      <div>
        <textarea name="content" />
        <FieldValidation
          fieldName="content"
          messages={validationMessages}
        />
      </div>

      {/* Form-wide validation summary */}
      <ValidationSummary
        messages={validationMessages}
        isValid={validationMessages.filter(m => m.severity === 'error').length === 0}
        showCounts={true}
      />
    </form>
  )
}
```

### Inline Validation
```typescript
// Real-time validation as user types
const handleFieldChange = (fieldName: string, value: string) => {
  const newMessages = validateField(fieldName, value)
  setValidationMessages(prev => [
    ...prev.filter(m => m.field !== fieldName),
    ...newMessages
  ])
}
```

## 🔄 Async Operation Management

### useAsyncOperation Hook
```typescript
import { useAsyncOperation } from '@/lib/hooks/useAsyncOperation'

function DataProcessor() {
  const operation = useAsyncOperation({
    autoRetry: true,
    maxRetries: 3,
    retryDelay: 1000,
    onSuccess: (data) => console.log('Success:', data),
    onError: (error) => console.error('Error:', error)
  })

  const processData = async () => {
    await operation.execute(async () => {
      const response = await fetch('/api/process')
      return response.json()
    })
  }

  return (
    <div>
      <button onClick={processData} disabled={operation.isLoading}>
        Process Data
      </button>
      
      {operation.isLoading && <LoadingState state="loading" message="Processing..." />}
      {operation.isError && (
        <LoadingState
          state="error"
          errorMessage={operation.error?.message}
          onRetry={operation.retry}
        />
      )}
      {operation.isSuccess && (
        <LoadingState
          state="success"
          successMessage="Data processed successfully!"
        />
      )}
    </div>
  )
}
```

## 🌐 Global Loading Context

### Setup LoadingProvider
```typescript
// In your app root
import { LoadingProvider } from '@/lib/context/LoadingContext'

function App() {
  return (
    <LoadingProvider showGlobalOverlay={true} maxOverlayOperations={3}>
      <YourApp />
    </LoadingProvider>
  )
}
```

### Using Global Loading
```typescript
import { useLoading, useLoadingOperation } from '@/lib/context/LoadingContext'

function ReportGenerator() {
  const { startLoading, stopLoading } = useLoading()
  
  const generateReport = async () => {
    const operationId = 'generate-report'
    
    try {
      startLoading(operationId, 'Analyzing assessment data...', {
        progress: 0,
        canCancel: true,
        onCancel: () => {
          // Cancel logic
          stopLoading(operationId)
        }
      })
      
      // Simulate progress updates
      for (let i = 0; i <= 100; i += 20) {
        updateLoading(operationId, { 
          progress: i,
          message: `Processing... ${i}%`
        })
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      stopLoading(operationId)
    } catch (error) {
      stopLoading(operationId)
    }
  }

  return (
    <button onClick={generateReport}>
      Generate Report
    </button>
  )
}
```

### Async with Loading Hook
```typescript
import { useAsyncWithLoading } from '@/lib/context/LoadingContext'

function DataUploader() {
  const { execute, result, error } = useAsyncWithLoading(
    'upload-data',
    async () => {
      const formData = new FormData()
      // ... prepare data
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      return response.json()
    },
    {
      loadingMessage: 'Uploading assessment data...',
      successMessage: 'Upload completed successfully!',
      showProgress: true
    }
  )

  return (
    <button onClick={execute}>
      Upload Data
    </button>
  )
}
```

## 🎨 Clinical Styling Integration

All components support the `variant="clinical"` prop for professional medical styling:

```typescript
// Clinical auto-save indicator
<AutoSaveIndicator
  status="saved"
  variant="clinical"
  showConnectionStatus={true}
/>

// Clinical loading state
<LoadingState
  state="loading"
  message="Processing clinical data..."
  variant="clinical"
  size="lg"
/>

// Clinical form validation
<FormValidation
  messages={validationMessages}
  groupBySeverity={true}
/>
```

## 🔧 Integration with Existing Components

### Report Section Editor
```typescript
// Update ReportSectionCard to use new auto-save
import { AutoSaveIndicator, useAutoSave } from '@/components/ui'

function ReportSectionCard({ section, onUpdate }) {
  const autoSave = useAutoSave({
    saveFunction: async (data) => {
      await fetch(`/api/sections/${section.id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
    },
    delay: 2000,
    onSuccess: () => console.log('Section saved'),
    onError: (error) => console.error('Save failed:', error)
  })

  const handleContentChange = (content: string) => {
    onUpdate({ ...section, content })
    autoSave.triggerSave({ content, sectionId: section.id })
  }

  return (
    <div className="report-section-card">
      <div className="section-header">
        <h3>{section.title}</h3>
        <AutoSaveIndicator
          status={autoSave.isSaving ? 'saving' : autoSave.lastSaveSuccessful ? 'saved' : 'idle'}
          error={autoSave.saveError?.message}
          variant="clinical"
          showConnectionStatus={true}
        />
      </div>
      
      <textarea
        value={section.content}
        onChange={(e) => handleContentChange(e.target.value)}
      />
    </div>
  )
}
```

### Template Editor
```typescript
// Enhanced template editor with validation
import { FormValidation, LoadingWrapper } from '@/components/ui'

function TemplateEditor({ template, onSave }) {
  const [validationMessages, setValidationMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  return (
    <LoadingWrapper
      isLoading={isLoading}
      loadingProps={{
        message: 'Loading template...',
        variant: 'clinical'
      }}
    >
      <div className="template-editor">
        {/* Template fields */}
        
        <FormValidation
          messages={validationMessages}
          groupBySeverity={true}
          onRecoveryAction={handleRecoveryAction}
        />
      </div>
    </LoadingWrapper>
  )
}
```

## 📊 Performance Optimizations

1. **Debounced Auto-Save**: Prevents excessive API calls
2. **Connection Awareness**: Queues saves when offline
3. **Retry Logic**: Automatic retry with exponential backoff
4. **Memory Efficient**: Proper cleanup of timeouts and listeners
5. **Accessibility**: Screen reader announcements for state changes

## 🧪 Testing Examples

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { AutoSaveIndicator } from '@/components/ui'

test('shows saving state', () => {
  render(
    <AutoSaveIndicator
      status="saving"
      variant="clinical"
      data-testid="auto-save-indicator"
    />
  )
  
  expect(screen.getByText('Saving...')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
})

test('shows retry button on error', () => {
  const onRetry = jest.fn()
  
  render(
    <AutoSaveIndicator
      status="error"
      error="Save failed"
      onRetry={onRetry}
    />
  )
  
  const retryButton = screen.getByText('Retry')
  fireEvent.click(retryButton)
  
  expect(onRetry).toHaveBeenCalled()
})
```

## 🎯 Success Metrics

- ✅ **Consistent Auto-Save**: All forms now have unified auto-save behavior
- ✅ **Professional Loading States**: Clinical-appropriate loading indicators
- ✅ **Comprehensive Validation**: Inline errors with recovery guidance
- ✅ **Accessibility Compliance**: Full ARIA support and screen reader compatibility
- ✅ **Error Recovery**: Retry mechanisms and helpful error messages
- ✅ **Performance**: Debounced operations and efficient state management

This implementation provides a robust foundation for auto-save and loading states across the entire Linguosity application, ensuring speech-language pathologists never lose their work and always have clear feedback about system status.