// Simple in-memory SSE broadcaster keyed by operationId
// NOTE: This is best-effort for dev/local. In serverless, processes may not share memory.

type Subscriber = {
  controller: ReadableStreamDefaultController<Uint8Array>;
  keepAlive?: NodeJS.Timeout;
}

const ops = new Map<string, Set<Subscriber>>()

function encodeSSE(data: string, event?: string): Uint8Array {
  const lines = [] as string[]
  if (event) lines.push(`event: ${event}`)
  // split multiline payloads
  for (const line of data.split(/\r?\n/)) {
    lines.push(`data: ${line}`)
  }
  lines.push('\n')
  return new TextEncoder().encode(lines.join('\n'))
}

export function emitProgress(operationId: string | null | undefined, data: string, event?: string) {
  if (!operationId) return
  const subs = ops.get(operationId)
  if (!subs || subs.size === 0) return
  const payload = encodeSSE(data, event)
  subs.forEach(sub => {
    try { sub.controller.enqueue(payload) } catch {}
  })
}

export function completeProgress(operationId: string | null | undefined) {
  if (!operationId) return
  const subs = ops.get(operationId)
  if (!subs) return
  subs.forEach(sub => {
    try {
      sub.controller.enqueue(encodeSSE('complete', 'complete'))
      sub.controller.close()
      if (sub.keepAlive) clearInterval(sub.keepAlive)
    } catch {}
  })
  ops.delete(operationId)
}

export function subscribeProgress(operationId: string) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const sub: Subscriber = { controller }
      // send initial comment to open stream
      try { controller.enqueue(encodeSSE('connected', 'open')) } catch {}
      // heartbeat every 20s
      sub.keepAlive = setInterval(() => {
        try { controller.enqueue(new TextEncoder().encode(': keep-alive\n\n')) } catch {}
      }, 20000)
      if (!ops.has(operationId)) ops.set(operationId, new Set())
      ops.get(operationId)!.add(sub)
    },
    cancel() {
      const subs = ops.get(operationId)
      if (!subs) return
      subs.forEach(s => s.keepAlive && clearInterval(s.keepAlive))
      ops.delete(operationId)
    }
  })

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  })

  return new Response(stream, { headers })
}

