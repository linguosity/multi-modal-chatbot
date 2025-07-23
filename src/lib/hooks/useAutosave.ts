import { useState, useEffect, useRef } from 'react'

interface UseAutosaveOptions {
  data: any
  onSave: (data: any) => Promise<void>
  debounceMs?: number
  enabled?: boolean
}

export function useAutosave({
  data,
  onSave,
  debounceMs = 1000,
  enabled = true
}: UseAutosaveOptions) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dataRef = useRef(data)

  // Update the ref when data changes
  useEffect(() => {
    dataRef.current = data
  }, [data])

  // Setup autosave
  useEffect(() => {
    if (!enabled) return

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true)
        await onSave(dataRef.current)
        setLastSaved(new Date())
        setError(null)
      } catch (err) {
        console.error('Autosave failed:', err)
        setError(err instanceof Error ? err : new Error('Autosave failed'))
      } finally {
        setIsSaving(false)
      }
    }, debounceMs)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, onSave, debounceMs, enabled])

  // Force save function
  const forceSave = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    try {
      setIsSaving(true)
      await onSave(dataRef.current)
      setLastSaved(new Date())
      setError(null)
    } catch (err) {
      console.error('Force save failed:', err)
      setError(err instanceof Error ? err : new Error('Force save failed'))
    } finally {
      setIsSaving(false)
    }
  }

  return {
    isSaving,
    lastSaved,
    error,
    forceSave
  }
}