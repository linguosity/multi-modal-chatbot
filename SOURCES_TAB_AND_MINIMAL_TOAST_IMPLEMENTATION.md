# Sources Tab and Minimal Toast Implementation

## Overview
Successfully implemented two key UX improvements: (1) minimal toast notifications for saving and (2) a new "Sources" tab showing AI input sources with small card components.

## Changes Made

### 1. Minimal Toast Notifications for Saving

#### Updated Toast Context (`src/lib/context/ToastContext.tsx`)
- Enhanced `showAIUpdateToast` function to accept optional `customMessage` parameter
- When custom message provided, shows simple success toast with 3-second duration
- Maintains existing AI update toast functionality for complex updates

```typescript
const showAIUpdateToast = useCallback((updatedSections: string[], changes: string[] = [], customMessage?: string) => {
  // If custom message provided, show simple toast
  if (customMessage) {
    showToast({
      type: 'success',
      description: customMessage,
      duration: 3000 // Shorter duration for simple saves
    })
    return
  }
  // ... existing AI update logic
}, [showToast])
```

#### Updated Section Page Save Function
- Modified `saveSection` function to show minimal toast: "Report saved successfully"
- Applied to manual saves (button click, keyboard shortcut)
- Auto-saves and blur saves remain silent

### 2. Sources Tab with AI Input Cards

#### Created SourcesGrid Component (`src/components/SourcesGrid.tsx`)
- **Professional card layout**: Small cards showing file information
- **File type icons**: Different icons for PDF, image, audio, and text files
- **Comprehensive metadata**: File name, type, upload date, size, description
- **Ghost state**: Shows "No sources available" when no inputs exist
- **Responsive grid**: 1-3 columns based on screen size

#### Key Features:
- **File Type Detection**: Automatic icon assignment based on file type
- **Size Formatting**: Human-readable file sizes (KB, MB, GB)
- **Date Formatting**: Clean date display (e.g., "Jan 15, 2024")
- **Hover Effects**: Subtle shadow on card hover
- **Truncation**: Long file names truncated with ellipsis

#### Enhanced Tab System
- **Three-tab layout**: Data Entry, Edit Template, Sources
- **Conditional display**: Template tab only shows when structured schema exists
- **Visual states**: Active tab highlighted with white background
- **Smooth transitions**: Proper z-index and border handling

### 3. Updated Section Page Layout

#### Tab Navigation
```typescript
// Three modes now supported
const [mode, setMode] = useState<'data' | 'template' | 'sources'>('data')

// Tab buttons with conditional rendering
<button onClick={() => setMode('data')}>Data Entry</button>
{hasStructuredSchema && (
  <button onClick={() => setMode('template')}>Edit Template</button>
)}
<button onClick={() => setMode('sources')}>Sources</button>
```

#### Content Area Switching
- **Sources mode**: Shows SourcesGrid component
- **Data/Template modes**: Shows existing DynamicStructuredBlock or TiptapEditor
- **Narrative view**: Only displays in 'data' mode (not template or sources)

## Mock Data Structure

### Source Item Interface
```typescript
interface SourceItem {
  id: string
  type: 'text' | 'pdf' | 'image' | 'audio'
  fileName: string
  uploadDate: string
  size?: number
  description?: string
}
```

### Example Sources
- **PDF**: "CELF-5_Assessment_Results.pdf" - Clinical assessment results
- **Audio**: "language_sample_recording.mp3" - Conversational sample
- **Text**: "parent_interview_notes.txt" - Developmental history notes

## Visual Design

### Source Cards
- **Clean layout**: Icon, file name, metadata in organized rows
- **Color coding**: Different icon colors for file types (red=PDF, blue=image, green=audio)
- **Professional styling**: White background, subtle borders, hover effects
- **Information hierarchy**: File name prominent, metadata secondary

### Ghost State
- **Dashed border**: Indicates empty/placeholder state
- **Centered content**: Icon and text centered in card
- **Helpful messaging**: Explains how to add sources
- **Consistent styling**: Matches overall design system

### Tab Integration
- **Seamless switching**: Smooth transitions between modes
- **Visual consistency**: Tabs match existing template toggle design
- **Proper spacing**: Negative margins for connected tab appearance

## Benefits Achieved

### 1. Improved Save Feedback
- **Less intrusive**: Simple "Report saved successfully" message
- **Appropriate duration**: 3 seconds vs 8 seconds for AI updates
- **Clear messaging**: Users know exactly what happened
- **Reduced noise**: Auto-saves remain silent

### 2. Enhanced Transparency
- **AI source visibility**: Users can see what inputs contributed to content
- **File management**: Easy overview of uploaded materials
- **Process understanding**: Clear connection between inputs and outputs
- **Trust building**: Transparency in AI processing

### 3. Better Organization
- **Logical grouping**: Sources separated from editing interface
- **Clean interface**: Reduces clutter in main editing area
- **Professional appearance**: Cards look polished and informative
- **Scalable design**: Grid adapts to any number of sources

## Technical Implementation

### Component Architecture
- **Modular design**: SourcesGrid as standalone component
- **Reusable utilities**: File size formatting, date formatting, icon selection
- **Type safety**: Full TypeScript interfaces for all data structures
- **Performance**: Efficient rendering with proper key props

### Integration Points
- **Toast system**: Leverages existing toast infrastructure
- **Tab system**: Extends existing template toggle pattern
- **Data flow**: Ready for real source data from API/database
- **Styling**: Consistent with existing design system

## Future Enhancements

### Potential Additions
1. **Real data integration**: Connect to actual file upload system
2. **Source filtering**: Filter by file type or date
3. **Source details**: Click to view full file information
4. **Source management**: Delete or re-upload sources
5. **Source linking**: Show which sources contributed to specific sections
6. **Progress indicators**: Show processing status for uploaded files

This implementation provides a professional, user-friendly way to view AI input sources while maintaining clean, minimal feedback for save operations.