import { createRouteSupabase } from '@/lib/supabase/route-handler-client'
import { safeJsonResponse } from '@/lib/api/safe-json'

/**
 * Canvas persistence for the spatial board
 * (`/dashboard/reports/[id]/canvas`).
 *
 * Reuses the same `file_uploads.confirmed_section_id` column the triage page
 * writes to — canvas and triage are two views over the same state. Positions
 * are stored as JSON inside the existing `ai_extraction_result` jsonb column
 * under the `canvas_position` key, so no extra migration is required.
 *
 * Depends on migration `002_evidence_triage.sql` for `confirmed_section_id`.
 * Graceful degradation:
 *   - GET falls back to a base projection (no `confirmed_section_id`) when
 *     migration 002 isn't applied.
 *   - PATCH returns 503 pointing at `supabase/MIGRATIONS.md` when a write
 *     touches the missing column.
 */

const CANVAS_COLUMNS = [
  'id',
  'filename',
  'file_type',
  'confirmed_section_id',
  'ai_extraction_result',
].join(', ')

const BASE_COLUMNS = ['id', 'filename', 'file_type', 'ai_extraction_result'].join(', ')

// Postgres "undefined column" — migration 002 not applied.
const UNDEFINED_COLUMN_CODE = '42703'

function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  if (error.code === UNDEFINED_COLUMN_CODE) return true
  const msg = (error.message || '').toLowerCase()
  return msg.includes('does not exist') && msg.includes('column')
}

type CanvasPosition = { x: number; y: number }

function extractCanvasPosition(result: unknown): CanvasPosition | null {
  if (!result || typeof result !== 'object') return null
  const pos = (result as Record<string, unknown>).canvas_position
  if (!pos || typeof pos !== 'object') return null
  const { x, y } = pos as Record<string, unknown>
  if (typeof x === 'number' && typeof y === 'number' && Number.isFinite(x) && Number.isFinite(y)) {
    return { x, y }
  }
  return null
}

type CanvasUpdate = {
  fileId: string
  confirmed_section_id?: string | null
  x?: number
  y?: number
}

/**
 * GET /api/reports/[id]/canvas
 * Response: { rows: Array<{ id, filename, file_type, confirmed_section_id, canvas_position }>, degraded: boolean }
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: reportId } = await params
  const supabase = await createRouteSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return safeJsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  // Scope to the caller's own report.
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .single()

  if (reportError || !report) {
    return safeJsonResponse({ error: 'Report not found' }, { status: 404 })
  }

  // Try the full canvas projection first.
  const full = await supabase
    .from('file_uploads')
    .select(CANVAS_COLUMNS)
    .eq('report_id', reportId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (!full.error) {
    const rows = (full.data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      filename: r.filename as string,
      file_type: r.file_type as string,
      confirmed_section_id: (r.confirmed_section_id as string | null) ?? null,
      canvas_position: extractCanvasPosition(r.ai_extraction_result),
    }))
    return safeJsonResponse({ rows, degraded: false })
  }

  // Fall back without `confirmed_section_id` when migration 002 is missing.
  if (isMissingColumnError(full.error)) {
    const base = await supabase
      .from('file_uploads')
      .select(BASE_COLUMNS)
      .eq('report_id', reportId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (base.error) {
      console.error('Error fetching canvas base rows:', base.error)
      return safeJsonResponse({ error: 'Failed to fetch canvas rows' }, { status: 500 })
    }

    const rows = (base.data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      filename: r.filename as string,
      file_type: r.file_type as string,
      canvas_position: extractCanvasPosition(r.ai_extraction_result),
    }))
    return safeJsonResponse({ rows, degraded: true })
  }

  console.error('Error fetching canvas rows:', full.error)
  return safeJsonResponse({ error: 'Failed to fetch canvas rows' }, { status: 500 })
}

/**
 * PATCH /api/reports/[id]/canvas
 * Body: { updates: Array<{ fileId, confirmed_section_id?, x?, y? }> }
 * Returns: { updated: number }
 *
 * For each update we merge `{ canvas_position: { x, y } }` into
 * `ai_extraction_result` read-modify-write, so other AI extraction data in
 * that column is preserved.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: reportId } = await params
  const supabase = await createRouteSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return safeJsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .single()

  if (reportError || !report) {
    return safeJsonResponse({ error: 'Report not found' }, { status: 404 })
  }

  let body: { updates?: CanvasUpdate[] }
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

    const hasSection = Object.prototype.hasOwnProperty.call(u, 'confirmed_section_id')
    const hasPosition = typeof u.x === 'number' && typeof u.y === 'number'
    if (!hasSection && !hasPosition) continue

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (hasSection) {
      patch.confirmed_section_id = u.confirmed_section_id ?? null
    }

    // Read-modify-write `ai_extraction_result` to preserve unrelated keys.
    if (hasPosition) {
      const existing = await supabase
        .from('file_uploads')
        .select('ai_extraction_result')
        .eq('id', u.fileId)
        .eq('report_id', reportId)
        .eq('user_id', user.id)
        .single()

      if (existing.error) {
        if (isMissingColumnError(existing.error)) {
          sawMissingColumn = true
          break
        }
        // Row not found for this user — skip silently.
        if (existing.error.code === 'PGRST116') continue
        console.error('Error loading file_uploads row for canvas PATCH:', existing.error)
        return safeJsonResponse({ error: 'Failed to apply canvas update' }, { status: 500 })
      }

      const current =
        existing.data?.ai_extraction_result && typeof existing.data.ai_extraction_result === 'object'
          ? (existing.data.ai_extraction_result as Record<string, unknown>)
          : {}
      patch.ai_extraction_result = {
        ...current,
        canvas_position: { x: u.x as number, y: u.y as number },
      }
    }

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
      console.error('Error applying canvas update:', error)
      return safeJsonResponse({ error: 'Failed to apply canvas update' }, { status: 500 })
    }

    updated += count ?? 0
  }

  if (sawMissingColumn) {
    return safeJsonResponse(
      {
        error:
          'Canvas attachment column is missing on file_uploads. Apply migration 002_evidence_triage.sql — see supabase/MIGRATIONS.md.',
        code: 'MIGRATION_REQUIRED',
      },
      { status: 503 },
    )
  }

  return safeJsonResponse({ updated })
}
