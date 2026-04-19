import { createRouteSupabase } from '@/lib/supabase/route-handler-client'
import { safeJsonResponse } from '@/lib/api/safe-json'

/**
 * PUT /api/reports/[id]/sections/[sectionId]
 * Update an individual section (content, structured_data, is_completed, title, etc.)
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string; sectionId: string } }
) {
  const { id: reportId, sectionId } = params
  const supabase = await createRouteSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return safeJsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify report ownership
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .single()

  if (reportError || !report) {
    return safeJsonResponse({ error: 'Report not found' }, { status: 404 })
  }

  const json = await request.json()
  const now = new Date().toISOString()

  // Build update payload — only include fields that are provided
  const updatePayload: Record<string, any> = { updated_at: now }

  if (json.title !== undefined) updatePayload.title = json.title
  if (json.content !== undefined) updatePayload.content = json.content
  if (json.structured_data !== undefined) updatePayload.structured_data = json.structured_data
  if (json.hydrated_html !== undefined) updatePayload.hydrated_html = json.hydrated_html
  if (json.is_completed !== undefined) updatePayload.is_completed = json.is_completed
  if (json.is_required !== undefined) updatePayload.is_required = json.is_required
  if (json.is_generated !== undefined) updatePayload.is_generated = json.is_generated
  if (json.order !== undefined) updatePayload.order = json.order
  if (json.section_type !== undefined) updatePayload.section_type = json.section_type
  if (json.extraction_confidence !== undefined) updatePayload.extraction_confidence = json.extraction_confidence
  if (json.source_refs !== undefined) updatePayload.source_refs = json.source_refs
  if (json.change_tracking !== undefined) updatePayload.change_tracking = json.change_tracking

  const { data, error } = await supabase
    .from('report_sections')
    .update(updatePayload)
    .eq('id', sectionId)
    .eq('report_id', reportId)
    .select()
    .single()

  if (error) {
    console.error('Error updating section:', error)
    return safeJsonResponse({ error: 'Failed to update section' }, { status: 500 })
  }

  return safeJsonResponse(data)
}

/**
 * DELETE /api/reports/[id]/sections/[sectionId]
 * Remove a section from the report.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; sectionId: string } }
) {
  const { id: reportId, sectionId } = params
  const supabase = await createRouteSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return safeJsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify report ownership
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .single()

  if (reportError || !report) {
    return safeJsonResponse({ error: 'Report not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('report_sections')
    .delete()
    .eq('id', sectionId)
    .eq('report_id', reportId)

  if (error) {
    console.error('Error deleting section:', error)
    return safeJsonResponse({ error: 'Failed to delete section' }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
