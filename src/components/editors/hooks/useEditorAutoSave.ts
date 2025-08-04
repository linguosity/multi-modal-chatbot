import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseEditorAutoSaveOptions {
  /** Auto-save delay in milliseconds */
  delay?: number
  /** Whether auto-save is enabled */
  enabled?: boolean
  /** Auto-save handler */
  onAutoSave: (content: string) => Promise<void>
  /** Error handler */
  onError?: (error: Error) => void
}

export interface UseEditorAutoSaveReturn {
  /** Whether auto-save is currently in progress */
  isAutoSaving: boolean
  /** Last auto-save timestamp */
  lastSaved: Date | null
  /** Trigger auto-save manually */
  triggerAutoSave: (content: string) => void
  /** Cancel pending auto-save */
  cancelAutoSave: () => void
}

export function useEditorAutoSave({
  delay = 2000,
  enabled = true,
  onAutoSave,
  onError
}: UseEditorAutoSaveOptions): UseEditorAutoSaveReturn {
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastContentRef = useRef<string>('')

  // Cancel any pending auto-save
  const cancelAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Trigger auto-save
  const triggerAutoSave = useCallback(
    (content: string) => {
      if (!enabled || content === lastContentRef.current) {
        return
      }

      // Cancel any pending auto-save
      cancelAutoSave()

      // Set up new auto-save
      timeoutRef.current = setTimeout(async () => {
        if (!enabled) return

        setIsAutoSaving(true)
        try {
          await onAutoSave(content)
          setLastSaved(new Date())
          lastContentRef.current = content
        } catch (error) {
          console.error('Auto-save failed:', error)
          onError?.(error as Error)
        } finally {
          setIsAutoSaving(false)
          timeoutRef.current = null
        }
      }, delay)
    },
    [enabled, delay, onAutoSave, onError, cancelAutoSave]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAutoSave()
    }
  }, [cancelAutoSave])

  return {
    isAutoSaving,
    lastSaved,
    triggerAutoSave,
    cancelAutoSave
  }
}