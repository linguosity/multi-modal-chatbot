# Supabase migrations — apply order + rollback

Four migration files live in `supabase/migrations/`. They must be applied in
numeric order. All four are idempotent (`IF NOT EXISTS`) and non-destructive
on existing data.

| # | File | Adds | Required by |
|---|------|------|-------------|
| 001 | `001_clean_schema.sql` | Baseline schema (reports, report_sections, profiles, file_uploads, etc.) | Everything |
| 002 | `002_evidence_triage.sql` | Triage classification columns on `file_uploads` | `/dashboard/reports/[id]/triage` |
| 003 | `003_evidence_scores.sql` | New `evidence_scores` table (V/R/R rubric) | `/dashboard/reports/[id]/convergence` |
| 004 | `004_pii_mappings.sql` | New `pii_mappings` table (server-side PII dictionary) | `process-intake` PII redactor, `/dashboard/reports/[id]/pii` |

## Apply — recommended path

From the project root, with the Supabase CLI linked to your project:

```bash
supabase db push
```

This runs every unapplied migration in order. CI/CD should use the same command.

## Apply — manual / Studio path

If you want to apply one at a time (recommended first time so you can inspect
the schema changes):

1. Open Supabase Studio → SQL Editor
2. Paste the contents of `supabase/migrations/00N_*.sql`
3. Run
4. Verify in the Table Editor that the expected columns / tables appeared
5. Repeat for the next migration

## Verify after applying

```sql
-- Triage columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'file_uploads'
  AND column_name IN ('suggested_section_id', 'confirmed_section_id', 'evidence_method',
                      'clinical_direction', 'classification_confidence', 'triage_state',
                      'confirmed_at');
-- Expect 7 rows.

-- Evidence scores
SELECT count(*) FROM evidence_scores; -- 0 OK

-- PII mappings
SELECT count(*) FROM pii_mappings; -- 0 OK
```

## Rollback

Supabase `db push` does not generate automatic rollback. Manual rollback SQL:

```sql
-- 004
DROP TABLE IF EXISTS pii_mappings;

-- 003
DROP TABLE IF EXISTS evidence_scores;

-- 002
ALTER TABLE file_uploads
  DROP COLUMN IF EXISTS suggested_section_id,
  DROP COLUMN IF EXISTS confirmed_section_id,
  DROP COLUMN IF EXISTS evidence_method,
  DROP COLUMN IF EXISTS clinical_direction,
  DROP COLUMN IF EXISTS classification_confidence,
  DROP COLUMN IF EXISTS triage_state,
  DROP COLUMN IF EXISTS confirmed_at;
DROP INDEX IF EXISTS idx_file_uploads_report_triage;
```

Migration 001 is the baseline — don't roll back.

## Graceful degradation

Code that reads these tables checks for their existence and falls back:

- **`process-intake`**: PII detection still runs (redactor is in memory); if
  `pii_mappings` is missing, a warning logs but the request completes.
- **`/pii` page**: currently shows demo entities when no real mappings exist.
  After wiring reads, missing table = empty state, not error.
- **`/triage` page**: reads from `report.metadata.uploadedFiles` regardless;
  triage state is in-memory until migration 002 + a persistence endpoint land.
- **`/convergence` page**: uses hardcoded 12-item mock until `evidence_scores`
  is populated by the scorer.

So: **apply migrations at your leisure**. The app degrades cleanly.

## Next steps after migrations land

- Wire `/api/reports/[id]/triage` GET + PATCH (persist row state)
- Wire `/api/reports/[id]/pii` GET (read mappings) so the page stops showing demo data
- Wire `/api/reports/[id]/evidence-scores` for real convergence data
- Extend process-intake to score evidence automatically
