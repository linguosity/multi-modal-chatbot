/**
 * Typed event bus for AI processing updates.
 *
 * The pipeline is end-to-end typed now: server emits a ProgressEvent,
 * the client dispatches it directly through this bus — no regex on
 * stringified log lines. Subscribers are split by event kind so the
 * toast UI handles field updates while LoadingMoment handles file +
 * stage progression.
 */

import type { ProgressEvent } from '@/lib/progress-events'

export interface ProcessingUpdateEvent {
  /** Stable id for pairing pending → applied/failed: `${sectionId}.${fieldPath}`. */
  id: string
  sectionId: string
  /** Friendly section title from the route (e.g. "Student Information"). */
  sectionLabel?: string
  fieldPath: string
  /** Friendly slot label (e.g. "Date of birth"). */
  fieldLabel: string
  /** Truncated server-side preview of the new value. */
  valuePreview?: string
  action: 'replace' | 'append' | 'remove'
  /** Verb derived from action — "Updating", "Adding", "Removing". */
  verb: string
  timestamp: number
}

export interface ProcessingCompleteEvent {
  id: string
  sectionId?: string
  sectionLabel?: string
  fieldLabel?: string
  valuePreview?: string
  success: boolean
  errors?: string[]
  timestamp: number
}

export interface ProcessingErrorEvent {
  id: string
  sectionId?: string
  sectionLabel?: string
  fieldLabel?: string
  errors: string[]
  timestamp: number
}

export interface StageProgressEvent {
  stage: 'uploading_files' | 'extracting_text' | 'analyzing_with_ai' | 'applying_updates'
  status: 'start' | 'done' | 'failed'
  timestamp: number
}

export interface FileProgressEvent {
  filename: string
  fileKind: string
  status: 'start' | 'done' | 'failed'
  timestamp: number
}

export interface PiiProgressEvent {
  source: 'text' | 'file'
  filename?: string
  entitiesFound: number
  timestamp: number
}

type EventType =
  | 'processing-update'
  | 'processing-complete'
  | 'processing-error'
  | 'stage-progress'
  | 'file-progress'
  | 'pii-progress'
  | 'processing-finished'

type EventHandler<T> = (event: T) => void

class EventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners: Map<EventType, Set<EventHandler<any>>> = new Map()

  subscribe<T>(eventType: EventType, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(handler)
    return () => {
      this.listeners.get(eventType)?.delete(handler)
    }
  }

  emit<T>(eventType: EventType, event: T): void {
    const handlers = this.listeners.get(eventType)
    if (handlers) handlers.forEach((handler) => handler(event))
  }

  clear(): void {
    this.listeners.clear()
  }
}

export const eventBus = new EventBus()

function actionVerb(action: 'replace' | 'append' | 'remove'): string {
  switch (action) {
    case 'replace':
      return 'Updating'
    case 'append':
      return 'Adding'
    case 'remove':
      return 'Removing'
    default:
      return 'Processing'
  }
}

/**
 * Dispatch a typed ProgressEvent through the bus. Used by both the SSE
 * consumer (after JSON.parse on each `data:` line) and synthetic
 * client-side emitters (e.g. drawer staging the AI call before SSE
 * connects).
 *
 * Stage markers like `uploading_files` aren't field updates — they go
 * out as `stage-progress` events so the toast UI can ignore them while
 * LoadingMoment uses them to advance its file feed.
 */
export function dispatchProgressEvent(event: ProgressEvent): void {
  const ts = Date.now()
  switch (event.kind) {
    case 'stage':
      eventBus.emit<StageProgressEvent>('stage-progress', {
        stage: event.stage,
        status: event.status,
        timestamp: ts,
      })
      return
    case 'file':
      eventBus.emit<FileProgressEvent>('file-progress', {
        filename: event.filename,
        fileKind: event.fileKind,
        status: event.status,
        timestamp: ts,
      })
      return
    case 'pii':
      eventBus.emit<PiiProgressEvent>('pii-progress', {
        source: event.source,
        filename: event.filename,
        entitiesFound: event.entitiesFound,
        timestamp: ts,
      })
      return
    case 'field': {
      const id = `${event.sectionId}.${event.fieldPath}`
      const label = event.slotLabel ?? event.fieldPath
      if (event.status === 'pending') {
        eventBus.emit<ProcessingUpdateEvent>('processing-update', {
          id,
          sectionId: event.sectionId,
          sectionLabel: event.sectionLabel,
          fieldPath: event.fieldPath,
          fieldLabel: label,
          valuePreview: event.valuePreview,
          action: event.mergeStrategy,
          verb: actionVerb(event.mergeStrategy),
          timestamp: ts,
        })
        return
      }
      if (event.status === 'applied') {
        eventBus.emit<ProcessingCompleteEvent>('processing-complete', {
          id,
          sectionId: event.sectionId,
          sectionLabel: event.sectionLabel,
          fieldLabel: label,
          valuePreview: event.valuePreview,
          success: true,
          timestamp: ts,
        })
        return
      }
      // failed
      eventBus.emit<ProcessingCompleteEvent>('processing-complete', {
        id,
        sectionId: event.sectionId,
        sectionLabel: event.sectionLabel,
        fieldLabel: label,
        success: false,
        errors: event.error ? [event.error] : ['Update failed'],
        timestamp: ts,
      })
      return
    }
    case 'complete':
      eventBus.emit<{ timestamp: number }>('processing-finished', { timestamp: ts })
      return
    case 'error':
      eventBus.emit<{ message: string; timestamp: number }>('processing-finished', {
        timestamp: ts,
        message: event.message,
      })
      return
  }
}

/**
 * Parse a raw SSE `data:` payload into a ProgressEvent and dispatch it.
 * Returns false when the payload isn't a JSON ProgressEvent (e.g.
 * heartbeat comments or legacy string lines), letting callers decide
 * how to handle the leftover.
 */
export function dispatchSseLine(raw: string): boolean {
  if (!raw) return false
  try {
    const parsed = JSON.parse(raw) as ProgressEvent
    if (parsed && typeof parsed === 'object' && 'kind' in parsed) {
      dispatchProgressEvent(parsed)
      return true
    }
  } catch {
    /* not JSON — heartbeat or comment */
  }
  return false
}
