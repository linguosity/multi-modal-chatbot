import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { ReportSchema } from '@/lib/schemas/report'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user can only access their own reports
    .single()

  if (error) {
    console.error('Error fetching report:', error)
    return new NextResponse(JSON.stringify({ error: 'Report not found' }), { status: 404 })
  }

  return NextResponse.json(report)
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const json = await request.json()

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
  const supabase = await createServerSupabase()

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