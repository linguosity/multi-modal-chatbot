'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { LoadingState } from '@/components/ui/loading-state'

export interface LoadingOperation {
  id: string
  message: string
  progress?: number
  canCancel?: boolean
  onCancel?: () => void
}

export interface LoadingContextValue {
  /** Currently active loading operations */
  operations: LoadingOperation[]
  /** Whether any operation is loading */
  isLoading: boolean
  /** Start a loading operation */
  startLoading: (id: string, message: string, options?: Partial<LoadingOperation>) => void
  /** Update a loading operation */
  updateLoading: (id: string, updates: Partial<LoadingOperation>) => void
  /** Stop a loading operation */
  stopLoading: (id: string) => void
  /** Stop all loading operations */
  stopAllLoading: () => void
  /** Get specific loading operation */
  getOperation: (id: string) => LoadingOperation | undefined
}

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined)

export interface LoadingProviderProps {
  children: React.ReactNode
  /** Whether to show global loading overlay */
  showGlobalOverlay?: boolean
  /** Maximum number of operations to show in overlay */
  maxOverlayOperations?: number
}

export function LoadingProvider({ 
  children, 
  showGlobalOverlay = true,
  maxOverlayOperations = 3
}: LoadingProviderProps) {
  const [operations, setOperations] = useState<LoadingOperation[]>([])

  const startLoading = useCallback((
    id: string, 
    message: string, 
    options: Partial<LoadingOperation> = {}
  ) => {
    setOperations(prev => {
      // Remove existing operation with same id
      const filtered = prev.filter(op => op.id !== id)
      
      // Add new operation
      return [...filtered, {
        id,
        message,
        progress: 0,
        canCancel: false,
        ...options
      }]
    })
  }, [])

  const updateLoading = useCallback((id: string, updates: Partial<LoadingOperation>) => {
    setOperations(prev => 
      prev.map(op => 
        op.id === id ? { ...op, ...updates } : op
      )
    )
  }, [])

  const stopLoading = useCallback((id: string) => {
    setOperations(prev => prev.filter(op => op.id !== id))
  }, [])

  const stopAllLoading = useCallback(() => {
    setOperations([])
  }, [])

  const getOperation = useCallback((id: string) => {
    return operations.find(op => op.id === id)
  }, [operations])

  const isLoading = operations.length > 0

  const value: LoadingContextValue = {
    operations,
    isLoading,
    startLoading,
    updateLoading,
    stopLoading,
    stopAllLoading,
    getOperation
  }

  return (
    <LoadingContext.Provider value={value}>
      {children}
      
      {/* Global loading overlay */}
      {showGlobalOverlay && isLoading && (
        <GlobalLoadingOverlay 
          operations={operations.slice(0, maxOverlayOperations)}
        />
      )}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

// Global loading overlay component
interface GlobalLoadingOverlayProps {
  operations: LoadingOperation[]
}

function GlobalLoadingOverlay({ operations }: GlobalLoadingOverlayProps) {
  if (operations.length === 0) return null

  const primaryOperation = operations[0]
  const hasMultiple = operations.length > 1

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <div className="space-y-4">
          {/* Primary operation */}
          <LoadingState
            state="loading"
            message={primaryOperation.message}
            size="lg"
            variant="clinical"
          />
          
          {/* Progress bar if available */}
          {primaryOperation.progress !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${primaryOperation.progress}%` }}
              />
            </div>
          )}
          
          {/* Additional operations */}
          {hasMultiple && (
            <div className="text-sm text-gray-600 space-y-1">
              <div className="font-medium">
                Also running ({operations.length - 1} more):
              </div>
              {operations.slice(1).map(op => (
                <div key={op.id} className="text-xs text-gray-500">
                  • {op.message}
                </div>
              ))}
            </div>
          )}
          
          {/* Cancel button */}
          {primaryOperation.canCancel && primaryOperation.onCancel && (
            <button
              onClick={primaryOperation.onCancel}
              className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Hook for managing a specific loading operation
export function useLoadingOperation(id: string) {
  const { startLoading, updateLoading, stopLoading, getOperation } = useLoading()
  
  const start = useCallback((message: string, options?: Partial<LoadingOperation>) => {
    startLoading(id, message, options)
  }, [id, startLoading])
  
  const update = useCallback((updates: Partial<LoadingOperation>) => {
    updateLoading(id, updates)
  }, [id, updateLoading])
  
  const stop = useCallback(() => {
    stopLoading(id)
  }, [id, stopLoading])
  
  const operation = getOperation(id)
  
  return {
    start,
    update,
    stop,
    operation,
    isActive: !!operation
  }
}

// Hook for async operations with loading state
export function useAsyncWithLoading<T>(
  operationId: string,
  asyncFunction: () => Promise<T>,
  options: {
    loadingMessage?: string
    successMessage?: string
    errorMessage?: string
    showProgress?: boolean
  } = {}
) {
  const {
    loadingMessage = 'Loading...',
    successMessage = 'Success!',
    errorMessage = 'Operation failed',
    showProgress = false
  } = options

  const { start, update, stop } = useLoadingOperation(operationId)
  const [result, setResult] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async () => {
    try {
      start(loadingMessage, { progress: showProgress ? 0 : undefined })
      setError(null)
      
      const data = await asyncFunction()
      
      if (showProgress) {
        update({ progress: 100 })
        // Brief delay to show completion
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      setResult(data)
      stop()
      
      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      stop()
      throw error
    }
  }, [asyncFunction, start, update, stop, loadingMessage, showProgress])

  return {
    execute,
    result,
    error,
    reset: () => {
      setResult(null)
      setError(null)
      stop()
    }
  }
}