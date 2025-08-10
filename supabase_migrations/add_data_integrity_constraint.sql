-- Add constraint to prevent structured_data nesting (Russian-doll issue)
-- This constraint ensures that structured_data cannot contain a nested structured_data key

ALTER TABLE report_sections 
ADD CONSTRAINT no_structured_data_nesting 
CHECK (
  structured_data IS NULL OR 
  jsonb_typeof(structured_data -> 'structured_data') IS NULL
);

-- Add index to help identify corrupted data
CREATE INDEX IF NOT EXISTS idx_report_sections_corrupted_data 
ON report_sections 
USING gin (structured_data) 
WHERE structured_data ? 'structured_data';

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT no_structured_data_nesting ON report_sections IS 
'Prevents Russian-doll structured_data nesting that causes infinite loops and data corruption';