import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/file-processing'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file || !file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'Expected an audio file under field "file"' }, { status: 400 })
    }

    const transcript = await transcribeAudio(file)

    // Minimal normalized transcript for Sources tab
    const artifact = {
      artifactId: file.name,
      type: 'audio' as const,
      size: file.size,
      diarization: 'unknown' as const,
      segments: [
        { speaker: 'unknown' as const, startSec: 0, endSec: Math.max(0, Math.round(file.size / (32 * 1024))), text: transcript, confidence: 0.9 },
      ],
    }

    return NextResponse.json({ success: true, artifact })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

