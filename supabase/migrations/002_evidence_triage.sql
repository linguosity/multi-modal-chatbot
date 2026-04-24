-- Migration 002: Evidence triage columns
-- Supports ROADMAP Phase 3 — SLP confirms AI-suggested section / method / direction per uploaded file.
-- Review and apply via `supabase db push` (or copy/paste into Supabase Studio SQL editor).

-- ─── file_uploads ────────────────────────────────────────────────────────────
-- AI-suggested classification the SLP confirms or overrides during triage.

ALTER TABLE file_uploads
  ADD COLUMN IF NOT EXISTS suggested_section_id UUID REFERENCES report_sections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS confirmed_section_id UUID REFERENCES report_sections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS evidence_method TEXT CHECK (evidence_method IS NULL OR evidence_method IN (
    'norm-ref', 'observation', 'interview', 'lang-sample', 'record', 'other'
  )),
  ADD COLUMN IF NOT EXISTS clinical_direction TEXT CHECK (clinical_direction IS NULL OR clinical_direction IN (
    'toward', 'against', 'neutral', 'unknown'
  )),
  ADD COLUMN IF NOT EXISTS classification_confidence REAL CHECK (
    classification_confidence IS NULL OR (classification_confidence >= 0 AND classification_confidence <= 1)
  ),
  ADD COLUMN IF NOT EXISTS triage_state TEXT NOT NULL DEFAULT 'pending' CHECK (triage_state IN (
    'pending', 'confirmed', 'needs-review'
  )),
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Helpful index for triage queries per report
CREATE INDEX IF NOT EXISTS idx_file_uploads_report_triage
  ON file_uploads (report_id, triage_state);
