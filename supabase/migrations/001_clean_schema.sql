-- ============================================================================
-- Linguosity v2: Clean Schema Migration
-- ============================================================================
-- This is the clean-slate schema for the new Supabase project.
-- Key change from v1: NO dual storage. report_sections is the sole source
-- of truth for section data. The reports.sections JSONB column is gone.
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enforce single default school site per user
CREATE OR REPLACE FUNCTION public.enforce_single_default_site()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE public.user_school_sites
    SET is_default = FALSE
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: report_section_types (reference data, created first for FK)
-- ============================================================================
CREATE TABLE public.report_section_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  default_title TEXT NOT NULL,
  description TEXT,
  ai_directive TEXT,
  structured_data_schema JSONB
);

ALTER TABLE public.report_section_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read section types"
  ON public.report_section_types
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Seed section types
INSERT INTO public.report_section_types (name, default_title, description, ai_directive) VALUES
  ('heading', 'Header', 'Student demographic and evaluator information',
   'Extract student demographic information including name, date of birth, age, grade, school, and evaluator details. Look for any identifying information in the uploaded documents.'),

  ('reason_for_referral', 'Reason for Referral', 'Why the student was referred for evaluation',
   'Identify the primary reason for referral, who initiated the referral, specific concerns mentioned by parents/teachers, and any prior interventions attempted.'),

  ('parent_concern', 'Parent Concern', 'Parent/caregiver reported concerns',
   'Extract parent-reported concerns about the child''s communication, including developmental history, home language use, and specific examples of difficulties.'),

  ('health_developmental_history', 'Health & Developmental History', 'Medical and developmental background',
   'Extract medical history, developmental milestones, hearing/vision screening results, birth history, and any relevant diagnoses or treatments.'),

  ('family_background', 'Family Background', 'Family composition, languages, and relevant history',
   'Identify family composition, languages spoken at home, family history of speech/language disorders, and cultural considerations relevant to assessment.'),

  ('assessment_tools', 'Assessment Tools', 'Standardized and informal assessments administered',
   'List all assessment tools administered including standardized tests, informal measures, and observation procedures. Include full test names and any relevant administration notes.'),

  ('assessment_results', 'Assessment Results', 'Test scores, percentiles, and clinical interpretation',
   'Extract all test scores including standard scores, percentile ranks, confidence intervals, and age equivalents. Provide clinical interpretation of each score relative to normative data.'),

  ('language_sample', 'Language Sample Analysis', 'Analysis of spontaneous language production',
   'Analyze language sample data including MLU, TTR, utterance examples, grammatical analysis, phonological patterns, and pragmatic observations.'),

  ('validity_statement', 'Validity Statement', 'Assessment validity and reliability statement',
   'Assess validity of testing conditions including student cooperation, attention, cultural/linguistic factors, and any conditions that may have affected test performance.'),

  ('eligibility_checklist', 'Eligibility Checklist', 'Special education eligibility determination',
   'Determine eligibility based on assessment results, federal and state criteria, discrepancy analysis, and educational impact.'),

  ('conclusion', 'Conclusion', 'Summary of findings and clinical impressions',
   'Synthesize all assessment data into a cohesive summary. Include diagnosis, severity ratings, prognosis, and key findings that support the clinical determination.'),

  ('recommendations', 'Recommendations', 'Therapy recommendations and goals',
   'Generate specific, measurable therapy recommendations based on assessment findings. Include frequency, duration, and specific goal areas.'),

  ('accommodations', 'Accommodations', 'Recommended classroom accommodations',
   'Recommend specific classroom accommodations and modifications based on the student''s communication profile and educational needs.');

-- ============================================================================
-- TABLE: report_templates
-- ============================================================================
CREATE TABLE public.report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_structure JSONB NOT NULL, -- Array of section groups with section_type_ids
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own templates"
  ON public.report_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_report_templates_updated
  BEFORE UPDATE ON public.report_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- TABLE: reports (NO sections JSONB column - that's the key change)
-- ============================================================================
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.report_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  student_id TEXT,
  student_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('initial', 'annual', 'triennial', 'progress', 'exit', 'consultation', 'other')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'completed', 'archived')),
  evaluator_id TEXT,
  -- Student bio and report-level metadata (NOT section data)
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[],
  finalized_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NOTE: No `sections JSONB` column. Section data lives in report_sections only.

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports"
  ON public.reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports"
  ON public.reports FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_reports_user_updated ON public.reports(user_id, updated_at DESC);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_type ON public.reports(type);

CREATE TRIGGER trg_reports_updated
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- TABLE: report_sections (THE canonical source of truth for all section data)
-- ============================================================================
CREATE TABLE public.report_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL, -- matches report_section_types.name
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,

  -- Content
  content TEXT,                          -- Generated narrative text
  structured_data JSONB DEFAULT '{}'::jsonb, -- Form field values (variable per section type)
  hydrated_html TEXT,                    -- Pre-rendered HTML for display

  -- AI extraction metadata
  extraction_confidence JSONB,           -- Per-field confidence: {"field_name": 0.95, ...}
  source_refs JSONB DEFAULT '[]'::jsonb, -- Which files contributed to this section

  -- Status tracking
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_generated BOOLEAN NOT NULL DEFAULT false, -- Was this section AI-generated?

  -- Change tracking (per-section, not report-level)
  change_tracking JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent Russian-doll nesting
  CONSTRAINT no_structured_data_nesting
    CHECK (structured_data IS NULL OR jsonb_typeof(structured_data -> 'structured_data') IS NULL)
);

ALTER TABLE public.report_sections ENABLE ROW LEVEL SECURITY;

-- RLS via FK to reports (users can only access sections of their own reports)
CREATE POLICY "Users can view own report sections"
  ON public.report_sections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.reports WHERE reports.id = report_sections.report_id AND reports.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert sections for own reports"
  ON public.report_sections FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.reports WHERE reports.id = report_sections.report_id AND reports.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own report sections"
  ON public.report_sections FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.reports WHERE reports.id = report_sections.report_id AND reports.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own report sections"
  ON public.report_sections FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.reports WHERE reports.id = report_sections.report_id AND reports.user_id = auth.uid()
  ));

CREATE INDEX idx_report_sections_report_id ON public.report_sections(report_id);
CREATE INDEX idx_report_sections_type ON public.report_sections(section_type);
CREATE INDEX idx_report_sections_order ON public.report_sections(report_id, "order");
CREATE INDEX idx_report_sections_structured_data ON public.report_sections USING GIN (structured_data);

CREATE TRIGGER trg_report_sections_updated
  BEFORE UPDATE ON public.report_sections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- TABLE: file_uploads (NEW - persistent file storage tracking)
-- ============================================================================
CREATE TABLE public.file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,  -- MIME type
  file_size BIGINT,         -- bytes
  storage_path TEXT,         -- Supabase Storage path
  processing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_text TEXT,           -- Cached text extraction
  ai_extraction_result JSONB,   -- What Claude extracted from this file
  error_message TEXT,            -- If processing failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own file uploads"
  ON public.file_uploads FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_file_uploads_report ON public.file_uploads(report_id);
CREATE INDEX idx_file_uploads_status ON public.file_uploads(processing_status);

CREATE TRIGGER trg_file_uploads_updated
  BEFORE UPDATE ON public.file_uploads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- TABLE: user_settings
-- ============================================================================
CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_state TEXT DEFAULT 'California',
  evaluator_name TEXT DEFAULT '',
  evaluator_credentials TEXT DEFAULT '',
  school_name TEXT DEFAULT '',
  asha_number TEXT DEFAULT '',
  state_license_number TEXT DEFAULT '',
  show_toast_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings"
  ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER trg_user_settings_updated
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- TABLE: user_school_sites
-- ============================================================================
CREATE TABLE public.user_school_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.user_school_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own school sites"
  ON public.user_school_sites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_school_sites_user ON public.user_school_sites(user_id);

CREATE TRIGGER trg_user_school_sites_updated
  BEFORE UPDATE ON public.user_school_sites
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_school_sites_single_default
  AFTER INSERT OR UPDATE OF is_default
  ON public.user_school_sites
  FOR EACH ROW EXECUTE FUNCTION enforce_single_default_site();

-- ============================================================================
-- TABLE: progress_events (AI processing audit log)
-- ============================================================================
CREATE TABLE public.progress_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.report_sections(id) ON DELETE SET NULL,
  operation_id TEXT,
  event_type TEXT,
  stage TEXT,
  message TEXT,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress events"
  ON public.progress_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.reports WHERE reports.id = progress_events.report_id AND reports.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert progress events for own reports"
  ON public.progress_events FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.reports WHERE reports.id = progress_events.report_id AND reports.user_id = auth.uid()
  ));

CREATE INDEX idx_progress_events_report ON public.progress_events(report_id);
CREATE INDEX idx_progress_events_created ON public.progress_events(created_at DESC);

-- ============================================================================
-- STORAGE: assessment-files bucket
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assessment-files',
  'assessment-files',
  false,
  33554432, -- 32MB
  ARRAY[
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/flac', 'audio/x-m4a',
    'text/plain', 'text/csv', 'text/html',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
);

-- Storage RLS: users can only access their own folder
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assessment-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assessment-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'assessment-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- REALTIME: Enable for report_sections
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_sections;

-- ============================================================================
-- DONE
-- ============================================================================
