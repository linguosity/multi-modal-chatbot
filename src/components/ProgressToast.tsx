'use client'

import React from 'react'
import { CheckCircle, AlertCircle, Clock, Loader2, X } from 'lucide-react'
import { ProgressToast as ProgressToastType } from '@/lib/progress-toast-dispatcher'

interface ProgressToastProps {
  toast: ProgressToastType
  onDismiss?: (id: string) => void
}

function getStatusIcon(status: ProgressToastType['status']) {
  switch (status) {
    case 'processing':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />
    case 'timeout':
      return <Clock className="h-4 w-4 text-orange-500" />
    default:
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
  }
}

function getStatusColor(status: ProgressToastType['status']) {
  switch (status) {
    case 'processing':
      return 'border-blue-200 bg-blue-50'
    case 'success':
      return 'border-green-200 bg-green-50'
    case 'error':
      return 'border-red-200 bg-red-50'
    case 'timeout':
      return 'border-orange-200 bg-orange-50'
    default:
      return 'border-blue-200 bg-blue-50'
  }
}

function formatToastMessage(toast: ProgressToastType): string {
  const { verb, fieldLabel, status, count } = toast
  
  if (count && count > 1) {
    // Coalesced toast
    return status === 'processing' 
      ? `${verb} ${fieldLabel} (${count} fields)...`
      : `Updated ${fieldLabel} (${count} fields)`
  }
  
  // Individual toast
  return status === 'processing' 
    ? `${verb} ${fieldLabel}...`
    : `Updated ${fieldLabel}`
}

export default function ProgressToast({ toast, onDismiss }: ProgressToastProps) {
  const message = formatToastMessage(toast)
  const statusColor = getStatusColor(toast.status)
  const statusIcon = getStatusIcon(toast.status)
  
  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-lg border shadow-sm transition-all duration-200
      ${statusColor}
    `}>
      <div className="flex-shrink-0">
        {statusIcon}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {message}
        </p>
        
        {toast.errors && toast.errors.length > 0 && (
          <p className="text-xs text-red-600 mt-1">
            {toast.errors[0]} {/* Show first error */}
          </p>
        )}
      </div>
      
      {onDismiss && (
        <button
          onClick={() => onDismiss(toast.id)}
          className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3 text-gray-400" />
        </button>
      )}
    </div>
  )
}

/**
 * Container component for displaying multiple progress toasts
 */
interface ProgressToastContainerProps {
  toasts: ProgressToastType[]
  onDismiss?: (id: string) => void
  className?: string
}

export function ProgressToastContainer({ 
  toasts, 
  onDismiss, 
  className = '' 
}: ProgressToastContainerProps) {
  if (toasts.length === 0) return null
  
  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 max-w-sm ${className}`}>
      {toasts.map((toast) => (
        <ProgressToast
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}