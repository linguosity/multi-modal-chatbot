# Development Guidelines & Common Pitfalls

## 🚨 CRITICAL: Stack Overflow Prevention

### The Problem
**RangeError: Maximum call stack size exceeded** has occurred multiple times in this project due to:

1. **Recursive object traversal** without depth limits
2. **Deep object comparison** using stringify in React hooks
3. **Complex nested data structures** (report schemas, assessment data)

### ⚠️ RED FLAGS - Never Do This

```typescript
// ❌ NEVER: Recursive traversal without depth limits
function processObject(obj: any): any {
  if (typeof obj === 'object') {
    for (const key in obj) {
      obj[key] = processObject(obj[key]); // 💥 Stack overflow risk
    }
  }
  return obj;
}

// ❌ NEVER: Stringify comparison in useEffect
useEffect(() => {
  const current = JSON.stringify(data);
  const previous = JSON.stringify(prevData);
  if (current !== previous) {
    // This will blow up on deep objects
  }
}, [data, prevData]);

// ❌ NEVER: Circular reference detection with recursion
function hasCircular(obj: any, seen = new Set()): boolean {
  for (const key in obj) {
    if (hasCircular(obj[key], seen)) return true; // 💥 Stack overflow
  }
}
```

### ✅ SAFE PATTERNS - Always Use These

```typescript
// ✅ SAFE: Iterative traversal with queue
function processObjectSafe(input: unknown): unknown {
  const queue = [[root, input, ""]];
  while (queue.length) {
    const [parent, current, key] = queue.shift()!;
    // Process iteratively using heap, not call stack
  }
}

// ✅ SAFE: Reference equality in useEffect
const prevRef = useRef(null);
useEffect(() => {
  if (prevRef.current !== data) {
    prevRef.current = data;
    // Handle change
  }
}, [data]); // Simple reference check

// ✅ SAFE: Guarded debug logging
if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
  console.log('Debug:', safeStringify(data));
}
```

## 🛡️ Mandatory Code Review Checklist

Before merging any PR, verify:

- [ ] **No recursive functions** without explicit depth limits
- [ ] **No JSON.stringify** in useEffect dependencies
- [ ] **No deep object comparison** in render loops
- [ ] **Debug logging** is gated behind environment flags
- [ ] **Complex data structures** use iterative processing

## 🔍 Detection Commands

Run these regularly to catch issues early:

```bash
# Search for dangerous patterns
grep -r "JSON.stringify.*useEffect" src/
grep -r "function.*recursive" src/
grep -r "for.*in.*obj.*recursive" src/

# Check for circular reference risks
grep -r "removeCircularReferences" src/
grep -r "hasCircularReference" src/
```

## 📚 Safe Utilities Available

Use these instead of rolling your own:

```typescript
// From src/lib/utils/clean-data.ts
import { 
  removeCircularReferences, // Iterative, stack-safe
  hasCircularReference,     // Iterative detection
  safeStringify            // Handles circular refs
} from '@/lib/utils/clean-data';

// From src/lib/utils/safeStringify.ts
import { 
  safeStringify,  // For debug logging
  safeDebug       // Lightweight debug function
} from '@/lib/utils/safeStringify';
```

## 🎯 When This Error Occurs

**Symptoms:**
- `RangeError: Maximum call stack size exceeded`
- Browser stuck in reload → 404 → error → reload cycle
- Dev server shows compile errors but page won't load
- Console floods with chunk 404 errors

**Immediate Fix:**
1. Kill dev server: `pkill -f "pnpm dev"`
2. Clean build: `rm -rf .next .turbo`
3. Find the recursive function causing the issue
4. Replace with iterative version
5. Restart: `pnpm dev`

## 📖 Historical Incidents

### Incident 1: removeCircularReferences (Fixed)
- **Date**: Current session
- **Cause**: Recursive object traversal in `clean-data.ts`
- **Fix**: Replaced with iterative breadth-first traversal
- **Files**: `src/lib/utils/clean-data.ts`

### Incident 2: DynamicStructuredBlock useEffect (Fixed)
- **Date**: Current session  
- **Cause**: `JSON.stringify` comparison in useEffect hook
- **Fix**: Replaced with reference equality checks
- **Files**: `src/components/DynamicStructuredBlock.tsx`

### Incident 3: Deep Report Schema Processing (Fixed)
- **Date**: Current session
- **Cause**: Complex nested report data structures
- **Fix**: Iterative processing + debug guards
- **Files**: Multiple components processing report data

## 🚀 Prevention Strategy

1. **Code Reviews**: Always check for recursive patterns
2. **Linting Rules**: Add ESLint rules to catch dangerous patterns
3. **Testing**: Test with deeply nested mock data
4. **Monitoring**: Regular grep searches for risky patterns
5. **Documentation**: Keep this guide updated with new incidents

---

**Remember**: JavaScript's call stack limit is ~10,000 frames. Complex objects can easily exceed this through innocent-looking recursive code. Always prefer iterative solutions for object traversal.
# Development Guidelines

## Troubleshooting: Client Components and the "use client" Directive

Symptom
- Next.js build fails with: "The 'use client' directive must be placed before other expressions. Move it to the top of the file..."

Root cause
- Files that use React client-only hooks (useEffect, useRouter, useParams, useState, etc.) must be client components and have the directive as the very first line.
- A common failure is accidentally appending "use client" near the bottom of the file during merges/patches, or duplicating the entire file content (two modules in one).

Rules of thumb
- Place `"use client";` at line 1 with no blank lines or imports before it.
- Ensure only one implementation per file (no duplicate components/contexts below the closing brace).
- If you see two identical blocks or a second import block mid‑file, fix the merge to a single, clean implementation.

Quick checklist
- Does the file import/use: useEffect/useState/useRef/useRouter/useParams/usePathname? If yes, it must be a client component.
- Is `"use client";` the very first line? If not, move it.
- Did a previous patch duplicate the file contents? Delete the duplicate and keep a single, clean version.

Related patterns in this repo
- `src/lib/context/ReportContext.tsx` is a client context (uses `useRouter`/`useParams`). Keep it as a single file and ensure the directive sits at line 1.
- Server routes, server utilities, and files that never call client hooks should not have the directive.

## Source of truth for report sections

- Canonical: `public.report_sections` (row-based). The viewer hydrates from here.
- Projection: `reports.sections` (embedded JSON) is derived for compatibility. The repair sync endpoint can mirror both ways when needed.

## Progress toasts

- To stack toasts procedurally, emit a "processing" log first, then a matching "success" or "error" log (see `lib/event-bus.ts`).
- Without streaming, we simulate this after the run. For true real-time stacking, add SSE/WebSocket streaming from the server.
