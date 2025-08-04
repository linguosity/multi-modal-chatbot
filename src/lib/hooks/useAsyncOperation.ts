import { useState, useCallback, useRef } from 'react'

export type AsyncOperationState = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncOperationOptions<T> {
  /** Initial data */
  initialData?: T
  /** Whether to reset to idle after success */
  resetOnSuccess?: boolean
  /** Reset delay in milliseconds */
  resetDelay?: number
  /** Whether to retry on error */
  autoRetry?: boolean
  /** Number of retry attempts */
  maxRetries?: number
  /** Retry delay in milliseconds */
  retryDelay?: number
  /** Success callback */
  onSuccess?: (data: T) => void
  /** Error callback */
  onError?: (error: Error) => void
  /** Loading callback */
  onLoading?: () => void
}

export interface AsyncOperationResult<T> {
  /** Current state */
  state: AsyncOperationState
  /** Current data */
  data: T | null
  /** Current error */
  error: Error | null
  /** Whether operation is loading */
  isLoading: boolean
  /** Whether operation succeeded */
  isSuccess: boolean
  /** Whether operation failed */
  isError: boolean
  /** Whether operation is idle */
  isIdle: boolean
  /** Execute the async operation */
  execute: (operation: () => Promise<T>) => Promise<T | null>
  /** Reset to idle state */
  reset: () => void
  /** Retry last operation */
  retry: () => Promise<T | null>
  /** Set data manually */
  setData: (data: T) => void
  /** Set error manually */
  setError: (error: Error) => void
}

export function useAsyncOperation<T = any>(
  options: AsyncOperationOptions<T> = {}
): AsyncOperationResult<T> {
  const {
    initialData = null,
    resetOnSuccess = false,
    resetDelay = 2000,
    autoRetry = false,
    maxRetries = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    onLoading
  } = options

  const [state, setState] = useState<AsyncOperationState>('idle')
  const [data, setData] = useState<T | null>(initialData)
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  
  const lastOperationRef = useRef<(() => Promise<T>) | null>(null)
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const reset = useCallback(() => {
    setState('idle')
    setData(initialData)
    setError(null)
    setRetryCount(0)
    lastOperationRef.current = null
    
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }
  }, [initialData])

  const executeWithRetry = useCallback(
    async (operation: () => Promise<T>, attempt: number = 0): Promise<T | null> => {
      try {
        setState('loading')
        setError(null)
        onLoading?.()

        const result = await operation()
        
        setState('success')
        setData(result)
        setRetryCount(0)
        onSuccess?.(result)

        // Auto-reset after success if configured
        if (resetOnSuccess) {
          resetTimeoutRef.current = setTimeout(reset, resetDelay)
        }

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        
        // Retry logic
        if (autoRetry && attempt < maxRetries) {
          setRetryCount(attempt + 1)
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          
          return executeWithRetry(operation, attempt + 1)
        }
        
        setState('error')
        setError(error)
        setData(null)
        onError?.(error)
        
        return null
      }
    },
    [autoRetry, maxRetries, retryDelay, resetOnSuccess, resetDelay, onSuccess, onError, onLoading, reset]
  )

  const execute = useCallback(
    async (operation: () => Promise<T>): Promise<T | null> => {
      lastOperationRef.current = operation
      return executeWithRetry(operation)
    },
    [executeWithRetry]
  )

  const retry = useCallback(async (): Promise<T | null> => {
    if (lastOperationRef.current) {
      return execute(lastOperationRef.current)
    }
    return null
  }, [execute])

  const setDataManually = useCallback((newData: T) => {
    setData(newData)
    setState('success')
    setError(null)
  }, [])

  const setErrorManually = useCallback((newError: Error) => {
    setError(newError)
    setState('error')
    setData(null)
  }, [])

  return {
    state,
    data,
    error,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    isIdle: state === 'idle',
    execute,
    reset,
    retry,
    setData: setDataManually,
    setError: setErrorManually
  }
}

// Specialized hook for auto-save operations
export interface UseAutoSaveOptions<T> {
  /** Save function */
  saveFunction: (data: T) => Promise<void>
  /** Auto-save delay in milliseconds */
  delay?: number
  /** Whether auto-save is enabled */
  enabled?: boolean
  /** Success callback */
  onSuccess?: () => void
  /** Error callback */
  onError?: (error: Error) => void
}

export function useAutoSave<T>(options: UseAutoSaveOptions<T>) {
  const {
    saveFunction,
    delay = 2000,
    enabled = true,
    onSuccess,
    onError
  } = options

  const asyncOp = useAsyncOperation<void>({
    onSuccess,
    onError,
    autoRetry: true,
    maxRetries: 3,
    retryDelay: 1000
  })

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastDataRef = useRef<T | null>(null)

  const triggerSave = useCallback(
    (data: T) => {
      if (!enabled || JSON.stringify(data) === JSON.stringify(lastDataRef.current)) {
        return
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        asyncOp.execute(() => saveFunction(data))
        lastDataRef.current = data
      }, delay)
    },
    [enabled, delay, saveFunction, asyncOp]
  )

  const saveImmediately = useCallback(
    (data: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      return asyncOp.execute(() => saveFunction(data))
    },
    [saveFunction, asyncOp]
  )

  const cancelSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    ...asyncOp,
    triggerSave,
    saveImmediately,
    cancelSave,
    isSaving: asyncOp.isLoading,
    saveError: asyncOp.error,
    lastSaveSuccessful: asyncOp.isSuccess
  }
}