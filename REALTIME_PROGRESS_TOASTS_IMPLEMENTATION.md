# Real-time Field-level Progress Toasts Implementation

## Overview
Implemented a comprehensive real-time progress toast system that provides granular feedback during AI processing by parsing backend log streams and displaying field-level updates to users.

## Architecture

### 1. Event Bus System (`src/lib/event-bus.ts`)
- **Centralized event handling** for processing updates
- **Log parsing utilities** for extracting structured data from log lines
- **Timeout management** for detecting stalled updates
- **Type-safe event interfaces** for all event types

#### Key Components:
```typescript
interface ProcessingUpdateEvent {
  id: string; // ${section_id}.${field_path}
  sectionId: string;
  fieldPath: string;
  fieldLabel: string; // User-friendly label
  action: 'replace' | 'append' | 'remove';
  verb: string; // "Updating", "Adding", "Removing"
  timestamp: number;
}
```

#### Log Parsing:
- **Update pattern**: `📝 Processing update: ebddbf13-....language_criteria ... replace`
- **Success pattern**: `✅ Updated ebddbf13-....language_criteria`
- **Error pattern**: `❌ Failed to update ebddbf13-....language_criteria`

### 2. Toast Dispatcher (`src/lib/progress-toast-dispatcher.ts`)
- **Toast lifecycle management** from creation to completion
- **Coalescing logic** for multiple updates in same section
- **Throttling mechanism** with max 5 concurrent toasts
- **Automatic cleanup** for completed toasts

#### Key Features:
- **Individual toasts** for single field updates
- **Coalesced toasts** when 3+ fields update in same section
- **Timeout detection** with 30-second timeout per update
- **Error state management** with detailed error messages

### 3. Progress Toast Component (`src/components/ProgressToast.tsx`)
- **Visual status indicators** with appropriate icons and colors
- **Dynamic messaging** based on toast state and count
- **Dismissible error toasts** with close button
- **Responsive container** for multiple toasts

#### Visual States:
- **Processing**: Blue background, spinning loader icon
- **Success**: Green background, checkmark icon (auto-dismiss after 2s)
- **Error**: Red background, alert icon (dismissible)
- **Timeout**: Orange background, clock icon (dismissible)

### 4. Context Provider (`src/lib/context/ProgressToastContext.tsx`)
- **React integration** with hooks and context
- **Global toast container** rendering
- **Log processing interface** for backend integration
- **Cleanup management** on unmount

## Implementation Details

### Log Stream Processing
```typescript
// Parse processing update
const updateEvent = parseProcessingUpdateLog(logLine);
if (updateEvent) {
  eventBus.emit('processing-update', updateEvent);
}

// Parse completion
const completeEvent = parseProcessingCompleteLog(logLine);
if (completeEvent) {
  eventBus.emit('processing-complete', completeEvent);
}
```

### Toast Coalescing Logic
```typescript
// Coalesce when 3+ updates in same section
if (currentCount >= this.COALESCE_THRESHOLD) {
  this.handleCoalescedToast(sectionId, verb);
} else {
  // Create individual toast
  this.addToast(individualToast);
}
```

### Throttling Mechanism
```typescript
// Enforce max concurrent toasts
if (this.toasts.size >= this.MAX_CONCURRENT_TOASTS) {
  // Remove oldest toast
  const oldestId = Array.from(this.toasts.keys())[0];
  this.toasts.delete(oldestId);
}
```

## User Experience Flow

### 1. Processing Starts
- User initiates AI processing (file upload, text input, etc.)
- Backend begins processing and emits log lines
- Toast appears immediately: "Updating Language Criteria..."

### 2. Multiple Updates
- If 3+ fields update in same section, toasts coalesce
- Display changes to: "Updating Assessment Results (5 fields)..."
- Individual field toasts are removed to reduce clutter

### 3. Completion States
- **Success**: Toast turns green with checkmark, auto-dismisses after 2s
- **Error**: Toast turns red with alert icon, shows error message, user can dismiss
- **Timeout**: Toast turns orange after 30s, indicates stalled update

### 4. Error Handling
- Failed updates show specific error messages
- Timeout detection prevents indefinite loading states
- Users can dismiss error toasts manually

## Integration Points

### Backend Integration
```typescript
// In your AI processing endpoint
const { processLogLine } = useProgressToasts();

// Process streaming logs
logStream.on('data', (line) => {
  processLogLine(line.toString());
});
```

### Component Usage
```typescript
// Access progress toasts in any component
const { toasts, clearAllToasts } = useProgressToasts();

// Simulate processing for testing
const { simulateProcessing } = useLogSimulator();
```

## Configuration Options

### Timing Settings
- **Toast timeout**: 30 seconds per update
- **Success auto-dismiss**: 2 seconds
- **Coalesce threshold**: 3 updates per section
- **Max concurrent toasts**: 5 toasts

### Customization
- **Field label formatting**: Converts `language_criteria` → "Language Criteria"
- **Action verb mapping**: `replace` → "Updating", `append` → "Adding"
- **Section name mapping**: Extensible for user-friendly section names

## Testing

### Test Page (`src/app/test-progress-toasts/page.tsx`)
- **Comprehensive demo** of all toast states and scenarios
- **Simulation controls** for different processing patterns
- **Real-time visualization** of toast behavior
- **Documentation** of log format examples

### Test Scenarios:
1. **Assessment Processing**: 5 field updates with realistic timing
2. **Eligibility Update**: 3 field updates in single section
3. **Error Scenario**: Failed field update with error message
4. **Timeout Scenario**: Stalled update triggering timeout
5. **Mixed Scenario**: Multiple sections + errors simultaneously

## Benefits

### 1. Enhanced User Experience
- **Real-time feedback** instead of frozen loading screens
- **Granular progress** showing exactly what's being processed
- **Clear completion states** with visual confirmation
- **Error transparency** with specific failure information

### 2. Improved Debugging
- **Field-level visibility** into processing pipeline
- **Timeout detection** for identifying bottlenecks
- **Error pinpointing** for specific field failures
- **Processing timing** insights for optimization

### 3. Reduced User Anxiety
- **Continuous feedback** during long processing operations
- **Progress indication** showing system is working
- **Clear error states** instead of mysterious failures
- **Professional appearance** building user confidence

## Performance Considerations

### 1. Efficient Event Handling
- **Event bus pattern** for decoupled communication
- **Minimal re-renders** with optimized React hooks
- **Memory cleanup** on component unmount
- **Timeout management** preventing memory leaks

### 2. Toast Optimization
- **Automatic coalescing** reduces visual clutter
- **Throttling mechanism** prevents toast spam
- **Auto-dismissal** for success states
- **Efficient DOM updates** with React keys

### 3. Log Processing
- **Regex-based parsing** for fast log line processing
- **Structured event objects** for type safety
- **Minimal data transformation** for performance
- **Cleanup utilities** for resource management

## Future Enhancements

### Potential Improvements
1. **Progress bars** for long-running field updates
2. **Retry mechanisms** for failed updates
3. **Batch operations** with progress tracking
4. **Custom toast positioning** and styling options
5. **Sound notifications** for completion states
6. **Keyboard shortcuts** for toast management
7. **Analytics integration** for processing metrics
8. **Accessibility enhancements** for screen readers

This implementation provides a robust, user-friendly way to surface real-time AI processing progress, significantly improving the user experience during long-running operations while providing valuable debugging insights for developers.