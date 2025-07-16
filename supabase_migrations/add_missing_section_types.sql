-- Add missing section types that are in DEFAULT_SECTIONS but not in database
INSERT INTO public.report_section_types (id, name, default_title, description, ai_directive)
VALUES
    ('00000000-0000-0000-0000-000000000013', 'heading', 'Header', 'Report header with student information and evaluation details.', 'Generate a professional heading for a speech and language evaluation report including the student''s name, evaluation date, evaluator name and credentials, and school name.')
ON CONFLICT (id) DO NOTHING;

-- Update existing entries to add ai_directive if missing
UPDATE public.report_section_types 
SET ai_directive = CASE 
    WHEN name = 'reason_for_referral' THEN 'Generate a concise reason for referral paragraph explaining who referred the student, what concerns prompted the referral, and the purpose of the evaluation.'
    WHEN name = 'parent_concern' THEN 'Generate a detailed description of parent/guardian concerns about the student''s communication abilities.'
    WHEN name = 'health_developmental_history' THEN 'Generate a comprehensive health and developmental history section that summarizes relevant medical conditions, developmental milestones, and previous diagnoses that may impact speech and language development.'
    WHEN name = 'family_background' THEN 'Generate a family background section describing the home environment and any relevant family history of communication disorders.'
    WHEN name = 'assessment_tools' THEN 'Generate a comprehensive list of standardized and non-standardized assessment tools used in the evaluation.'
    WHEN name = 'assessment_results' THEN 'Generate detailed assessment results with scores, percentiles, and clinical interpretations.'
    WHEN name = 'language_sample' THEN 'Generate analysis of spontaneous language sample including MLU, complexity, and pragmatic observations.'
    WHEN name = 'validity_statement' THEN 'Generate a statement regarding the validity and reliability of assessment results.'
    WHEN name = 'eligibility_checklist' THEN 'Generate eligibility determination based on assessment results and criteria.'
    WHEN name = 'conclusion' THEN 'Generate a comprehensive conclusion summarizing findings and diagnostic impressions.'
    WHEN name = 'recommendations' THEN 'Generate specific, actionable recommendations for intervention and support.'
    WHEN name = 'accommodations' THEN 'Generate appropriate accommodations and modifications for educational settings.'
    ELSE ai_directive
END
WHERE ai_directive IS NULL OR ai_directive = '';