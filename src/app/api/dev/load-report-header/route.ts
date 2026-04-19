import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const root = process.cwd()
    const p = path.join(root, 'test_input', 'reports_rows (1).json')
    const raw = await fs.readFile(p, 'utf8')
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr) || arr.length === 0) {
      return NextResponse.json({ success: false, error: 'No rows found in test file' }, { status: 404 })
    }
    const report = arr[0]
    let header: any = null
    try {
      const sections = JSON.parse(report.sections)
      if (Array.isArray(sections)) {
        header = sections.find((s: any) => (s.sectionType === 'heading' || s.title?.toLowerCase().includes('student information')))
      }
    } catch {}
    return NextResponse.json({
      success: true,
      reportId: report.id,
      header: header ? { id: header.id, title: header.title, sectionType: header.sectionType, structured_data: header.structured_data || {} } : null,
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

