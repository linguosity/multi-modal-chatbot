import { useState, useEffect, useRef, useCallback } from 'react'

interface UseAutosaveOptions {
  data: any
  onSave: (data: any) => Promise<void>
  debounceMs?: number
  enabled?: boolean
  maxWaitMs?: number // Maximum time to wait before forcing a save
}

export function useAutosave({
  data,
  onSave,
  debounceMs = 10000, // Default to 10 seconds
  enabled = true,
  maxWaitMs = 60000 // Force save after 1 minute max
}: UseAutosaveOptions) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dataRef = useRef(data)
  const lastSavedDataRef = useRef(data)

  // Update the ref when data changes
  useEffect(() => {
    dataRef.current = data
    
    // Check if data has actually changed
    const hasChanged = JSON.stringify(data) !== JSON.stringify(lastSavedDataRef.current)
    setHasUnsavedChanges(hasChanged)
  }, [data])

  const performSave = useCallback(async () => {
    try {
      setIsSaving(true)
      await onSave(dataRef.current)
      setLastSaved(new Date())
      setError(null)
      setHasUnsavedChanges(false)
      lastSavedDataRef.current = dataRef.current
    } catch (err) {
      console.error('Autosave failed:', err)
      setError(err instanceof Error ? err : new Error('Autosave failed'))
    } finally {
      setIsSaving(false)
    }
  }, [onSave])

  // Setup autosave
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new debounced timeout
    timeoutRef.current = setTimeout(performSave, debounceMs)

    // Set max wait timeout if not already set
    if (!maxWaitTimeoutRef.current) {
      maxWaitTimeoutRef.current = setTimeout(() => {
        console.log('Force saving due to max wait time reached')
        performSave()
      }, maxWaitMs)
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, performSave, debounceMs, enabled, hasUnsavedChanges, maxWaitMs])

  // Clear max wait timeout when save completes
  useEffect(() => {
    if (!hasUnsavedChanges && maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current)
      maxWaitTimeoutRef.current = null
    }
  }, [hasUnsavedChanges])

  // Force save function
  const forceSave = useCallback(async () => {
    // Clear all timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current)
      maxWaitTimeoutRef.current = null
    }

    await performSave()
  }, [performSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (maxWaitTimeoutRef.current) clearTimeout(maxWaitTimeoutRef.current)
    }
  }, [])

  return {
    isSaving,
    lastSaved,
    error,
    forceSave,
    hasUnsavedChanges
  }
}