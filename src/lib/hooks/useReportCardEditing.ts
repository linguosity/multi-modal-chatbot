'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface PendingEdit {
  sectionId: string
  field: string
  value: string
  timestamp: number
}

interface UseReportCardEditingOptions {
  /** Debounce delay in ms before triggering save (default: 2000) */
  debounceMs?: number
  /** Called when the hook wants to persist changes */
  onSave: (edits: Map<string, Record<string, string>>) => Promise<void>
}

interface UseReportCardEditingReturn {
  isDirty: boolean
  saveStatus: SaveStatus
  /** Register a field edit. Starts the debounce timer. */
  updateField: (sectionId: string, field: string, value: string) => void
  /** Force an immediate save of all pending edits */
  save: () => Promise<void>
  /** Discard all pending edits */
  revert: () => void
}

/**
 * Manages auto-save state for WYSIWYG report card editing.
 *
 * - Tracks dirty fields per section
 * - Debounced save (2s after last edit by default)
 * - Returns save status for UI feedback
 */
export function useReportCardEditing({
  debounceMs = 2000,
  onSave,
}: UseReportCardEditingOptions): UseReportCardEditingReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  // Map<sectionId, Record<field, value>>
  const pendingEdits = useRef<Map<string, Record<string, string>>>(new Map())
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  const isDirty = pendingEdits.current.size > 0

  const doSave = useCallback(async () => {
    if (pendingEdits.current.size === 0) return

    // Snapshot and clear pending edits
    const snapshot = new Map(pendingEdits.current)
    pendingEdits.current.clear()

    if (!isMounted.current) return
    setSaveStatus('saving')

    try {
      await onSave(snapshot)
      if (isMounted.current) {
        setSaveStatus('saved')
        // Reset to idle after 3s
        setTimeout(() => {
          if (isMounted.current) setSaveStatus('idle')
        }, 3000)
      }
    } catch (err) {
      // Restore the edits that failed so they can be retried
      snapshot.forEach((fields, sectionId) => {
        const existing = pendingEdits.current.get(sectionId) || {}
        pendingEdits.current.set(sectionId, { ...fields, ...existing })
      })
      if (isMounted.current) setSaveStatus('error')
    }
  }, [onSave])

  const updateField = useCallback(
    (sectionId: string, field: string, value: string) => {
      const existing = pendingEdits.current.get(sectionId) || {}
      pendingEdits.current.set(sectionId, { ...existing, [field]: value })

      // Reset debounce timer
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(doSave, debounceMs)
    },
    [debounceMs, doSave]
  )

  const save = useCallback(async () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    await doSave()
  }, [doSave])

  const revert = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    pendingEdits.current.clear()
    setSaveStatus('idle')
  }, [])

  return {
    isDirty,
    saveStatus,
    updateField,
    save,
    revert,
  }
}
