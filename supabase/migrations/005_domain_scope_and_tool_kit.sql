-- Migration 005: domain scope + user tool kit
--
-- Adds the schema for the onboarding-driven preferences:
--   1. profiles.default_domains — ASHA leaves the clinician typically
--      assesses; populated during onboarding step 1; serves as the default
--      for new reports' target_domains.
--   2. reports.target_domains — per-report ASHA-leaf scope; copy-on-create
--      from profiles.default_domains, editable per report. Drives matrix
--      rows, per-domain card visibility, and the tool-catalog filter inside
--      assessment_tools.
--   3. user_tool_kit — clinician-curated subset of the global tool catalog
--      (src/lib/tool-library.ts). Each row references a catalog tool_id and
--      may carry per-user overrides for title / purpose / domains_assessed.
--      Populated during onboarding step 2 and via the inline "Add to my kit"
--      gesture on tool cards.
--
-- All three are addressable per-user — RLS enforces ownership via auth.uid().
-- Review and apply via `supabase db push` or the Supabase Studio SQL editor.

-- ─── 1. profiles.default_domains ─────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS default_domains JSONB
    NOT NULL DEFAULT '[]'::JSONB;

COMMENT ON COLUMN profiles.default_domains IS
  'JSON array of ASHA-canonical domain leaf names (see src/lib/asha-scope.ts ASHA_LEAVES). Populated during onboarding step 1. Used as the default for new reports.target_domains. Empty array means the user has not completed onboarding step 1; the empty-state behavior in the UI ships the school_based_pediatric preset.';

-- ─── 2. reports.target_domains ───────────────────────────────────────────

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS target_domains JSONB
    NOT NULL DEFAULT '[]'::JSONB;

COMMENT ON COLUMN reports.target_domains IS
  'JSON array of ASHA-canonical domain leaf names scoped to this report. Copy-on-create from profiles.default_domains; editable per report via the new-report substep, the assessment_results sidebar, or the inline "+ Add domain" affordance. Drives matrix rows, per-domain card visibility, and tool-catalog filtering inside the report.';

-- ─── 3. user_tool_kit ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_tool_kit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- References a slug in src/lib/tool-library.ts TOOL_LIBRARY_SEED.id.
  -- Not a foreign key — the catalog is code-resident, not a DB table — so
  -- a unique (user_id, tool_id) pair is enforced via constraint instead.
  tool_id TEXT NOT NULL,

  -- Optional per-user overrides. NULL means "use the catalog default".
  -- Populating any of these is a deliberate clinician edit; the catalog
  -- entry stays untouched.
  title_override        TEXT,
  purpose_override      TEXT,
  domains_override      JSONB,  -- ASHA leaves; same enum as default_domains

  -- Provenance: how did this tool land in the kit?
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN (
    'onboarding',  -- selected during onboarding step 2
    'manual',      -- added via "Find tool" search post-onboarding
    'auto_from_intake'  -- auto-added the first time an intake mentioned the tool
  )),

  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,  -- soft-delete: kept for history, hidden from picker

  UNIQUE (user_id, tool_id)
);

CREATE INDEX IF NOT EXISTS user_tool_kit_user_id_idx ON user_tool_kit (user_id);
CREATE INDEX IF NOT EXISTS user_tool_kit_active_idx
  ON user_tool_kit (user_id) WHERE archived_at IS NULL;

COMMENT ON TABLE user_tool_kit IS
  'Per-clinician subset of the global tool catalog (src/lib/tool-library.ts). Used by report-context-builder.ts to inject preferred-tool ids into the AI prompt so Claude reuses canonical ids/titles when matching evidence.';

-- ─── RLS ─────────────────────────────────────────────────────────────────

ALTER TABLE user_tool_kit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_tool_kit_select_own"
  ON user_tool_kit FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_tool_kit_insert_own"
  ON user_tool_kit FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_tool_kit_update_own"
  ON user_tool_kit FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_tool_kit_delete_own"
  ON user_tool_kit FOR DELETE
  USING (auth.uid() = user_id);
