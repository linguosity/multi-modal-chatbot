'use client'

import { useState, useEffect } from 'react'
import { Check, Loader2, AlertCircle, Clock, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/design-system/utils'
import { getClinicalTypographyClass } from '@/lib/design-system/typography-migration'
import type { BaseComponentProps } from '@/lib/design-system/types'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'pending' | 'offline'

export interface AutoSaveIndicatorProps extends BaseComponentProps {
  /** Current save status */
  status: SaveStatus
  /** Last saved timestamp */
  lastSaved?: Date
  /** Error message if save failed */
  error?: string
  /** Whether to show timestamp */
  showTimestamp?: boolean
  /** Whether to show connection status */
  showConnectionStatus?: boolean
  /** Variant for different contexts */
  variant?: 'default' | 'compact' | 'clinical' | 'minimal'
  /** Custom retry handler */
  onRetry?: () => void
  /** Custom dismiss handler */
  onDismiss?: () => void
}

const statusConfig = {
  idle: {
    icon: Clock,
    text: 'Not saved',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  },
  pending: {
    icon: Clock,
    text: 'Changes pending',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  saving: {
    icon: Loader2,
    text: 'Saving...',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    animate: true
  },
  saved: {
    icon: Check,
    text: 'Saved',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  error: {
    icon: AlertCircle,
    text: 'Save failed',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  offline: {
    icon: WifiOff,
    text: 'Offline',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300'
  }
}

export function AutoSaveIndicator({ 
  status, 
  lastSaved, 
  error, 
  showTimestamp = true,
  showConnectionStatus = false,
  variant = 'default',
  onRetry,
  onDismiss,
  className,
  disabled,
  loading,
  'data-testid': testId,
  ...props
}: AutoSaveIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator?.onLine ?? true)
  const config = statusConfig[status]
  const Icon = config.icon

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return 'just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'px-2 py-1 text-xs'
      case 'clinical':
        return 'px-3 py-1.5 text-xs border'
      case 'minimal':
        return 'px-2 py-1 text-xs bg-transparent'
      default:
        return 'px-3 py-1.5 text-xs'
    }
  }

  const getStatusMessage = () => {
    if (!isOnline && showConnectionStatus) {
      return 'Offline - changes will sync when reconnected'
    }
    return error || config.text
  }

  return (
    <div 
      className={cn(
        'flex items-center gap-2 rounded-full font-medium transition-all duration-200',
        getVariantClasses(),
        config.bgColor,
        config.color,
        variant === 'clinical' && config.borderColor,
        disabled && 'opacity-50 cursor-not-allowed',
        loading && 'animate-pulse',
        className
      )}
      title={error || (lastSaved ? `Last saved: ${lastSaved.toLocaleString()}` : undefined)}
      data-testid={testId}
      role="status"
      aria-live="polite"
      aria-label={getStatusMessage()}
      {...props}
    >
      {/* Connection status indicator */}
      {showConnectionStatus && (
        <div className="flex items-center gap-1">
          {isOnline ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-500" />
          )}
        </div>
      )}

      {/* Status icon */}
      <Icon 
        className={cn(
          'h-3 w-3',
          config.animate && 'animate-spin'
        )} 
        aria-hidden="true"
      />
      
      {/* Status text */}
      <span className={getClinicalTypographyClass('helpText')}>
        {getStatusMessage()}
      </span>
      
      {/* Timestamp */}
      {showTimestamp && lastSaved && status === 'saved' && (
        <span className={cn(
          'text-gray-500',
          getClinicalTypographyClass('helpText')
        )}>
          • {formatTimestamp(lastSaved)}
        </span>
      )}
      
      {/* Error actions */}
      {status === 'error' && (
        <div className="flex items-center gap-1 ml-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-red-600 hover:text-red-700 underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
              aria-label="Retry saving"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-xs text-gray-500 hover:text-gray-700 ml-1 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 rounded"
              aria-label="Dismiss error"
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Hook for managing auto-save state
export function useAutoSave() {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | undefined>()
  const [error, setError] = useState<string | undefined>()

  const markPending = () => {
    setStatus('pending')
    setError(undefined)
  }

  const markSaving = () => {
    setStatus('saving')
    setError(undefined)
  }

  const markSaved = () => {
    setStatus('saved')
    setLastSaved(new Date())
    setError(undefined)
  }

  const markError = (errorMessage: string) => {
    setStatus('error')
    setError(errorMessage)
  }

  const reset = () => {
    setStatus('idle')
    setLastSaved(undefined)
    setError(undefined)
  }

  return {
    status,
    lastSaved,
    error,
    markPending,
    markSaving,
    markSaved,
    markError,
    reset
  }
}