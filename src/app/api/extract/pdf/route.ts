import { NextRequest, NextResponse } from 'next/server'
// PDF text extraction disabled to avoid native 'canvas' dependency

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Expected a PDF file under field "file"' }, { status: 400 })
    }

    // Minimal normalized shape for Sources tab (placeholder content)
    const result = {
      artifactId: file.name,
      type: 'pdf' as const,
      size: file.size,
      pageCountEstimate: Math.max(1, Math.ceil(file.size / (50 * 1024))),
      blocks: [
        {
          page: 1,
          kind: 'text' as const,
          text: 'PDF received. Text extraction disabled in this build.',
          // bbox omitted here; upstream extractor can be swapped to provide per-block coords later
          confidence: 1,
        },
      ],
    }

    return NextResponse.json({ success: true, artifact: result })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
