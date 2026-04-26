// In-memory SSE broadcaster keyed by operationId. Each event is a typed
// ProgressEvent (see src/lib/progress-events.ts) JSON-encoded onto the
// SSE `data:` line, so the client can JSON.parse without regex.
//
// Best-effort for dev / single-instance Node. In serverless multi-region
// deploys, processes do not share memory — pair with a durable channel
// (Supabase realtime, Pub/Sub) if cross-process delivery matters.

import type { ProgressEvent } from '@/lib/progress-events'

type Subscriber = {
  controller: ReadableStreamDefaultController<Uint8Array>
  keepAlive?: NodeJS.Timeout
}

const ops = new Map<string, Set<Subscriber>>()

function encodeSSE(data: string, event?: string): Uint8Array {
  const lines: string[] = []
  if (event) lines.push(`event: ${event}`)
  for (const line of data.split(/\r?\n/)) {
    lines.push(`data: ${line}`)
  }
  lines.push('\n')
  return new TextEncoder().encode(lines.join('\n'))
}

/** Emit a typed event to all subscribers of `operationId`. */
export function emitEvent(operationId: string | null | undefined, event: ProgressEvent) {
  if (!operationId) return
  const subs = ops.get(operationId)
  if (!subs || subs.size === 0) return
  let payload: Uint8Array
  try {
    payload = encodeSSE(JSON.stringify(event))
  } catch {
    return
  }
  subs.forEach((sub) => {
    try {
      sub.controller.enqueue(payload)
    } catch {
      /* subscriber closed */
    }
  })
}

/**
 * Emit a final `complete` event and close every subscriber's stream.
 * Idempotent — safe to call from both the success path and the catch
 * block of a route handler.
 */
export function completeProgress(operationId: string | null | undefined) {
  if (!operationId) return
  const subs = ops.get(operationId)
  if (!subs) return
  const payload = encodeSSE(JSON.stringify({ kind: 'complete' } satisfies ProgressEvent))
  subs.forEach((sub) => {
    try {
      sub.controller.enqueue(payload)
      sub.controller.close()
      if (sub.keepAlive) clearInterval(sub.keepAlive)
    } catch {
      /* subscriber closed */
    }
  })
  ops.delete(operationId)
}

export function subscribeProgress(operationId: string) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const sub: Subscriber = { controller }
      // Heartbeat every 20s so intermediaries don't time the connection out.
      sub.keepAlive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': keep-alive\n\n'))
        } catch {
          /* subscriber closed */
        }
      }, 20000)
      if (!ops.has(operationId)) ops.set(operationId, new Set())
      ops.get(operationId)!.add(sub)
    },
    cancel() {
      const subs = ops.get(operationId)
      if (!subs) return
      subs.forEach((s) => s.keepAlive && clearInterval(s.keepAlive))
      ops.delete(operationId)
    },
  })

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  })

  return new Response(stream, { headers })
}
