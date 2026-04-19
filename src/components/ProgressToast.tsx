'use client'

import React, { useState } from 'react'
import { CheckCircle, AlertCircle, Clock, Loader2, X, ChevronDown, ChevronRight } from 'lucide-react'
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
 * Compact panel that groups multiple updates into a single collapsible UI
 */
interface ProgressPanelProps {
  toasts: ProgressToastType[]
  onDismiss?: (id: string) => void
  className?: string
}

export function ProgressToastContainer({ toasts, onDismiss, className = '' }: ProgressPanelProps) {
  if (toasts.length === 0) return null
  const [open, setOpen] = useState(true)
  const processing = toasts.filter(t => t.status === 'processing')
  const succeeded = toasts.filter(t => t.status === 'success')
  const failed = toasts.filter(t => t.status === 'error' || t.status === 'timeout')

  return (
    <div className={`fixed top-16 right-4 z-50 max-w-sm ${className}`}>
      <div className="rounded-lg border border-gray-200 bg-white shadow-md">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            {processing.length > 0 ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            ) : failed.length > 0 ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            <span className="font-medium text-gray-900">Updates</span>
            <span className="text-xs text-gray-500">{toasts.length} item{toasts.length !== 1 ? 's' : ''}</span>
          </div>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {open && (
          <div className="max-h-72 overflow-auto divide-y divide-gray-100">
            {toasts.map((toast) => (
              <div key={toast.id} className="flex items-start gap-2 px-3 py-2">
                <div className="pt-0.5">{getStatusIcon(toast.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 truncate">{formatToastMessage(toast)}</div>
                  {toast.errors?.length ? (
                    <div className="text-xs text-red-600 mt-0.5 truncate">{toast.errors[0]}</div>
                  ) : null}
                </div>
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(toast.id)}
                    className="p-1 rounded hover:bg-gray-50"
                    aria-label="Dismiss"
                  >
                    <X className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
