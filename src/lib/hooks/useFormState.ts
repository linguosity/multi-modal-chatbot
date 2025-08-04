import { useState, useCallback } from 'react'

export interface FormState<T> {
  data: T
  loading: boolean
  error: string | null
  isDirty: boolean
}

export interface FormActions<T> {
  updateField: (field: keyof T, value: T[keyof T]) => void
  updateData: (updates: Partial<T>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
  submit: () => void
}

export function useFormState<T extends Record<string, any>>(
  initialState: T
): FormState<T> & FormActions<T> {
  const [data, setData] = useState<T>(initialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const updateField = useCallback((field: keyof T, value: T[keyof T]) => {
    setData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
    // Clear error when user starts typing
    if (error) setError(null)
  }, [error])

  const updateData = useCallback((updates: Partial<T>) => {
    setData(prev => ({ ...prev, ...updates }))
    setIsDirty(true)
    if (error) setError(null)
  }, [error])

  const reset = useCallback(() => {
    setData(initialState)
    setLoading(false)
    setError(null)
    setIsDirty(false)
  }, [initialState])

  const submit = useCallback(() => {
    setLoading(true)
    setError(null)
  }, [])

  return {
    data,
    loading,
    error,
    isDirty,
    updateField,
    updateData,
    setLoading,
    setError,
    reset,
    submit
  }
}