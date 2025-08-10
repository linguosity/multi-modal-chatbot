-- Add field change tracking support to reports table
-- This migration adds change tracking metadata to support the structured AI processing feature

-- Add change tracking metadata column to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS change_tracking_metadata JSONB DEFAULT '{}';

-- Create index for efficient querying of change tracking data
CREATE INDEX IF NOT EXISTS idx_reports_change_tracking 
ON reports USING GIN (change_tracking_metadata);

-- Add comment explaining the structure
COMMENT ON COLUMN reports.change_tracking_metadata IS 
'Stores field-level change tracking data including change history, acknowledgments, and metadata. Structure: {
  "field_changes": [
    {
      "id": "change_id",
      "section_id": "section_id", 
      "field_path": "dot.notation.path",
      "previous_value": any,
      "new_value": any,
      "change_type": "ai_update|user_edit|merge|validation_fix",
      "confidence": 0.0-1.0,
      "source_reference": "string",
      "timestamp": "ISO_string",
      "acknowledged": boolean,
      "user_id": "user_id",
      "metadata": {}
    }
  ],
  "last_ai_update": "ISO_string",
  "validation_status": "valid|invalid|warning",
  "validation_errors": ["error1", "error2"]
}';

-- Create a function to validate change tracking metadata structure
CREATE OR REPLACE FUNCTION validate_change_tracking_metadata(metadata JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if metadata is an object
  IF jsonb_typeof(metadata) != 'object' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if field_changes is an array (if present)
  IF metadata ? 'field_changes' AND jsonb_typeof(metadata->'field_changes') != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if validation_status has valid values (if present)
  IF metadata ? 'validation_status' AND 
     NOT (metadata->>'validation_status' IN ('valid', 'invalid', 'warning')) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if validation_errors is an array (if present)
  IF metadata ? 'validation_errors' AND jsonb_typeof(metadata->'validation_errors') != 'array' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to validate change tracking metadata structure
ALTER TABLE reports 
ADD CONSTRAINT check_change_tracking_metadata_structure 
CHECK (validate_change_tracking_metadata(change_tracking_metadata));

-- Create a function to get unacknowledged changes for a report
CREATE OR REPLACE FUNCTION get_unacknowledged_changes(report_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(
    jsonb_agg(change)
    FILTER (WHERE (change->>'acknowledged')::boolean = false),
    '[]'::jsonb
  )
  INTO result
  FROM reports r,
       jsonb_array_elements(r.change_tracking_metadata->'field_changes') AS change
  WHERE r.id = report_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to acknowledge changes
CREATE OR REPLACE FUNCTION acknowledge_changes(report_id UUID, change_ids TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  updated_metadata JSONB;
  change_elem JSONB;
  updated_changes JSONB := '[]'::jsonb;
BEGIN
  -- Get current metadata
  SELECT change_tracking_metadata INTO updated_metadata
  FROM reports WHERE id = report_id;
  
  -- If no metadata exists, return false
  IF updated_metadata IS NULL OR NOT (updated_metadata ? 'field_changes') THEN
    RETURN FALSE;
  END IF;
  
  -- Update acknowledgment status for specified changes
  FOR change_elem IN SELECT * FROM jsonb_array_elements(updated_metadata->'field_changes')
  LOOP
    IF (change_elem->>'id') = ANY(change_ids) THEN
      change_elem := jsonb_set(change_elem, '{acknowledged}', 'true'::jsonb);
    END IF;
    updated_changes := updated_changes || change_elem;
  END LOOP;
  
  -- Update the metadata
  updated_metadata := jsonb_set(updated_metadata, '{field_changes}', updated_changes);
  
  -- Save back to database
  UPDATE reports 
  SET change_tracking_metadata = updated_metadata
  WHERE id = report_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a function to add a new field change
CREATE OR REPLACE FUNCTION add_field_change(
  report_id UUID,
  section_id TEXT,
  field_path TEXT,
  previous_value JSONB,
  new_value JSONB,
  change_type TEXT,
  confidence NUMERIC DEFAULT NULL,
  source_reference TEXT DEFAULT NULL,
  user_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  change_id TEXT;
  new_change JSONB;
  updated_metadata JSONB;
BEGIN
  -- Generate unique change ID
  change_id := 'change_' || extract(epoch from now())::bigint || '_' || 
               substr(md5(random()::text), 1, 9);
  
  -- Create new change object
  new_change := jsonb_build_object(
    'id', change_id,
    'section_id', section_id,
    'field_path', field_path,
    'previous_value', previous_value,
    'new_value', new_value,
    'change_type', change_type,
    'confidence', confidence,
    'source_reference', source_reference,
    'timestamp', to_jsonb(now()),
    'acknowledged', false,
    'user_id', user_id
  );
  
  -- Get current metadata or initialize empty
  SELECT COALESCE(change_tracking_metadata, '{}'::jsonb) INTO updated_metadata
  FROM reports WHERE id = report_id;
  
  -- Initialize field_changes array if it doesn't exist
  IF NOT (updated_metadata ? 'field_changes') THEN
    updated_metadata := jsonb_set(updated_metadata, '{field_changes}', '[]'::jsonb);
  END IF;
  
  -- Add new change to the array
  updated_metadata := jsonb_set(
    updated_metadata, 
    '{field_changes}', 
    (updated_metadata->'field_changes') || new_change
  );
  
  -- Update last_ai_update timestamp if this is an AI update
  IF change_type = 'ai_update' THEN
    updated_metadata := jsonb_set(updated_metadata, '{last_ai_update}', to_jsonb(now()));
  END IF;
  
  -- Save to database
  UPDATE reports 
  SET change_tracking_metadata = updated_metadata
  WHERE id = report_id;
  
  RETURN change_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_reports_change_tracking_last_update 
ON reports ((change_tracking_metadata->>'last_ai_update'));

CREATE INDEX IF NOT EXISTS idx_reports_change_tracking_validation_status 
ON reports ((change_tracking_metadata->>'validation_status'));

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_change_tracking_metadata(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unacknowledged_changes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION acknowledge_changes(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION add_field_change(UUID, TEXT, TEXT, JSONB, JSONB, TEXT, NUMERIC, TEXT, UUID) TO authenticated;