CREATE TABLE public.report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    template_structure JSONB NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own report templates." ON public.report_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create report templates." ON public.report_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own report templates." ON public.report_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own report templates." ON public.report_templates
  FOR DELETE USING (auth.uid() = user_id);