-- Create the reports table
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    template_id UUID REFERENCES public.report_templates(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    student_id TEXT,
    student_name TEXT,
    type TEXT NOT NULL CHECK (type IN ('initial', 'annual', 'triennial', 'progress', 'exit', 'consultation', 'other')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'completed', 'archived')),
    evaluator_id TEXT,
    sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags TEXT[],
    finalized_date TIMESTAMPTZ,
    print_version TEXT,
    related_assessment_ids TEXT[],
    related_eligibility_ids TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own reports" ON public.reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" ON public.reports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" ON public.reports
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_reports_template_id ON public.reports(template_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_type ON public.reports(type);