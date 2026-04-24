import { NextRequest, NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/route-handler-client'
import {
  transformReportForExport,
  transformSingleSectionForExport,
} from '@/lib/export/report-to-export-data'
import { generatePDF } from '@/lib/export/pdf-renderer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportId, sectionId, narrative, sectionTitle } = body

    let exportData

    // Single-section export (backward compat with NarrativeView)
    if (sectionId && narrative && sectionTitle) {
      exportData = transformSingleSectionForExport({ narrative, sectionTitle, reportId })
    }
    // Full report export
    else if (reportId) {
      const supabase = await createRouteSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { data: report } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .eq('user_id', user.id)
        .single()

      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }

      const { data: sections } = await supabase
        .from('report_sections')
        .select('*')
        .eq('report_id', reportId)
        .order('order', { ascending: true })

      exportData = transformReportForExport({
        ...report,
        sections: (sections || []).map((s: Record<string, unknown>) => ({
          title: s.title as string,
          section_type: s.section_type as string,
          order: s.order as number,
          content: s.content as string | null,
        })),
      })
    } else {
      return NextResponse.json({ error: 'Missing reportId or section data' }, { status: 400 })
    }

    const pdfBuffer = await generatePDF(exportData)
    const filename = exportData.title
      .replace(/[^a-z0-9\s]/gi, '')
      .replace(/\s+/g, '_')
      .toLowerCase()

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json({ error: 'Failed to export PDF' }, { status: 500 })
  }
}
