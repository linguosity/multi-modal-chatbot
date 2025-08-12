import { NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/route-handler-client'
import { ReportSchema } from '@/lib/schemas/report'
import { normalizeReport } from '@/lib/utils/normalize-report'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const supabase = await createRouteSupabase()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  let { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user can only access their own reports
    .single()

  if (error) {
    console.error('Error fetching report:', error)
    return new NextResponse(JSON.stringify({ error: 'Report not found' }), { status: 404 })
  }

  // Normalize before returning to clients
  const normalized = normalizeReport(report as any)
  return NextResponse.json(normalized)
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const supabase = await createRouteSupabase()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  let json = await request.json()
  // Normalize incoming payload so schema validation sees consistent keys
  json = normalizeReport(json as any)

  // Validate with Zod schema
  const validation = ReportSchema.safeParse(json)
  if (!validation.success) {
    return new NextResponse(JSON.stringify({ error: 'Invalid report data', details: validation.error.flatten() }), { status: 400 })
  }

  const { data, error } = await supabase
    .from('reports')
    .update({
      ...validation.data,
      updated_at: new Date().toISOString(), // Update timestamp on modification
    })
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user can only update their own reports
    .select()
    .single()

  if (error) {
    console.error('Error updating report:', error)
    return new NextResponse(JSON.stringify({ error: 'Failed to update report' }), { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const supabase = await createRouteSupabase()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user can only delete their own reports

  if (error) {
    console.error('Error deleting report:', error)
    return new NextResponse(JSON.stringify({ error: 'Failed to delete report' }), { status: 500 })
  }

  return new NextResponse(null, { status: 204 }) // 204 No Content for successful deletion
}
