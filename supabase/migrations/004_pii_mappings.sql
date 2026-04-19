-- Migration 004: PII mapping storage
-- Supports ROADMAP Phase 8 — per-report token mapping for de-identified entities.
-- The real PII value stays server-side; only tokens are sent to third-party AI.
-- Review and apply via `supabase db push` or Supabase Studio SQL editor.

CREATE TABLE IF NOT EXISTS pii_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  file_upload_id UUID REFERENCES file_uploads(id) ON DELETE SET NULL,

  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'STUDENT', 'PARENT_GUARDIAN', 'TEACHER', 'SCHOOL',
    'DOB', 'DATE', 'ADDRESS', 'PHONE', 'EMAIL',
    'MRN', 'SSN', 'OTHER'
  )),

  -- The real value, stored server-side only. Never sent to AI.
  detected_value TEXT NOT NULL,
  -- Stable token the AI sees (e.g. "[STUDENT_001]")
  token TEXT NOT NULL,

  action TEXT NOT NULL DEFAULT 'replace' CHECK (action IN (
    'replace', 'semantic', 'remove'
  )),

  source_file  TEXT,
  source_page  TEXT,
  confidence   REAL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  is_excluded  BOOLEAN NOT NULL DEFAULT FALSE,
  is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  needs_review BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (report_id, detected_value, entity_type)
);

CREATE INDEX IF NOT EXISTS idx_pii_mappings_report ON pii_mappings (report_id);
CREATE INDEX IF NOT EXISTS idx_pii_mappings_token  ON pii_mappings (report_id, token);

ALTER TABLE pii_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can manage their own pii mappings"
  ON pii_mappings FOR ALL
  USING (report_id IN (SELECT id FROM reports WHERE user_id = auth.uid()))
  WITH CHECK (report_id IN (SELECT id FROM reports WHERE user_id = auth.uid()));
