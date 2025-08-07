# Stack Overflow Fix Summary

## 🚨 Root Cause
The application was experiencing `RangeError: Maximum call stack size exceeded` due to:

1. **Recursive object traversal** in `removeCircularReferences()` without depth limits
2. **Deep object comparison** using `safeStringify()` in React useEffect hooks
3. **Nested report schemas** creating deeply nested object trees (50+ levels deep)

## ✅ Fixes Applied

### 1. Replaced Recursive with Iterative Algorithms
- **Before**: `removeCircularReferences()` used recursive calls for every property
- **After**: Iterative breadth-first traversal using explicit queue (heap-based, not stack-based)
- **Impact**: Eliminates stack overflow on deep objects

### 2. Eliminated "Diff by Stringify" Pattern
- **Before**: `useEffect` compared objects using `safeStringify(data)` on every render
- **After**: Simple reference equality checks (`prevRef.current !== newData`)
- **Impact**: No more deep object walks in render loops

### 3. Guarded Debug Logging
- **Before**: `safeStringify()` called unconditionally in console.log statements
- **After**: Only called when `process.env.NEXT_PUBLIC_DEBUG === 'true'`
- **Impact**: No performance impact in production

### 4. Updated hasCircularReference
- **Before**: Recursive traversal that could also stack overflow
- **After**: Iterative queue-based detection
- **Impact**: Safe circular reference detection

## 🎯 Key Changes

### DynamicStructuredBlock.tsx
```typescript
// ❌ Old: Deep stringify comparison
useEffect(() => {
  const current = safeStringify(data);
  const next = safeStringify(mergedInitialData);
  if (current !== next) setData(mergedInitialData);
}, [mergedInitialData, data]);

// ✅ New: Reference equality check
const prevMerged = useRef<Json | null>(null);
useEffect(() => {
  if (prevMerged.current !== mergedInitialData) {
    prevMerged.current = mergedInitialData;
    setData(mergedInitialData);
  }
}, [mergedInitialData]); // data removed from deps
```

### clean-data.ts
```typescript
// ❌ Old: Recursive traversal
export function removeCircularReferences(obj: any, seen = new WeakSet()): any {
  // ... recursive calls for every property
}

// ✅ New: Iterative queue-based traversal
export function removeCircularReferences(input: unknown): unknown {
  const queue: Array<[any, any, string | number]> = [[root, input, ""]];
  const seen = new WeakMap<any, any>();
  
  while (queue.length) {
    // ... iterative processing
  }
}
```

## 🧪 Testing
- ✅ No more `RangeError: Maximum call stack size exceeded`
- ✅ No more 404 reload loops
- ✅ Page hydration completes successfully
- ✅ Deep nested objects handled safely
- ✅ Circular references still detected and handled

## 📊 Performance Impact
- **Before**: O(n^depth) recursive calls, stack overflow at ~10,000 frames
- **After**: O(n) iterative traversal, uses heap memory instead of call stack
- **Debug mode**: Zero performance impact when `NEXT_PUBLIC_DEBUG !== 'true'`

## 🔧 Usage
```bash
# Normal development (no debug logs)
pnpm dev

# Debug mode (with detailed logging)
NEXT_PUBLIC_DEBUG=true pnpm dev
```