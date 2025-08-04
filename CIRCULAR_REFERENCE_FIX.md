# Circular Reference Fix - API Routes

## 🚨 Issue: Maximum Call Stack Size Exceeded

**Error**: `RangeError: Maximum call stack size exceeded at JSON.stringify`
**Location**: `GET /api/reports` route at line 26
**Root Cause**: Circular references in the reports data structure from Supabase

## 🔍 Analysis

The issue occurred because:
1. Supabase was returning complex nested data with potential circular references
2. `NextResponse.json()` uses `JSON.stringify()` internally
3. Circular references cause infinite recursion in JSON serialization

## ✅ Fixes Applied

### 1. Selective Data Fetching
```typescript
// Before: Fetching all fields (including complex nested data)
const { data: reports, error } = await supabase
  .from('reports')
  .select('*')
  .eq('user_id', user.id)

// After: Selective field fetching
const { data: reports, error } = await supabase
  .from('reports')
  .select('id, title, type, status, student_id, created_at, updated_at, template_id')
  .eq('user_id', user.id)
  .order('updated_at', { ascending: false })
```

### 2. Data Cleaning
```typescript
// Clean data structure to prevent circular references
const cleanReports = reports?.map(report => ({
  id: report.id,
  title: report.title,
  type: report.type,
  status: report.status,
  studentId: report.student_id,
  createdAt: report.created_at,
  updatedAt: report.updated_at,
  templateId: report.template_id
})) || []
```

### 3. Safe JSON Response Utility
Created `src/lib/api/safe-json.ts` with:
- `safeStringify()` - Handles circular references gracefully
- `safeJsonResponse()` - Safe NextResponse wrapper
- `removeCircularReferences()` - Utility to clean objects

### 4. Updated All API Responses
```typescript
// Before: Direct JSON response
return NextResponse.json(data)

// After: Safe JSON response
return safeJsonResponse(data)
```

## 🛡️ Prevention Measures

### 1. Base API Handler Enhancement
Updated `createApiResponse()` to use `safeJsonResponse()` by default:
```typescript
export function createApiResponse<T>(data?: T, message?: string, status = 200) {
  return safeJsonResponse({
    success: status < 400,
    data,
    message,
    ...(status >= 400 && { error: message })
  }, { status })
}
```

### 2. Selective Data Fetching Strategy
- Only fetch required fields from database
- Transform complex objects to simple structures
- Avoid returning raw Supabase objects

### 3. Response Data Validation
- Clean data structures before serialization
- Remove unnecessary nested objects
- Ensure consistent response formats

## 📊 Impact Assessment

### Before Fix:
- ❌ API routes crashing with stack overflow
- ❌ Frontend unable to load reports
- ❌ Poor error handling for circular references

### After Fix:
- ✅ Stable API responses
- ✅ Clean, predictable data structures
- ✅ Graceful handling of complex objects
- ✅ Better performance with selective queries

## 🔧 Files Modified

1. **`src/app/api/reports/route.ts`**
   - Updated GET method with selective querying
   - Added data cleaning for responses
   - Replaced all JSON responses with safe versions

2. **`src/lib/api/safe-json.ts`** (NEW)
   - Safe JSON serialization utilities
   - Circular reference detection and handling
   - Fallback mechanisms for complex objects

3. **`src/lib/api/base-handler.ts`**
   - Updated `createApiResponse()` to use safe JSON
   - Enhanced error handling for serialization issues

## 🧪 Testing Results

### Manual Testing:
- ✅ GET `/api/reports` returns clean data
- ✅ POST `/api/reports` creates reports successfully
- ✅ No more stack overflow errors
- ✅ Frontend loads reports correctly

### Edge Cases:
- ✅ Empty reports array handled correctly
- ✅ Complex nested data structures cleaned
- ✅ Error responses serialized safely

## 🚀 Status: RESOLVED

The circular reference issue has been completely resolved. All API routes now use safe JSON serialization and return clean, predictable data structures.

**Next Steps**: Monitor for any other potential circular reference issues in remaining API routes and apply similar fixes proactively.