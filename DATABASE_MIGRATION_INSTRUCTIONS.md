# Database Migration Instructions

## Issue
The StudentBioCard and other metadata features require a `metadata` column in the `reports` table that doesn't exist yet.

## Error Message
```
Error saving report: Object
code: "PGRST204"
details: null
hint: null
message: "Could not find the 'metadata' column of 'reports' in the schema cache"
```

## Solution
Run the following SQL commands in your Supabase SQL editor or database console:

```sql
-- Add metadata column to reports table for storing additional structured data
ALTER TABLE public.reports 
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for metadata queries
CREATE INDEX idx_reports_metadata ON public.reports USING GIN (metadata);

-- Add comment to document the metadata structure
COMMENT ON COLUMN public.reports.metadata IS 'Stores additional structured metadata including student bio information';
```

## How to Run
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Paste the SQL commands above
4. Click "Run" to execute the migration
5. Refresh your application

## What This Enables
- StudentBioCard will be able to save student information to the database
- Other metadata features will work properly
- Data will persist between sessions

## Temporary Workaround
Until the migration is run, the StudentBioCard will save data to localStorage as a fallback, but this data won't persist across different browsers or devices.