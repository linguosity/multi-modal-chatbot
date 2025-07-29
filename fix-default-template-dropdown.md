# Fix: Default Template Not Showing in Dropdown

## Problem:
User reported seeing only "Template 1, 2, 3, etc." in the dropdown, with no "Default Template" option.

## Root Cause:
There were **two different** new report implementations:

1. ✅ `src/components/NewReportForm.tsx` - Updated with default template (but not used)
2. ❌ `src/app/dashboard/reports/new/page.tsx` - Actually used, but had old logic

## Navigation Flow:
```
Dashboard → "New Report" button → /dashboard/reports → "Create New Report" → /dashboard/reports/new/page.tsx
```

The actual page being used was `/dashboard/reports/new/page.tsx`, not the `NewReportForm` component.

## Solution Applied:

### Updated `/dashboard/reports/new/page.tsx`:

1. **Added Default Template Import**:
```typescript
import { createDefaultTemplate } from '@/lib/structured-schemas'
```

2. **Pre-selected Default Template**:
```typescript
const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>('default');
```

3. **Added Default Option to Dropdown**:
```typescript
<SelectContent>
  <SelectItem value="default">
    Default Template (Current Schemas)
  </SelectItem>
  {templates.map(template => (
    <SelectItem key={template.id} value={template.id || ''}>
      {template.name} (Legacy)
    </SelectItem>
  ))}
</SelectContent>
```

4. **Updated Request Logic**:
```typescript
if (selectedTemplateId === 'default') {
  const defaultTemplate = createDefaultTemplate();
  requestBody = { title, studentId, type, sections: defaultTemplate.sections };
} else {
  requestBody = { title, studentId, type, template_id: selectedTemplateId };
}
```

## Expected Result:
Now when you navigate to create a new report, you should see:
- ✅ "Default Template (Current Schemas)" - pre-selected
- ✅ "Template 1 (Legacy)", "Template 2 (Legacy)", etc.

## Test:
1. Go to Dashboard
2. Click "New Report" 
3. Click "Create New Report"
4. Check template dropdown - should show "Default Template" as first option