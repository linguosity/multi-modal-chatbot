# Linguosity Feedback System Guide

This guide explains how to use the comprehensive feedback system implemented in Linguosity, following proven UX patterns for user attention and confirmation.

## Overview

The feedback system implements a three-layer approach:

1. **Inline Micro-Interactions** - Immediate visual cues (flash-to-fade, sparkles)
2. **Persistent Badges** - Visual markers that persist until acknowledged
3. **Ephemeral Confirmations** - Toast notifications that auto-dismiss

## Components

### 1. Toast System (`src/components/ui/toast.tsx`)

Provides ephemeral notifications that appear at the bottom-right and auto-dismiss.

```tsx
import { useToast } from '@/components/ui/toast'

function MyComponent() {
  const { toast } = useToast()
  
  const handleSave = () => {
    toast({
      title: 'Success',
      description: 'Your changes have been saved',
      type: 'success',
      action: {
        label: 'Undo',
        onClick: () => console.log('Undo clicked')
      }
    })
  }
}
```

**Toast Types:**
- `success` - Green, with check icon
- `error` - Red, with alert icon  
- `warning` - Yellow, with alert icon
- `info` - Blue, with info icon (default)

### 2. Badge System (`src/components/ui/update-badge.tsx`)

Shows persistent visual markers for updates, completions, and new items.

```tsx
import { BadgeWrapper, UpdateBadge } from '@/components/ui/update-badge'

// Standalone badge
<UpdateBadge count={3} type="updated" />

// Wrapped around content
<BadgeWrapper
  badge={{ count: 5, type: 'new', ariaLabel: 'Section (5 new items)' }}
>
  <span>Section Title</span>
</BadgeWrapper>
```

**Badge Types:**
- `updated` - Blue dot/count for recent updates
- `completed` - Green checkmark for completed items
- `new` - Orange dot/count for new items

### 3. Field Highlighting (`src/components/ui/FieldHighlight.tsx`)

Provides flash-to-fade highlighting for recently updated fields.

```tsx
import { FieldHighlight } from '@/components/ui/FieldHighlight'

<FieldHighlight sectionId="section-1" fieldPath="field-name">
  <input type="text" />
</FieldHighlight>
```

**Features:**
- 200ms flash followed by gentle fade
- Sparkle indicators for AI updates
- Click/focus to dismiss
- Accessible with ARIA labels

### 4. Unified Feedback Context (`src/lib/context/FeedbackContext.tsx`)

Coordinates all feedback patterns through a single interface.

```tsx
import { useFeedback, useFieldFeedback, useSaveFeedback, useAIFeedback } from '@/lib/context/FeedbackContext'

function MyComponent() {
  const { notifyFieldUpdate, notifySectionUpdate } = useFeedback()
  const notifyField = useFieldFeedback()
  const notifySave = useSaveFeedback()
  const notifyAI = useAIFeedback()
  
  // Field-level update
  notifyField('section-id', 'field-path', {
    showToast: false,
    highlightFields: true
  })
  
  // Section-level update
  notifySectionUpdate('section-id', ['field1', 'field2'])
  
  // Save operation
  notifySave('Report', 'My Report', () => console.log('Undo'))
  
  // AI update
  notifyAI('section-id', ['field1', 'field2'])
}
```

## Usage Patterns

### Form Field Updates

```tsx
const handleInputChange = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }))
  
  // Show field highlight without toast
  notifyField('form-section', field, {
    showToast: false,
    highlightFields: true
  })
}
```

### Save Operations

```tsx
const handleSave = async () => {
  try {
    await saveData()
    
    // Show success toast with undo
    notifySave('Document', documentName, handleUndo)
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to save document',
      type: 'error'
    })
  }
}
```

### AI Content Generation

```tsx
const handleAIGenerate = async () => {
  const updatedFields = await generateContent()
  
  // Show AI feedback
  notifyAI('section-id', Object.keys(updatedFields), {
    toastMessage: 'AI has generated new content'
  })
}
```

### Navigation with Badges

```tsx
// In navigation components
const { isRecentlyUpdated, getFieldChanges } = useRecentUpdates()

{sections.map(section => {
  const isUpdated = isRecentlyUpdated(section.id)
  const updateCount = getFieldChanges(section.id).length
  
  return (
    <BadgeWrapper
      key={section.id}
      badge={isUpdated ? {
        count: updateCount,
        type: 'updated',
        ariaLabel: `${section.title} (${updateCount} updates)`
      } : undefined}
    >
      <NavigationItem>{section.title}</NavigationItem>
    </BadgeWrapper>
  )
})}
```

## Accessibility Features

### Screen Reader Support
- All badges include `aria-label` attributes
- Toast notifications use `aria-live="polite"`
- Field highlights include contextual ARIA labels

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Focus management preserves user context
- No reliance on hover-only interactions

### Color Accessibility
- Color cues paired with icons/shapes
- High contrast ratios maintained
- Colorblind-friendly palette

## Best Practices

### Do's
✅ Use consistent accent colors across all feedback types
✅ Keep flash animations to 150-200ms
✅ Provide undo actions for destructive operations
✅ Include meaningful ARIA labels
✅ Auto-dismiss toasts after 3-4 seconds

### Don'ts
❌ Don't show toasts for every keystroke
❌ Don't use rainbow indicators (stick to brand colors)
❌ Don't rely solely on color for state indication
❌ Don't interrupt user flow with modal confirmations
❌ Don't make animations too aggressive or distracting

## Implementation Checklist

- [ ] Single accent color for all "updated" states
- [ ] 150-200ms highlight / 300ms fade timing
- [ ] Badges hidden when count = 0
- [ ] `aria-live="polite"` on toast container
- [ ] Consistent iconography (check_circle for "done")
- [ ] Undo actions on destructive updates
- [ ] Keyboard + screen reader testing completed

## Demo

Visit `/dashboard/feedback-demo` to see all patterns in action and test the system interactively.

## Integration with Existing Components

The feedback system is already integrated with:
- `ReportSidebar` - Shows update badges on sections and groups
- `NewReportForm` - Shows save confirmations
- `FieldHighlight` - Enhanced with flash-to-fade pattern

To add feedback to new components, wrap them with the appropriate providers in your layout and use the hooks provided by the FeedbackContext.