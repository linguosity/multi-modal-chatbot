import { createRouteSupabase } from '@/lib/supabase/route-handler-client'
import { safeJsonResponse } from '@/lib/api/safe-json'
import { v4 as uuidv4 } from 'uuid'

/**
 * GET /api/reports/[id]/sections
 * Fetch all sections for a report, ordered by `order`.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: reportId } = await params
  const supabase = await createRouteSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return safeJsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the report belongs to the user
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('id')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .single()

  if (reportError || !report) {
    return safeJsonResponse({ error: 'Report not found' }, { status: 404 })
  }

  const { data: sections, error } = await supabase
    .from('report_sections')
    .select('*')
    .eq('report_id', reportId)
    .order('order', { ascending: true })

  if (error) {
    console.error('Error fetching sections:', error)
    return safeJsonResponse({ error: 'Failed to fetch sections' }, { status: 500 })
  }

  return safeJsonResponse(sections || [])
}

/**
 * POST /api/reports/[id]/sections
 * Create a new section in the report.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: reportId } = await params
  const supabase = await createRouteSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return safeJsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
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

  const { data, error } = await supabase
    .from('report_sections')
    .insert({
      id: json.id || uuidv4(),
      report_id: reportId,
      section_type: json.section_type || json.sectionType || 'other',
      title: json.title || 'Untitled Section',
      order: json.order ?? 0,
      content: json.content || '',
      structured_data: json.structured_data || null,
      is_completed: json.is_completed ?? false,
      is_required: json.is_required ?? true,
      is_generated: json.is_generated ?? false,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating section:', error)
    return safeJsonResponse({ error: 'Failed to create section' }, { status: 500 })
  }

  return safeJsonResponse(data, { status: 201 })
}
