// Typed progress events sent over SSE during AI intake processing.
//
// Shared by the server (emit) and the client (consume). Server-safe: no React,
// no DOM. Client wraps these in a typed dispatcher (see lib/event-bus.ts).
//
// Wire format: each SSE `data:` line is a JSON-encoded ProgressEvent.

export type StageId =
  | 'uploading_files'
  | 'extracting_text'
  | 'analyzing_with_ai'
  | 'applying_updates'

export type StageStatus = 'start' | 'done' | 'failed'

export type FileKind = 'pdf' | 'audio' | 'image' | 'note' | 'transcript' | 'other'

export type MergeStrategy = 'replace' | 'append' | 'remove'

export type FieldStatus = 'pending' | 'applied' | 'failed'

export interface StageEvent {
  kind: 'stage'
  stage: StageId
  status: StageStatus
  /** Used as the synthetic `sectionId.fieldPath` key by the toast dispatcher. */
  sectionId?: string
}

export interface PiiEvent {
  kind: 'pii'
  source: 'text' | 'file'
  filename?: string
  entitiesFound: number
}

export interface FileEvent {
  kind: 'file'
  filename: string
  fileKind: FileKind
  status: StageStatus
  /** Section the file work is attributed to (for the toast key). */
  sectionId?: string
}

/**
 * The headline event — emitted before and after each individual field update.
 * Carries enough context for a card-style UI: section name, slot label, and
 * a short value preview.
 */
export interface FieldEvent {
  kind: 'field'
  sectionId: string
  /** Friendly section title, e.g. "Student Information". */
  sectionLabel?: string
  /** Raw field path on the section's structured_data (may be nested). */
  fieldPath: string
  /** Friendly slot label from SLOT_REGISTRY when known, else snake → Title Case. */
  slotLabel?: string
  /** Short string preview of the new value (truncated, server-side). */
  valuePreview?: string
  mergeStrategy: MergeStrategy
  status: FieldStatus
  error?: string
}

export interface CompleteEvent {
  kind: 'complete'
}

export interface ErrorEvent {
  kind: 'error'
  message: string
}

export type ProgressEvent =
  | StageEvent
  | PiiEvent
  | FileEvent
  | FieldEvent
  | CompleteEvent
  | ErrorEvent

/** Truncate a value for inline display next to a field-update card. */
export function previewValue(value: unknown, maxLen = 80): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > maxLen ? trimmed.slice(0, maxLen - 1) + '…' : trimmed
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const joined = value.map(v => (typeof v === 'string' ? v : JSON.stringify(v))).join(', ')
    return joined.length > maxLen ? joined.slice(0, maxLen - 1) + '…' : joined
  }
  try {
    const json = JSON.stringify(value)
    return json.length > maxLen ? json.slice(0, maxLen - 1) + '…' : json
  } catch {
    return '[unserializable]'
  }
}
