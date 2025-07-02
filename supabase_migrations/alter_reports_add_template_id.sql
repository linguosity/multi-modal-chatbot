ALTER TABLE public.reports
ADD COLUMN template_id UUID REFERENCES public.report_templates(id) ON DELETE SET NULL;