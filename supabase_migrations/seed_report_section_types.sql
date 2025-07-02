INSERT INTO public.report_section_types (id, name, default_title, description)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'reason_for_referral', 'Reason for Referral', 'Describes why the student was referred for evaluation.'),
    ('00000000-0000-0000-0000-000000000002', 'parent_concern', 'Parent Concern', 'Details the concerns expressed by parents/guardians.'),
    ('00000000-0000-0000-0000-000000000003', 'health_developmental_history', 'Health & Developmental History', 'Relevant medical and developmental background.'),
    ('00000000-0000-0000-0000-000000000004', 'family_background', 'Family Background', 'Information about the student's family and home environment.'),
    ('00000000-0000-0000-0000-000000000005', 'assessment_tools', 'Assessment Tools', 'Lists the standardized and non-standardized assessments used.'),
    ('00000000-0000-0000-0000-000000000006', 'assessment_results', 'Assessment Results', 'Presents the findings from the assessments.'),
    ('00000000-0000-0000-0000-000000000007', 'language_sample', 'Language Sample Analysis', 'Analysis of a spontaneous language sample.'),
    ('00000000-0000-0000-0000-000000000008', 'validity_statement', 'Validity Statement', 'Statement regarding the validity of assessment results.'),
    ('00000000-0000-0000-0000-000000000009', 'eligibility_checklist', 'Eligibility Checklist', 'Checklist for determining eligibility for services.'),
    ('00000000-0000-0000-0000-000000000010', 'conclusion', 'Conclusion', 'Summary of findings and diagnosis.'),
    ('00000000-0000-0000-0000-000000000011', 'recommendations', 'Recommendations', 'Suggestions for intervention and support.'),
    ('00000000-0000-0000-0000-000000000012', 'accommodations', 'Accommodations', 'Recommended accommodations for the student.')
ON CONFLICT (id) DO NOTHING;