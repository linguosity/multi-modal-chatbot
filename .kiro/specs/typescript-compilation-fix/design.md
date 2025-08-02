# Design Document

## Overview

This design addresses the systematic resolution of TypeScript compilation errors in the Linguosity application through a structured 6-pass approach. The design focuses on identifying root causes of compilation failures and implementing targeted fixes that restore type safety while maintaining existing functionality.

## Architecture

### Problem Classification System

The compilation errors are categorized into six distinct passes, each targeting a specific class of issues:

1. **Pass 1: Compiler Stoppers** - Critical syntax and import errors that prevent compilation
2. **Pass 2: Domain Model Synchronization** - Type mismatches between database schema and frontend types
3. **Pass 3: Component Prop Contracts** - Interface mismatches between components and their expected props
4. **Pass 4: UI Library Compatibility** - Missing variant types in UI component libraries
5. **Pass 5: Third-party Version Conflicts** - Package version mismatches, particularly Tiptap/ProseMirror
6. **Pass 6: Edge-case Type Mismatches** - Remaining specific type incompatibilities

### Error Analysis Results

Based on the current codebase analysis:

#### Critical Import Issues
- `createServerSupabase` is imported but the actual export is `createSupabaseServerClient`
- Multiple files reference the incorrect function name

#### Type Model Drift
- Database uses snake_case (`section_type`, `structured_data`) 
- Frontend expects camelCase (`sectionType`, `hydratedHtml`, `studentBio`)
- Missing fields in Section interface: `hydratedHtml`, `studentBio`

#### UI Component Issues
- Button component missing "outline" variant in the variants union
- Current variants: default, primary, secondary, destructive, ghost, link

#### Variable Initialization
- API routes have uninitialized `response` variables in try/catch blocks
- Particularly in `generate-section/route.ts`

## Components and Interfaces

### Type System Standardization

#### Canonical Section Interface
```typescript
interface Section {
  id: string;
  report_id: string;
  sectionType: string; // Standardized camelCase
  title: string;
  order: number;
  content: string | null;
  structured_data: Json | null;
  hydratedHtml?: string; // Missing field to add
  studentBio?: StudentBio; // Missing field to add
  isCompleted?: boolean;
  isRequired?: boolean; // For component compatibility
  isGenerated?: boolean; // For component compatibility
}
```

#### Database Mapping Strategy
```typescript
// Transform snake_case DB fields to camelCase frontend fields
const transformSection = (dbSection: DatabaseSection): Section => ({
  ...dbSection,
  sectionType: dbSection.section_type,
  // Add other transformations as needed
});
```

### Import Resolution Strategy

#### Supabase Client Imports
```typescript
// Current incorrect imports
import { createServerSupabase } from '@/lib/supabase/server';

// Correct imports
import { createSupabaseServerClient } from '@/lib/supabase/server';
```

### UI Component Enhancement

#### Button Variant Extension
```typescript
const buttonVariants = cva(
  // ... existing base styles
  {
    variants: {
      variant: {
        default: "...",
        primary: "...",
        secondary: "...",
        destructive: "...",
        ghost: "...",
        link: "...",
        outline: "bg-transparent border border-input hover:bg-accent hover:text-accent-foreground", // Add missing variant
      },
      // ... rest of variants
    }
  }
);
```

## Data Models

### Report Type Hierarchy

```typescript
// Base database types (snake_case)
interface DatabaseSection {
  id: string;
  report_id: string;
  section_type: string;
  title: string;
  order: number;
  content: string | null;
  structured_data: Json | null;
}

// Frontend types (camelCase)
interface Section extends Omit<DatabaseSection, 'section_type'> {
  sectionType: string;
  hydratedHtml?: string;
  studentBio?: StudentBio;
  isCompleted?: boolean;
  isRequired?: boolean;
  isGenerated?: boolean;
}

// Report with transformed sections
interface Report extends Omit<DatabaseReport, 'sections'> {
  sections: Section[];
}
```

### API Response Transformation

```typescript
// Server-side transformation in getReportForView.ts
export const getReportForView = async (reportId: string): Promise<Report> => {
  const dbReport = await fetchReportFromDatabase(reportId);
  
  return {
    ...dbReport,
    sections: dbReport.sections.map(transformSection)
  };
};
```

## Error Handling

### Variable Initialization Pattern

```typescript
// API route pattern for proper initialization
export async function POST(request: Request) {
  let response: ToolResponse | null = null; // Initialize before try/catch
  
  try {
    response = await processRequest(request);
    // ... processing logic
  } catch (error) {
    // response is safely initialized
    return handleError(error);
  }
  
  return NextResponse.json(response);
}
```

### Package Version Conflict Resolution

```typescript
// Package.json strategy for Tiptap consistency
{
  "dependencies": {
    "@tiptap/core": "2.25.0",
    "@tiptap/extension-document": "2.25.0",
    "@tiptap/extension-paragraph": "2.25.0",
    "@tiptap/extension-text": "2.25.0",
    "@tiptap/pm": "2.25.0",
    "@tiptap/react": "2.25.0"
  },
  "resolutions": {
    "prosemirror-model": "1.19.0",
    "prosemirror-state": "1.4.2",
    "prosemirror-view": "1.31.0"
  }
}
```

## Testing Strategy

### Incremental Validation Approach

1. **Per-Pass Validation**: Run `tsc --noEmit` after each pass to measure progress
2. **Error Count Tracking**: Monitor reduction in error count (target: ~120 → 40 → 12 → 0)
3. **Functional Testing**: Ensure existing functionality remains intact after each pass
4. **Type-only Unit Tests**: Add schema validation tests to prevent regression

### Test Implementation

```typescript
// Type-only validation tests
import { expectType } from 'tsd';
import { Report, Section } from '@/types/report-types';

// Ensure Report type matches expected structure
expectType<Report>({
  id: 'test-id',
  sections: [{
    id: 'section-id',
    sectionType: 'assessment_results',
    title: 'Test Section',
    // ... other required fields
  }]
});
```

### Rollback Strategy

Each pass will be committed separately to enable easy rollback:
```bash
git commit -m "Pass 1: Fix compiler stoppers"
git commit -m "Pass 2: Synchronize domain models"
# ... etc
```

## Implementation Phases

### Phase 1: Critical Fixes (Pass 1)
- Fix `createServerSupabase` import issues
- Initialize variables in API routes
- Resolve immediate compilation blockers

### Phase 2: Type Synchronization (Pass 2)
- Standardize Section interface
- Update database mapping functions
- Implement camelCase transformation

### Phase 3: Component Integration (Pass 3)
- Update component prop interfaces
- Fix ReportSidebar and StudentBioCard prop mismatches
- Ensure component compatibility

### Phase 4: UI Library Updates (Pass 4)
- Add missing Button variants
- Update other UI component types as needed

### Phase 5: Dependency Resolution (Pass 5)
- Align Tiptap package versions
- Resolve ProseMirror conflicts
- Update package.json with resolutions

### Phase 6: Final Cleanup (Pass 6)
- Address remaining edge cases
- Fix ContentBlockParam vs DocumentBlockParam issues
- Resolve reportMeta type mismatches

## Success Metrics

- **Compilation Success**: `tsc --noEmit` completes without errors
- **Build Success**: `pnpm build` creates production build successfully
- **Development Server**: Starts without TypeScript errors
- **Functional Integrity**: All existing features continue to work
- **Type Safety**: Enhanced type checking prevents future regressions