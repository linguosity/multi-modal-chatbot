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

function formatHeadline(toast: ProgressToastType): string {
  const { verb, fieldLabel, status, count } = toast
  if (count && count > 1) {
    return status === 'processing'
      ? `${verb} ${count} fields…`
      : `Updated ${count} fields`
  }
  return status === 'processing' ? `${verb} ${fieldLabel}…` : fieldLabel
}

export default function ProgressToast({ toast, onDismiss }: ProgressToastProps) {
  const headline = formatHeadline(toast)
  const statusColor = getStatusColor(toast.status)
  const statusIcon = getStatusIcon(toast.status)

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border shadow-sm transition-all duration-200 ${statusColor}`}>
      <div className="flex-shrink-0 pt-0.5">{statusIcon}</div>

      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium truncate">
          {toast.sectionLabel}
        </p>
        <p className="text-sm font-medium text-gray-900 truncate">{headline}</p>
        {toast.valuePreview && toast.status !== 'processing' && (
          <p className="text-xs text-gray-700 mt-0.5 truncate">→ {toast.valuePreview}</p>
        )}
        {toast.errors && toast.errors.length > 0 && (
          <p className="text-xs text-red-600 mt-1 truncate">{toast.errors[0]}</p>
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

interface ProgressPanelProps {
  toasts: ProgressToastType[]
  onDismiss?: (id: string) => void
  className?: string
}

export function ProgressToastContainer({ toasts, onDismiss, className = '' }: ProgressPanelProps) {
  const [open, setOpen] = useState(true)
  if (toasts.length === 0) return null
  const processing = toasts.filter((t) => t.status === 'processing')
  const failed = toasts.filter((t) => t.status === 'error' || t.status === 'timeout')

  return (
    <div
      className={`fixed top-16 right-4 z-50 max-w-sm ${className}`}
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="rounded-lg border border-gray-200 bg-white shadow-md">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm">
            {processing.length > 0 ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            ) : failed.length > 0 ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            <span className="font-medium text-gray-900">Field updates</span>
            <span className="text-xs text-gray-500">
              {toasts.length} {toasts.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {open && (
          <div className="max-h-96 overflow-auto p-2 space-y-2">
            {toasts.map((toast) => (
              <ProgressToast key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
