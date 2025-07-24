-- Add metadata column to reports table for storing additional structured data
ALTER TABLE public.reports 
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for metadata queries
CREATE INDEX idx_reports_metadata ON public.reports USING GIN (metadata);

-- Add comment to document the metadata structure
COMMENT ON COLUMN public.reports.metadata IS 'Stores additional structured metadata including student bio information';