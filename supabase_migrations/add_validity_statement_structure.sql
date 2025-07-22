-- Add structured validity statement data column to report_section_types
ALTER TABLE public.report_section_types 
ADD COLUMN IF NOT EXISTS structured_data_schema JSONB;

-- Update the validity_statement section type with the new schema
UPDATE public.report_section_types 
SET structured_data_schema = '{
  "validity_statement": {
    "is_valid": true,
    "custom_text": "",
    "student_behavior": {
      "cooperative": true,
      "custom_text": ""
    },
    "validity_factors": {
      "attention": false,
      "motivation": false,
      "cultural_linguistic": false,
      "other": ""
    }
  }
}'::jsonb
WHERE name = 'validity_statement';

-- Also add a structured_data column to reports table to store instance data
-- First check if the column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' 
                   AND column_name = 'structured_section_data') THEN
        ALTER TABLE public.reports ADD COLUMN structured_section_data JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;