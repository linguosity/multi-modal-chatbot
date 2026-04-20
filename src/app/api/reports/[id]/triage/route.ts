import { createRouteSupabase } from '@/lib/supabase/route-handler-client'
import { safeJsonResponse } from '@/lib/api/safe-json'

/**
 * Triage persistence for uploaded evidence files.
 *
 * Depends on migration `002_evidence_triage.sql`, which adds the following
 * columns to `file_uploads`:
 *   - suggested_section_id, confirmed_section_id
 *   - evidence_method, clinical_direction
 *   - classification_confidence, triage_state, confirmed_at
 *
 * Graceful degradation: if migration 002 hasn't been applied yet, GET returns
 * the base columns without the triage fields, and PATCH returns 503 with a
 * pointer to `supabase/MIGRATIONS.md`.
 */

const TRIAGE_COLUMNS = [
  'id',
  'filename',
  'file_type',
  'suggested_section_id',
  'confirmed_section_id',
  'evidence_method',
  'clinical_direction',
  'classification_confidence',
  'triage_state',
].join(', ')

const BASE_COLUMNS = ['id', 'filename', 'file_type'].join(', ')

// Postgres error code for "undefined column" - used to detect missing migration.
const UNDEFINED_COLUMN_CODE = '42703'

type UpdatePayload = {
  fileId: string
  confirmed_section_id?: string | null
  evidence_method?: string | null
  clinical_direction?: string | null
  triage_state?: 'pending' | 'confirmed' | 'needs-review'
}

function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  if (error.code === UNDEFINED_COLUMN_CODE) return true
  const msg = (error.message || '').toLowerCase()
  return msg.includes('does not exist') && msg.includes('column')
}

/**
 * GET /api/reports/[id]/triage
 * Returns triage rows for this report, scoped to the authed user via RLS.
 * Response shape: { rows: Array<TriageRow>, degraded: boolean }
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: reportId } = await params
  const supabase = await createRouteSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return safeJsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the report belongs to the user.
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .single()

  if (reportError || !report) {
    return safeJsonResponse({ error: 'Report not found' }, { status: 404 })
  }

  // Try the full triage projection first.
  const { data: rows, error } = await supabase
    .from('file_uploads')
    .select(TRIAGE_COLUMNS)
    .eq('report_id', reportId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (!error) {
    return safeJsonResponse({ rows: rows ?? [], degraded: false })
  }

  // Fall back to the base projection if triage columns don't exist yet.
  if (isMissingColumnError(error)) {
    const { data: baseRows, error: baseError } = await supabase
      .from('file_uploads')
      .select(BASE_COLUMNS)
      .eq('report_id', reportId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (baseError) {
      console.error('Error fetching triage base rows:', baseError)
      return safeJsonResponse({ error: 'Failed to fetch triage rows' }, { status: 500 })
    }

    return safeJsonResponse({ rows: baseRows ?? [], degraded: true })
  }

  console.error('Error fetching triage rows:', error)
  return safeJsonResponse({ error: 'Failed to fetch triage rows' }, { status: 500 })
}

/**
 * PATCH /api/reports/[id]/triage
 * Body: { updates: Array<{ fileId, confirmed_section_id?, evidence_method?,
 *                          clinical_direction?, triage_state? }> }
 * Returns: { updated: number }
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: reportId } = await params
  const supabase = await createRouteSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return safeJsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the report belongs to the user.
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .single()

  if (reportError || !report) {
    return safeJsonResponse({ error: 'Report not found' }, { status: 404 })
  }

  let body: { updates?: UpdatePayload[] }
  try {
    body = await request.json()
  } catch {
    return safeJsonResponse({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const updates = Array.isArray(body?.updates) ? body.updates : []
  if (updates.length === 0) {
    return safeJsonResponse({ updated: 0 })
  }

  let updated = 0
  let sawMissingColumn = false

  for (const u of updates) {
    if (!u || typeof u.fileId !== 'string') continue

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (Object.prototype.hasOwnProperty.call(u, 'confirmed_section_id')) {
      patch.confirmed_section_id = u.confirmed_section_id ?? null
    }
    if (Object.prototype.hasOwnProperty.call(u, 'evidence_method')) {
      patch.evidence_method = u.evidence_method ?? null
    }
    if (Object.prototype.hasOwnProperty.call(u, 'clinical_direction')) {
      patch.clinical_direction = u.clinical_direction ?? null
    }
    if (Object.prototype.hasOwnProperty.call(u, 'triage_state')) {
      patch.triage_state = u.triage_state
      patch.confirmed_at = u.triage_state === 'confirmed' ? new Date().toISOString() : null
    }

    // Nothing beyond updated_at means the caller sent no triage fields.
    if (Object.keys(patch).length <= 1) continue

    const { error, count } = await supabase
      .from('file_uploads')
      .update(patch, { count: 'exact' })
      .eq('id', u.fileId)
      .eq('report_id', reportId)
      .eq('user_id', user.id)

    if (error) {
      if (isMissingColumnError(error)) {
        sawMissingColumn = true
        break
      }
      console.error('Error applying triage update:', error)
      return safeJsonResponse({ error: 'Failed to apply triage update' }, { status: 500 })
    }

    updated += count ?? 0
  }

  if (sawMissingColumn) {
    return safeJsonResponse(
      {
        error: 'Triage columns are missing on file_uploads. Apply migration 002_evidence_triage.sql — see supabase/MIGRATIONS.md.',
        code: 'MIGRATION_REQUIRED',
      },
      { status: 503 },
    )
  }

  return safeJsonResponse({ updated })
}
