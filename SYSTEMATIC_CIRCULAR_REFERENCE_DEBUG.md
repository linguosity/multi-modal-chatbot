# Systematic Circular Reference Debugging Implementation

## Problem Analysis
Following the systematic approach to debug the "Maximum call stack size exceeded" error occurring on `/dashboard/reports/[id]/view`.

## Debugging Strategy Implemented

### 1. Enhanced Safe Logger with Flatted
- **Added `flatted` package** for safe circular reference serialization
- **Enhanced `safeStringify`** to use flatted as fallback when JSON.stringify fails
- **Clear warnings** when circular references are detected

### 2. Multi-Level Debugging Pipeline

#### Level 1: Report View Page (`src/app/dashboard/reports/[id]/view/page.tsx`)
```typescript
// Step-by-step debugging with clear console markers
console.log("🔍 Step 1: About to fetch report for ID:", id);
console.log("🔍 Step 2: Report fetched successfully");
console.log("🔍 Step 3: Checking for circular references in report...");

// Check main report object
if (hasCircularReference(report)) {
  console.error("❌ CIRCULAR REFERENCE DETECTED in report object!");
}

// Check individual sections
report.sections.forEach((section, index) => {
  if (hasCircularReference(section)) {
    console.error(`❌ CIRCULAR REFERENCE DETECTED in section ${index}`);
  }
});
```

#### Level 2: Server Function (`src/lib/server/getReportForView.ts`)
```typescript
// Database fetch debugging
console.log("🔍 getReportForView: Starting fetch for report ID:", reportId);
console.log("✅ Raw report fetched from database");

// Check raw database data
if (hasCircularReference(report)) {
  console.error("❌ CIRCULAR REFERENCE DETECTED in raw database report!");
}

// Check individual raw sections
report.sections.forEach((section, index) => {
  if (hasCircularReference(section)) {
    console.error(`❌ Raw section ${index} has circular references`);
  }
  if (section.structured_data && hasCircularReference(section.structured_data)) {
    console.error(`❌ Raw section ${index} structured_data has circular references`);
  }
});

// Hydration debugging
report.sections.map((s, index) => {
  console.log(`🔍 Hydrating section ${index}: ${s.title}`);
  
  // Check hydration inputs
  const hydrationInput = {
    html: s.content,
    data: s.structured_data ?? {},
    reportMeta: report.metadata ?? {},
  };
  
  if (hasCircularReference(hydrationInput)) {
    console.error(`❌ Hydration input for section ${index} has circular references`);
    return safe fallback;
  }
  
  // Check hydration results
  if (hasCircularReference(hydratedSection)) {
    console.error(`❌ Hydrated section ${index} has circular references`);
    return safe fallback;
  }
});

// Final report check
if (hasCircularReference(finalReport)) {
  console.error("❌ FINAL REPORT HAS CIRCULAR REFERENCES!");
}
```

#### Level 3: Hydration Function (`src/lib/render/hydrateSection.ts`)
```typescript
export function hydrateSection({ html, data, reportMeta }: Input) {
  console.log("🔍 hydrateSection: Starting hydration");
  
  // Check inputs for circular references
  if (hasCircularReference(data)) {
    console.error("❌ Circular reference detected in section data");
    return safe fallback;
  }
  
  if (hasCircularReference(reportMeta)) {
    console.error("❌ Circular reference detected in report metadata");
    return safe fallback;
  }
  
  // Safe data points rendering
  if (Array.isArray(data?.points)) {
    console.log("🔍 hydrateSection: Rendering data points");
    
    if (hasCircularReference(data.points)) {
      console.error("❌ Circular reference detected in data points");
      return safe fallback;
    }
  }
  
  console.log("✅ hydrateSection: Hydration completed");
}
```

#### Level 4: Data Points Rendering (`src/lib/render/renderDataPoints.ts`)
```typescript
// Track visited objects to prevent infinite recursion
const visitedObjects = new WeakSet();

export function renderDataPoints(points: any[]): string {
  // Clear visited objects for each top-level call
  visitedObjects.clear();
  return `<ul>${points.map(node => renderNode(node, 0)).join('')}</ul>`;
}

function renderNode(node: any, depth: number = 0): string {
  // Prevent infinite recursion by limiting depth
  if (depth > 10) {
    console.warn('Maximum recursion depth reached in renderDataPoints');
    return '<li>[Maximum depth reached]</li>';
  }
  
  // Check for circular references
  if (visitedObjects.has(node)) {
    console.warn('Circular reference detected in renderDataPoints');
    return '<li>[Circular reference detected]</li>';
  }
  
  // Mark as visited and process safely
  visitedObjects.add(node);
  try {
    // Safe recursive processing with depth tracking
    const kids = node.points?.length ? 
      `<ul>${node.points.map((child: any) => renderNode(child, depth + 1)).join('')}</ul>` : '';
    return `<li>${head}${prose}${kids}</li>`;
  } finally {
    // Clean up visited tracking
    visitedObjects.delete(node);
  }
}
```

#### Level 5: Minimal Component (`src/app/dashboard/reports/[id]/view/ReportView.minimal.tsx`)
```typescript
export default function ReportView({ report }: ReportViewProps) {
  console.log("🔍 Step 5: ReportView component rendering started");
  
  // Immediate circular reference check
  if (hasCircularReference(report)) {
    console.error("❌ CIRCULAR REFERENCE DETECTED in ReportView props!");
    return error UI;
  }
  
  // Test individual sections
  report.sections.forEach((section, index) => {
    if (hasCircularReference(section)) {
      console.error(`❌ Section ${index} (${section.title}) has circular references`);
    } else {
      console.log(`✅ Section ${index} (${section.title}) is clean`);
    }
  });
  
  // Minimal safe rendering (no complex HTML processing)
  return minimal JSX without hydratedHtml;
}
```

## Safety Features Implemented

### 1. Circular Reference Detection
- **WeakSet tracking** in recursive functions
- **hasCircularReference()** checks at every level
- **Early detection** prevents infinite loops

### 2. Depth Limiting
- **Maximum recursion depth** (10 levels)
- **Clear warnings** when depth limit reached
- **Graceful fallbacks** instead of crashes

### 3. Safe Fallbacks
- **Error messages** instead of crashes
- **Partial content** when possible
- **User-friendly error UI**

### 4. Enhanced Logging
- **Step-by-step debugging** with clear markers
- **Flatted serialization** for circular objects
- **Detailed error reporting** at each level

## Expected Debug Output

When you load the report view page, you should see:

```
🔍 Step 1: About to fetch report for ID: [report-id]
🔍 getReportForView: Starting fetch for report ID: [report-id]
✅ Raw report fetched from database
✅ Raw database report has no circular references
🔍 Checking raw sections for circular references...
✅ Section 0 (Section Title) is clean
🔍 About to hydrate sections...
🔍 Hydrating section 0: Section Title
🔍 hydrateSection: Starting hydration
✅ hydrateSection: Hydration completed
✅ Final report has no circular references
🔍 Step 2: Report fetched successfully
🔍 Step 3: Checking for circular references in report...
✅ No circular references detected in main report object
🔍 Step 4: About to render ReportView component
🔍 Step 5: ReportView component rendering started
✅ No circular references detected in ReportView props
🔍 Checking individual sections for circular references...
✅ Section 0 (Section Title) is clean
🔍 Step 6: About to render minimal JSX
```

## If Circular References Are Found

You'll see specific error messages like:
```
❌ CIRCULAR REFERENCE DETECTED in raw database report!
❌ Raw section 2 structured_data has circular references
❌ Circular reference detected in data points
❌ Hydration input for section 1 has circular references
```

## Next Steps

1. **Load the report view page** and check console output
2. **Identify the exact location** where circular references are detected
3. **Examine the specific data structure** causing the issue
4. **Apply targeted fixes** based on the debugging output

This systematic approach will pinpoint exactly where the circular reference is being introduced in the data pipeline.