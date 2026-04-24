import { createRouteSupabase } from '@/lib/supabase/route-handler-client'
import { safeJsonResponse } from '@/lib/api/safe-json'

/**
 * GET /api/reports/[id]/pii
 * Returns the PII mappings for this report, scoped by RLS to the current user.
 *
 * If the `pii_mappings` table hasn't been created yet (migration 004 not
 * applied), we degrade gracefully: return an empty list with
 * `tableMissing: true` so the UI can show a friendly banner instead of 500'ing.
 *
 * PATCH /api/reports/[id]/pii
 * Body: { updates: Array<{ id, action?, is_excluded?, is_confirmed? }> }
 * Applies per-row updates scoped to this report. Returns { updated: N }.
 */

type AllowedAction = 'replace' | 'semantic' | 'remove'

interface PatchUpdate {
  id: string
  action?: AllowedAction
  is_excluded?: boolean
  is_confirmed?: boolean
}

const TABLE_MISSING_CODES = new Set(['PGRST205', '42P01'])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isTableMissingError(err: any): boolean {
  if (!err) return false
  const code = err.code ?? ''
  const msg = err.message ?? String(err)
  if (TABLE_MISSING_CODES.has(code)) return true
  return /relation.*does not exist|could not find.*table/i.test(msg)
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createRouteSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return safeJsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the report exists and belongs to the user (surfaces a 404 instead
  // of a confusing empty array).
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (reportError || !report) {
    return safeJsonResponse({ error: 'Report not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('pii_mappings')
    .select('id, entity_type, detected_value, token, action, source_file, confidence, needs_review, is_excluded, is_confirmed, created_at')
    .eq('report_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    if (isTableMissingError(error)) {
      return safeJsonResponse({ mappings: [], tableMissing: true })
    }
    console.error('[pii] Error fetching pii_mappings:', error)
    return safeJsonResponse({ error: 'Failed to fetch PII mappings' }, { status: 500 })
  }

  return safeJsonResponse({ mappings: data ?? [] })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createRouteSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return safeJsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the report belongs to the user so we don't leak existence of
  // other reports via update errors.
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (reportError || !report) {
    return safeJsonResponse({ error: 'Report not found' }, { status: 404 })
  }

  let body: { updates?: PatchUpdate[] }
  try {
    body = await request.json()
  } catch {
    return safeJsonResponse({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const updates = Array.isArray(body?.updates) ? body!.updates! : []
  if (updates.length === 0) {
    return safeJsonResponse({ updated: 0 })
  }

  let updated = 0
  for (const u of updates) {
    if (!u || typeof u.id !== 'string') continue

    // Build a patch with only the fields the caller sent. Validate action.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patch: Record<string, any> = { updated_at: new Date().toISOString() }
    if (u.action !== undefined) {
      if (u.action !== 'replace' && u.action !== 'semantic' && u.action !== 'remove') {
        return safeJsonResponse({ error: `Invalid action "${u.action}"` }, { status: 400 })
      }
      patch.action = u.action
    }
    if (typeof u.is_excluded === 'boolean') patch.is_excluded = u.is_excluded
    if (typeof u.is_confirmed === 'boolean') patch.is_confirmed = u.is_confirmed

    // Nothing worth writing for this row.
    if (Object.keys(patch).length === 1) continue

    const { error, count } = await supabase
      .from('pii_mappings')
      .update(patch, { count: 'exact' })
      .eq('id', u.id)
      .eq('report_id', id) // Belt-and-suspenders on top of RLS.

    if (error) {
      if (isTableMissingError(error)) {
        return safeJsonResponse(
          {
            error: 'pii_mappings table not found. Apply migration 004 — see supabase/MIGRATIONS.md.',
          },
          { status: 503 },
        )
      }
      console.error('[pii] Error updating pii_mapping:', error)
      return safeJsonResponse({ error: 'Failed to update PII mapping' }, { status: 500 })
    }

    updated += count ?? 0
  }

  return safeJsonResponse({ updated })
}
