import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ReportSchema, DEFAULT_SECTIONS } from '@/lib/schemas/report'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching reports:', error)
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch reports' }), { status: 500 })
  }

  return NextResponse.json(reports)
}

export async function POST(request: Request) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const json = await request.json()
  const { title, studentId, type } = json

  // Basic validation
  if (!title || !studentId || !type) {
    return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
  }

  const newReportData = {
    id: uuidv4(),
    studentId: studentId,
    title,
    type,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: Object.values(DEFAULT_SECTIONS).map(section => ({
      ...section,
      id: uuidv4(), // Give each section a unique ID
    })),
  };

  // Validate with Zod schema (optional but good practice)
  const validation = ReportSchema.safeParse(newReportData)
  if (!validation.success) {
    return new NextResponse(JSON.stringify({ error: 'Invalid report data', details: validation.error.flatten() }), { status: 400 })
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({
      id: validation.data.id,
      user_id: user.id,
      template_id: validation.data.templateId,
      title: validation.data.title,
      type: validation.data.type,
      status: validation.data.status,
      student_id: validation.data.studentId,
      evaluator_id: validation.data.evaluatorId,
      created_at: validation.data.createdAt,
      updated_at: validation.data.updatedAt,
      sections: validation.data.sections,
      tags: validation.data.tags,
      finalized_date: validation.data.finalizedDate,
      print_version: validation.data.printVersion,
      related_assessment_ids: validation.data.relatedAssessmentIds,
      related_eligibility_ids: validation.data.relatedEligibilityIds,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating report:', error)
    return new NextResponse(JSON.stringify({ error: 'Failed to create report' }), { status: 500 })
  }

  return NextResponse.json(data)
}
