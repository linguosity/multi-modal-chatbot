/**
 * Progress Toast Dispatcher
 *
 * Listens to typed processing events on the event bus and produces
 * `ProgressToast` records the UI renders as a stack of cards.
 * Coalesces high-volume bursts (≥3 in-flight updates per section) into
 * a single per-section card so the user sees a section-level summary
 * instead of a scrolling fire-hose.
 */

import {
  eventBus,
  type ProcessingUpdateEvent,
  type ProcessingCompleteEvent,
  type ProcessingErrorEvent,
} from './event-bus'

export interface ProgressToast {
  id: string
  sectionId: string
  /** Friendly section title (e.g. "Student Information"). Falls back to id when unknown. */
  sectionLabel: string
  fieldLabel: string
  /** Truncated preview of the value the AI wrote (when available). */
  valuePreview?: string
  verb: string
  status: 'processing' | 'success' | 'error' | 'timeout'
  errors?: string[]
  timestamp: number
  /** Set on coalesced section-level toasts; counts in-flight updates. */
  count?: number
}

type ToastUpdateHandler = (toasts: Map<string, ProgressToast>) => void

class ProgressToastDispatcher {
  private toasts: Map<string, ProgressToast> = new Map()
  private sectionCounts: Map<string, number> = new Map()
  private sectionLabels: Map<string, string> = new Map()
  private updateHandlers: Set<ToastUpdateHandler> = new Set()
  private readonly MAX_CONCURRENT_TOASTS = 5
  private readonly COALESCE_THRESHOLD = 3

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    eventBus.subscribe<ProcessingUpdateEvent>('processing-update', (event) => {
      this.handleProcessingUpdate(event)
    })
    eventBus.subscribe<ProcessingCompleteEvent>('processing-complete', (event) => {
      this.handleProcessingComplete(event)
    })
    eventBus.subscribe<ProcessingErrorEvent>('processing-error', (event) => {
      this.handleProcessingError(event)
    })
  }

  private rememberSectionLabel(sectionId: string, label: string | undefined) {
    if (label && !this.sectionLabels.has(sectionId)) {
      this.sectionLabels.set(sectionId, label)
    }
  }

  private getSectionLabel(sectionId: string): string {
    return this.sectionLabels.get(sectionId) ?? 'Section'
  }

  private handleProcessingUpdate(event: ProcessingUpdateEvent): void {
    const { id, sectionId, sectionLabel, fieldLabel, valuePreview, verb } = event

    this.rememberSectionLabel(sectionId, sectionLabel)

    const currentCount = this.sectionCounts.get(sectionId) || 0
    this.sectionCounts.set(sectionId, currentCount + 1)

    if (currentCount >= this.COALESCE_THRESHOLD) {
      this.handleCoalescedToast(sectionId, verb)
      return
    }

    const toast: ProgressToast = {
      id,
      sectionId,
      sectionLabel: this.getSectionLabel(sectionId),
      fieldLabel,
      valuePreview,
      verb,
      status: 'processing',
      timestamp: event.timestamp,
    }
    this.addToast(toast)
  }

  private handleCoalescedToast(sectionId: string, verb: string): void {
    const coalescedId = `${sectionId}.coalesced`
    const count = this.sectionCounts.get(sectionId) || 0

    Array.from(this.toasts.keys())
      .filter((id) => id.startsWith(sectionId) && id !== coalescedId)
      .forEach((id) => this.toasts.delete(id))

    const toast: ProgressToast = {
      id: coalescedId,
      sectionId,
      sectionLabel: this.getSectionLabel(sectionId),
      fieldLabel: this.getSectionLabel(sectionId),
      verb,
      status: 'processing',
      timestamp: Date.now(),
      count,
    }
    this.addToast(toast)
  }

  private handleProcessingComplete(event: ProcessingCompleteEvent): void {
    const { id, success } = event
    this.rememberSectionLabel(event.sectionId ?? '', event.sectionLabel)

    const toast = this.toasts.get(id)
    if (toast) {
      toast.status = success ? 'success' : 'error'
      toast.errors = success ? undefined : event.errors
      // Surface the value the moment it lands successfully — even if
      // the pending toast was created without one (e.g. retry path).
      if (event.valuePreview && !toast.valuePreview) toast.valuePreview = event.valuePreview
      if (event.fieldLabel && !toast.fieldLabel) toast.fieldLabel = event.fieldLabel
      if (event.sectionLabel) toast.sectionLabel = event.sectionLabel

      if (success) {
        // Auto-clear successful items after a short delay so the stack
        // doesn't pile up; failures stay until dismissed.
        setTimeout(() => {
          this.removeToast(id)
        }, 2500)
      }
      this.notifyHandlers()
    }

    const sectionId = id.split('.')[0]
    const currentCount = this.sectionCounts.get(sectionId) || 0
    if (currentCount > 0) this.sectionCounts.set(sectionId, currentCount - 1)
  }

  private handleProcessingError(event: ProcessingErrorEvent): void {
    const { id, errors } = event
    const toast = this.toasts.get(id)
    if (toast) {
      toast.status = 'error'
      toast.errors = errors
      this.notifyHandlers()
    }
  }

  private addToast(toast: ProgressToast): void {
    if (this.toasts.size >= this.MAX_CONCURRENT_TOASTS) {
      const oldestId = Array.from(this.toasts.keys())[0]
      this.toasts.delete(oldestId)
    }
    this.toasts.set(toast.id, toast)
    this.notifyHandlers()
  }

  removeToast(id: string): void {
    this.toasts.delete(id)
    this.notifyHandlers()
  }

  private notifyHandlers(): void {
    this.updateHandlers.forEach((handler) => handler(new Map(this.toasts)))
  }

  subscribe(handler: ToastUpdateHandler): () => void {
    this.updateHandlers.add(handler)
    handler(new Map(this.toasts))
    return () => {
      this.updateHandlers.delete(handler)
    }
  }

  getActiveToasts(): Map<string, ProgressToast> {
    return new Map(this.toasts)
  }

  clearAllToasts(): void {
    this.toasts.clear()
    this.sectionCounts.clear()
    this.notifyHandlers()
  }

  cleanup(): void {
    this.toasts.clear()
    this.sectionCounts.clear()
    this.sectionLabels.clear()
    this.updateHandlers.clear()
  }
}

export const progressToastDispatcher = new ProgressToastDispatcher()
