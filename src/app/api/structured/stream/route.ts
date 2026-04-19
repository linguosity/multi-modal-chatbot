import { NextRequest } from 'next/server'
import { z } from 'zod'
import { streamParseWithZod } from '@/lib/ai/structured'

export const runtime = 'nodejs'

// Streams schema-constrained output as SSE while also returning the final parsed object at the end
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as { text?: string }
  const text = body.text || 'The quick brown fox jumps over the lazy dog with piercing blue eyes.'

  const EntitiesSchema = z.object({
    attributes: z.array(z.string()),
    colors: z.array(z.string()),
    animals: z.array(z.string()),
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`))
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      ;(async () => {
        try {
          let fullText = ''

          const stream = streamParseWithZod(
            EntitiesSchema,
            'entities',
            [
              { role: 'system', content: 'Extract entities from the input text as per schema.' },
              { role: 'user', content: text },
            ]
          )

          for await (const chunk of stream) {
            fullText += chunk
            send('delta', { delta: chunk })
          }

          send('delta_done', {})

          // Parse and validate the accumulated JSON
          try {
            const parsed = EntitiesSchema.parse(JSON.parse(fullText))
            send('final', { parsed })
          } catch (parseErr: any) {
            send('error', { error: `Parse error: ${parseErr.message}` })
          }
        } catch (e: any) {
          send('error', { error: e?.message || String(e) })
        } finally {
          controller.close()
        }
      })()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
