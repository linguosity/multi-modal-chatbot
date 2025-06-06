# Linguosity Test Routes

With the new structure for user-specific reports, here are some routes to test:

## For Testing Without Real Users

Since the app doesn't have real users yet, we've set up these routes with a temporary "user1" ID:

### Report Pages

1. **Reports List**: 
   - `/dashboard/user1/reports`
   - This shows all reports for "user1"

2. **New Report**:
   - `/dashboard/user1/reports/new`
   - Creates a new report

3. **Edit Existing Report**:
   - `/dashboard/user1/reports/123`
   - Edits a report with ID "123" (this is a mock ID)

### Access Through Redirects

The middleware is set up to handle old URLs, so these will redirect:

1. Old reports page: `/reports` → `/dashboard/user1/reports`
2. Old editor: `/reports/text-editor-test` → `/dashboard/user1/reports/new`

## Checking Report Section Navigation

When viewing a specific report, report sections should appear in the sidebar under "Linguosity Suite".

To check this:
1. Go to `/dashboard/user1/reports/new` or `/dashboard/user1/reports/123`
2. Add some content to the report
3. The sidebar should show report sections (Student Information, Background, etc.)

## Development Tips

- Use `/dashboard/user1/reports/new` during development to test the report editor with a blank report
- Use `/dashboard/user1/reports/123` to test with the mock report data
- Middleware automatically redirects from old `/reports` URLs