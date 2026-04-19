-- Migration 003: Evidence scoring + convergence
-- Supports ROADMAP Phase 6 — per-file rubric scores (Validity, Relevance, Reliability)
-- used to compute convergence index across the evidence set.
-- Review and apply via `supabase db push` or Supabase Studio SQL editor.

CREATE TABLE IF NOT EXISTS evidence_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_upload_id UUID REFERENCES file_uploads(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,

  -- Evidence taxonomy
  evidence_type TEXT NOT NULL CHECK (evidence_type IN (
    'dynamic_assessment', 'language_sample', 'parent_report', 'teacher_report',
    'standardized_test', 'screening', 'observation', 'developmental_history', 'other'
  )),
  modality TEXT CHECK (modality IS NULL OR modality IN (
    'receptive', 'expressive', 'mixed', 'pragmatic', 'speech'
  )),
  language_context TEXT CHECK (language_context IS NULL OR language_context IN (
    'L1', 'L2', 'both', 'unknown'
  )),
  setting TEXT CHECK (setting IS NULL OR setting IN (
    'home', 'school', 'clinic', 'other'
  )),

  -- Finding direction for convergence calculation
  finding_direction TEXT NOT NULL DEFAULT 'unclear' CHECK (finding_direction IN (
    'supports_disorder', 'does_not_support', 'mixed', 'unclear'
  )),

  -- VRR rubric — 0–3 each
  validity_score    SMALLINT NOT NULL DEFAULT 2 CHECK (validity_score    BETWEEN 0 AND 3),
  relevance_score   SMALLINT NOT NULL DEFAULT 2 CHECK (relevance_score   BETWEEN 0 AND 3),
  reliability_score SMALLINT NOT NULL DEFAULT 2 CHECK (reliability_score BETWEEN 0 AND 3),

  -- Optional narrative
  source_description TEXT,
  clinical_note      TEXT,

  -- Provenance
  is_ai_scored  BOOLEAN NOT NULL DEFAULT TRUE,
  is_confirmed  BOOLEAN NOT NULL DEFAULT FALSE,
  is_excluded   BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_scores_report    ON evidence_scores (report_id);
CREATE INDEX IF NOT EXISTS idx_evidence_scores_file      ON evidence_scores (file_upload_id);
CREATE INDEX IF NOT EXISTS idx_evidence_scores_included  ON evidence_scores (report_id) WHERE NOT is_excluded;

ALTER TABLE evidence_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can manage their own evidence scores"
  ON evidence_scores FOR ALL
  USING (report_id IN (SELECT id FROM reports WHERE user_id = auth.uid()))
  WITH CHECK (report_id IN (SELECT id FROM reports WHERE user_id = auth.uid()));
