CREATE TABLE public.report_section_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    default_title TEXT NOT NULL,
    description TEXT
);

ALTER TABLE public.report_section_types ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read this table (as it's a master list of available types)
CREATE POLICY "Enable read access for all authenticated users" ON public.report_section_types
  FOR SELECT USING (auth.role() = 'authenticated');

-- Optionally, if only admins should manage these types, you can restrict INSERT/UPDATE/DELETE policies.
-- For now, we'll assume these are managed by the system or an admin.
