import { NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/route-handler-client'
import { safeJsonResponse } from '@/lib/api/safe-json'
import { buildReidentifier } from '@/lib/pii/reidentify'
import type { Section } from '@/types/report-types'

/**
 * GET /api/reports/[id]
 * Fetch report metadata + sections from report_sections (single source of truth).
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createRouteSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return safeJsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch report metadata
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (reportError || !report) {
    console.error('Error fetching report:', reportError)
    return safeJsonResponse({ error: 'Report not found' }, { status: 404 })
  }

  // Fetch sections from report_sections (sole source of truth)
  const { data: sectionRows, error: sectionsError } = await supabase
    .from('report_sections')
    .select('*')
    .eq('report_id', id)
    .order('order', { ascending: true })

  if (sectionsError) {
    console.error('Error fetching report sections:', sectionsError)
  }

  // Transform DB rows to frontend Section type
  const sections: Section[] = (sectionRows || []).map((row) => ({
    id: row.id,
    report_id: row.report_id,
    sectionType: row.section_type,
    title: row.title,
    order: row.order,
    content: row.content,
    structured_data: row.structured_data,
    extraction_confidence: row.extraction_confidence,
    source_refs: row.source_refs,
    change_tracking: row.change_tracking,
    isCompleted: row.is_completed,
    isRequired: row.is_required,
    isGenerated: row.is_generated,
  }))

  // ── PII re-identification (design review §10) ─────────────────────────
  // AI-generated content was written back with tokens (`[STUDENT_001]`) to
  // keep real PII out of the LLM. Swap tokens back to real values before
  // returning to the SLP so the UI renders the intended names.
  const reidentifier = await buildReidentifier(supabase, id)
  const reidSections = reidentifier.size() > 0
    ? sections.map((s) => ({
        ...s,
        content: typeof s.content === 'string' ? reidentifier.reidentifyString(s.content) : s.content,
        structured_data: reidentifier.reidentifyDeep(s.structured_data),
      }))
    : sections
  const reidReport = reidentifier.size() > 0 && report.metadata
    ? { ...report, metadata: reidentifier.reidentifyDeep(report.metadata) }
    : report

  return safeJsonResponse({ ...reidReport, sections: reidSections })
}

/**
 * PUT /api/reports/[id]
 * Update report metadata only. Section updates go through /api/reports/[id]/sections/[sectionId].
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createRouteSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return safeJsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const json = await request.json()

  // Build metadata-only update payload
  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (json.title !== undefined) updatePayload.title = json.title
  if (json.type !== undefined) updatePayload.type = json.type
  if (json.status !== undefined) updatePayload.status = json.status
  if (json.student_id !== undefined) updatePayload.student_id = json.student_id
  if (json.student_name !== undefined) updatePayload.student_name = json.student_name
  if (json.template_id !== undefined) updatePayload.template_id = json.template_id
  if (json.evaluator_id !== undefined) updatePayload.evaluator_id = json.evaluator_id
  if (json.metadata !== undefined) updatePayload.metadata = json.metadata
  if (json.tags !== undefined) updatePayload.tags = json.tags
  if (json.finalized_date !== undefined) updatePayload.finalized_date = json.finalized_date

  const { data, error } = await supabase
    .from('reports')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating report:', error)
    return safeJsonResponse({ error: 'Failed to update report' }, { status: 500 })
  }

  return safeJsonResponse(data)
}

/**
 * DELETE /api/reports/[id]
 * Delete a report. Cascade on report_sections handles section cleanup.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createRouteSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return safeJsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting report:', error)
    return safeJsonResponse({ error: 'Failed to delete report' }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
