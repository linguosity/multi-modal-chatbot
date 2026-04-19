import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { parseWithZod } from '@/lib/ai/gemini-structured'

export const runtime = 'nodejs'

// Simple demo endpoint to exercise Structured Outputs end-to-end
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as { text?: string }
    const text = body.text || 'Alice and Bob are going to a science fair on Friday.'

    const CalendarEvent = z.object({
      name: z.string(),
      date: z.string(),
      participants: z.array(z.string()),
    })

    const res = await parseWithZod(
      CalendarEvent,
      'calendar_event',
      [
        { role: 'system', content: 'Extract the event information.' },
        { role: 'user', content: text },
      ]
    )

    if (!res.ok) {
      return NextResponse.json({ success: false, error: res.error, refusal: res.refusal || null }, { status: 400 })
    }

    return NextResponse.json({ success: true, event: res.data })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

