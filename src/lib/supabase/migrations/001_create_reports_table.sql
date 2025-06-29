CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id UUID,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'draft' NOT NULL,
  student_id TEXT NOT NULL,
  evaluator_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[],
  finalized_date TIMESTAMP WITH TIME ZONE,
  print_version TEXT,
  related_assessment_ids TEXT[],
  related_eligibility_ids TEXT[]
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports." ON reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports." ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports." ON reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports." ON reports
  FOR DELETE USING (auth.uid() = user_id);
