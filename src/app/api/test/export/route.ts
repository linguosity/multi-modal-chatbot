import { NextRequest, NextResponse } from 'next/server'
import { transformSeedForExport } from '@/lib/export/report-to-export-data'
import { generatePDF } from '@/lib/export/pdf-renderer'
import { generateDOCX } from '@/lib/export/docx-renderer'

/**
 * GET /api/test/export?format=pdf|docx
 *
 * Quick test endpoint — no auth required.
 * Uses seed data (Brandon Brewer - Initial SLP Evaluation) to generate
 * a sample export for validating PDF/DOCX rendering.
 */
export async function GET(request: NextRequest) {
  try {
    const format = request.nextUrl.searchParams.get('format') || 'pdf'

    if (format !== 'pdf' && format !== 'docx') {
      return NextResponse.json(
        { error: 'Invalid format. Use ?format=pdf or ?format=docx' },
        { status: 400 }
      )
    }

    const exportData = transformSeedForExport()

    if (format === 'pdf') {
      const pdfBuffer = await generatePDF(exportData)
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="test-export-${Date.now()}.pdf"`,
        },
      })
    }

    const docxBuffer = await generateDOCX(exportData)
    return new NextResponse(docxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="test-export-${Date.now()}.docx"`,
      },
    })
  } catch (error) {
    console.error('Test export error:', error)
    return NextResponse.json(
      { error: 'Export generation failed', details: String(error) },
      { status: 500 }
    )
  }
}
