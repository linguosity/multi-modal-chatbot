# 🚨 CRITICAL: Recurring Infinite Loop Error Prevention

## THE PROBLEM
**Error: Maximum update depth exceeded** - This error keeps recurring in the NavigationContext and is causing the application to crash.

## ROOT CAUSE ANALYSIS
Based on the stack trace, the issue is in:
- `src/lib/context/NavigationContext.tsx:84:13` - setReportContext callback
- `src/lib/context/NavigationContext.tsx:186:24` - useReportNavigation.useEffect
- `src/app/dashboard/reports/[id]/layout.tsx:275:94` - ReportLayout component

## COMMON CAUSES OF THIS ERROR
1. **useEffect without proper dependencies** - Effect runs on every render
2. **setState inside useEffect that triggers re-render** - Creates infinite loop
3. **Object/array dependencies that change reference on every render**
4. **Circular state updates between contexts**

## IMMEDIATE FIXES TO APPLY

### 1. Check NavigationContext.tsx Line 84
```typescript
// BAD - This might be creating new objects on every render
const setReportContext = useCallback((report) => {
  setContext({ ...context, report }) // Creates new object every time
}, [context]) // context changes every render!

// GOOD - Stable dependencies
const setReportContext = useCallback((report) => {
  setContext(prev => ({ ...prev, report }))
}, []) // Empty deps or specific stable values
```

### 2. Check NavigationContext.tsx Line 186
```typescript
// BAD - Missing dependencies or unstable dependencies
useEffect(() => {
  setReportContext(report)
}, [report, setReportContext]) // setReportContext changes every render!

// GOOD - Stable dependencies with useCallback
const setReportContext = useCallback((report) => {
  // implementation
}, []) // Stable callback

useEffect(() => {
  if (report) {
    setReportContext(report)
  }
}, [report, setReportContext]) // Now setReportContext is stable
```

### 3. Check ReportLayout Line 275
```typescript
// BAD - Passing objects that change every render
<NavigationProvider value={{ report, sections, currentSection }}>

// GOOD - Memoize complex objects
const navigationValue = useMemo(() => ({
  report,
  sections,
  currentSection
}), [report, sections, currentSection])

<NavigationProvider value={navigationValue}>
```

## DEBUGGING STEPS
1. Add console.logs to track re-renders
2. Use React DevTools Profiler to identify render loops
3. Check all useCallback and useMemo dependencies
4. Ensure context values are properly memoized

## PREVENTION CHECKLIST
- [ ] All useEffect hooks have proper dependency arrays
- [ ] All useCallback hooks have stable dependencies
- [ ] Context values are memoized with useMemo
- [ ] No setState calls inside render functions
- [ ] No object/array literals in JSX props or dependencies

## FILES TO IMMEDIATELY CHECK
1. `src/lib/context/NavigationContext.tsx` (Lines 84, 186)
2. `src/app/dashboard/reports/[id]/layout.tsx` (Line 275)
3. Any other context providers in the report layout

**THIS ERROR MUST BE FIXED BEFORE ANY OTHER WORK - IT MAKES THE APP UNUSABLE**