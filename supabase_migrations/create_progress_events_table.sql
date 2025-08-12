-- Create a durable progress_events table for AI intake and related operations
CREATE TABLE IF NOT EXISTS public.progress_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  section_id UUID NULL,
  operation_id TEXT NULL,
  event_type TEXT NULL,
  stage TEXT NULL,
  message TEXT NULL,
  data JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.progress_events ENABLE ROW LEVEL SECURITY;

-- RLS: users can see/insert events for reports they own
CREATE POLICY IF NOT EXISTS "Users can view their own progress events" ON public.progress_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = progress_events.report_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can insert progress events for their reports" ON public.progress_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id AND r.user_id = auth.uid()
    )
  );

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_progress_events_report_id ON public.progress_events(report_id);
CREATE INDEX IF NOT EXISTS idx_progress_events_operation_id ON public.progress_events(operation_id);
CREATE INDEX IF NOT EXISTS idx_progress_events_created_at ON public.progress_events(created_at DESC);

