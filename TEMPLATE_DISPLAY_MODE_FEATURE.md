# Template-Level Display Mode Feature

## Overview
Added the ability for users to set a default display mode preference at the template level, which determines how report sections appear by default when users create reports from that template.

## User Experience

### Template Editor
- **Location**: Template creation/editing page
- **UI**: Toggle switch with three options at the top of the template editor
- **Options**:
  - **📋 Structured Data**: Show sections as forms, tables, and structured fields
  - **📖 Narrative Story**: Show sections as narrative text paragraphs
  - **🤔 Let User Choose**: Allow users to toggle between modes per section

### Report Editing
- The template's display mode preference is automatically applied when users create reports
- Users can still override the template preference using the per-section toggle (if available)
- The hierarchy is: Section-level preference → Template-level preference → User global preference → Default (structured)

## Technical Implementation

### Database Changes
- Added `global_display_mode` column to `report_templates` table
- Column accepts: 'structured', 'narrative', 'ask' (default: 'ask')

### API Changes
- Updated `POST /api/report-templates` to save globalDisplayMode
- Updated `GET /api/report-templates` to return globalDisplayMode
- Added `GET /api/report-templates/[id]` for individual template fetching

### Schema Updates
- Added `globalDisplayMode` field to `ReportTemplateSchema`
- Updated display mode utility to accept template preferences

### Component Updates
- **Template Editor**: Added global display mode toggle
- **Section Editor**: Fetches template display mode and applies it via updated `getDefaultDisplayMode` function

## Display Mode Hierarchy
1. **Section-level default** (from structured-schemas.ts)
2. **Template-level default** (from template editor)
3. **User global preference** (from user settings)
4. **System default** (structured)

## Files Modified
- `src/components/template-editor.tsx`
- `src/lib/schemas/report-template.ts`
- `src/lib/utils/display-mode.ts`
- `src/app/dashboard/reports/[id]/[sectionId]/page.tsx`
- `src/app/api/report-templates/route.ts`
- `src/app/api/report-templates/[id]/route.ts` (new)
- `supabase_migrations/add_global_display_mode_to_templates.sql` (new)

## Benefits
- **Template Creators**: Can set appropriate defaults for their specific use cases
- **Report Writers**: Get consistent, contextually appropriate display modes
- **Flexibility**: Still allows per-section overrides when needed
- **Backward Compatibility**: Existing templates default to 'ask' mode