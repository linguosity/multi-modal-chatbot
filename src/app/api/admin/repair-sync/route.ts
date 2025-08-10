import { NextRequest, NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/route-handler-client'

type RepairBody = {
  reportId?: string
}

export async function POST(req: NextRequest) {
  const supabase = await createRouteSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await req.json().catch(() => ({}))) as RepairBody
    const targetReportId = body?.reportId

    // 1) Fetch target reports (current user only)
    let reports: Array<{ id: string; sections: any[] }> = []
    if (targetReportId) {
      const { data, error } = await supabase
        .from('reports')
        .select('id, sections')
        .eq('id', targetReportId)
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
      if (error) throw error
      if (data) reports = [data as any]
    } else {
      const { data, error } = await supabase
        .from('reports')
        .select('id, sections')
        .eq('user_id', user.id)
      if (error) throw error
      reports = (data || []) as any
    }

    let totalUpserts = 0
    let totalMirrored = 0

    for (const report of reports) {
      const reportId = report.id
      const embedded = Array.isArray(report.sections) ? (report.sections as any[]) : []

      // 2) Backfill/upsert report_sections from embedded JSON (with order)
      const upserts = embedded.map((e, idx) => ({
        id: e?.id,
        report_id: reportId,
        title: e?.title || 'Untitled Section',
        section_type: e?.sectionType || e?.section_type || 'unknown',
        structured_data: e?.structured_data ?? null,
        order: idx,
      })).filter(r => !!r.id)

      if (upserts.length) {
        const { error: upErr } = await supabase
          .from('report_sections')
          .upsert(upserts as any, { onConflict: 'id' })
        if (upErr) throw upErr
        totalUpserts += upserts.length
      }

      // 3) Mirror structured_data back from report_sections into embedded JSON
      const { data: rsRows, error: fetchRsErr } = await supabase
        .from('report_sections')
        .select('id, structured_data, order')
        .eq('report_id', reportId)
      if (fetchRsErr) throw fetchRsErr
      const rsById = new Map<string, any>()
      ;(rsRows || []).forEach(r => rsById.set(r.id, r))

      const rebuilt = embedded.map((e: any) => {
        const row = e?.id ? rsById.get(e.id) : null
        if (row && row.structured_data !== undefined && row.structured_data !== null) {
          return { ...e, structured_data: row.structured_data }
        }
        return e
      })

      const { error: updErr } = await supabase
        .from('reports')
        .update({ sections: rebuilt })
        .eq('id', reportId)
      if (updErr) throw updErr
      totalMirrored += rebuilt.length
    }

    return NextResponse.json({ success: true, processedReports: reports.length, totalUpserts, totalMirrored })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

