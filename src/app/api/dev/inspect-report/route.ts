import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// GET /api/dev/inspect-report?reportId=...
// Returns a per-section snapshot of section_type + the top-level keys
// (and their value shapes) in structured_data, so we can diagnose
// mismatches between what the AI saved and what each renderer/seeder
// expects.
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reportId = request.nextUrl.searchParams.get('reportId')
  if (!reportId) return NextResponse.json({ error: 'Missing reportId' }, { status: 400 })

  const { data: report } = await supabase
    .from('reports')
    .select('id, user_id')
    .eq('id', reportId)
    .single()
  if (!report || report.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: sections, error } = await supabase
    .from('report_sections')
    .select('id, title, section_type, structured_data, content')
    .eq('report_id', reportId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  function shape(v: unknown): string {
    if (v === null || v === undefined) return 'null'
    if (Array.isArray(v)) {
      if (v.length === 0) return 'array(0)'
      const sample = v[0]
      if (sample && typeof sample === 'object') {
        return `array<{${Object.keys(sample as object).slice(0, 5).join(', ')}}>(${v.length})`
      }
      return `array<${typeof sample}>(${v.length})`
    }
    if (typeof v === 'object') {
      return `object{${Object.keys(v as object).slice(0, 5).join(', ')}}`
    }
    if (typeof v === 'string' && (v as string).length > 60) {
      return `string(${(v as string).length})`
    }
    return String(typeof v)
  }

  const summary = (sections ?? []).map((s) => {
    const sd = (s.structured_data ?? {}) as Record<string, unknown>
    const keys = Object.entries(sd).map(([k, v]) => `${k}: ${shape(v)}`)
    let contentBlocks: number | null = null
    try {
      const c = typeof s.content === 'string' ? JSON.parse(s.content) : s.content
      if (c && Array.isArray(c.blocks)) contentBlocks = c.blocks.length
    } catch {
      contentBlocks = null
    }
    return {
      id: s.id,
      title: s.title,
      sectionType: s.section_type,
      structuredDataKeys: keys,
      contentBlocks,
    }
  })

  return NextResponse.json({ reportId, sections: summary })
}
