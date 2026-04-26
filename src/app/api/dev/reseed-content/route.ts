import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { seedContentFromStructuredData } from '@/components/report/section-editor/slot-seeding'

export const runtime = 'nodejs'

// Re-derive the editor's `content` JSON tree from `structured_data` for
// every section in a report. Useful after changing the seeding logic
// (e.g. adding a generic fallback) so existing reports pick up the new
// shape without rerunning the AI extractor.
//
// POST { reportId } → { reseeded, skipped }
//
// RLS scopes the section query to the caller, so users only ever
// reseed reports they own.
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as { reportId?: string } | null
  const reportId = body?.reportId
  if (!reportId) {
    return NextResponse.json({ error: 'Missing reportId' }, { status: 400 })
  }

  const { data: report, error: reportErr } = await supabase
    .from('reports')
    .select('id, user_id')
    .eq('id', reportId)
    .single()
  if (reportErr || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }
  if (report.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: sections, error: secErr } = await supabase
    .from('report_sections')
    .select('id, title, section_type, structured_data')
    .eq('report_id', reportId)
  if (secErr) {
    return NextResponse.json({ error: secErr.message }, { status: 500 })
  }

  let reseeded = 0
  let skipped = 0
  const detail: Array<{ id: string; sectionType: string; reseeded: boolean }> = []

  for (const s of sections ?? []) {
    const sd = (s.structured_data ?? {}) as Record<string, unknown>
    if (!sd || Object.keys(sd).length === 0) {
      skipped += 1
      detail.push({ id: s.id, sectionType: s.section_type ?? 'unknown', reseeded: false })
      continue
    }
    const content = seedContentFromStructuredData(s.section_type ?? 'unknown', sd, {
      topicText: s.title ?? undefined,
    })
    if (!content) {
      skipped += 1
      detail.push({ id: s.id, sectionType: s.section_type ?? 'unknown', reseeded: false })
      continue
    }
    const { error: updErr } = await supabase
      .from('report_sections')
      .update({ content })
      .eq('id', s.id)
    if (updErr) {
      detail.push({ id: s.id, sectionType: s.section_type ?? 'unknown', reseeded: false })
      continue
    }
    reseeded += 1
    detail.push({ id: s.id, sectionType: s.section_type ?? 'unknown', reseeded: true })
  }

  return NextResponse.json({ reportId, reseeded, skipped, detail })
}
