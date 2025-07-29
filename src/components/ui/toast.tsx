'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { X, Check, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Toast {
  id: string
  title?: string
  description: string
  type?: 'success' | 'error' | 'info' | 'warning' | 'ai_update' | 'ai_processing'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  // Enhanced AI processing data
  processingData?: {
    summary?: string
    updatedSections?: string[]
    processedFiles?: Array<{
      name: string
      type: string
      size: number
    }>
    fieldUpdates?: string[]
    confidence?: number
  }
  persistent?: boolean // Don't auto-dismiss
}

interface ToastContextType {
  toasts: Toast[]
  toast: (toast: Omit<Toast, 'id'>) => string
  dismiss: (toastId: string) => void
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      id,
      duration: 4000,
      type: 'info',
      ...toast,
    }

    setToasts(prev => [...prev, newToast])

    // Auto-dismiss after duration (unless persistent)
    if (newToast.duration && newToast.duration > 0 && !newToast.persistent) {
      setTimeout(() => {
        dismiss(id)
      }, newToast.duration)
    }

    return id
  }, [])

  const dismiss = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId))
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastViewport() {
  const { toasts } = useToast()

  return (
    <div
      className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[500px] space-y-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast, index) => (
        <ToastComponent key={toast.id} toast={toast} index={index} />
      ))}
    </div>
  )
}

// Export ToastContainer for backward compatibility with existing ToastContext
export function ToastContainer({ toasts, onClose }: { toasts: Toast[], onClose: (id: string) => void }) {
  return (
    <div
      className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[500px] space-y-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast, index) => (
        <ToastComponent key={toast.id} toast={toast} onClose={onClose} index={index} />
      ))}
    </div>
  )
}

function ToastComponent({ toast, onClose, index = 0 }: { toast: Toast, onClose?: (id: string) => void, index?: number }) {
  const { dismiss } = useToast()
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    // Trigger entrance animation with stagger
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => {
      if (onClose) {
        onClose(toast.id)
      } else {
        dismiss(toast.id)
      }
    }, 150)
  }

  const icons = {
    success: Check,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info,
    ai_update: Info,
    ai_processing: Info,
  }

  const Icon = icons[toast.type || 'info']

  const isProcessingToast = toast.type === 'ai_processing' && toast.processingData

  return (
    <div
      className={cn(
        "group pointer-events-auto relative flex w-full flex-col overflow-hidden rounded-md border shadow-lg transition-all duration-300 ease-out",
        "transform-gpu", // Hardware acceleration for smooth animations
        {
          "border-green-200 bg-green-50 text-green-900": toast.type === 'success',
          "border-red-200 bg-red-50 text-red-900": toast.type === 'error',
          "border-yellow-200 bg-yellow-50 text-yellow-900": toast.type === 'warning',
          "border-blue-200 bg-blue-50 text-blue-900": toast.type === 'info',
          "border-purple-200 bg-purple-50 text-purple-900": toast.type === 'ai_update',
          "border-indigo-200 bg-indigo-50 text-indigo-900": toast.type === 'ai_processing',
        },
        // Stacking animation
        isVisible 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95',
        // Enhanced width for processing toasts
        isProcessingToast ? 'max-w-md' : 'max-w-sm'
      )}
      style={{
        // Stagger animation based on toast index
        transitionDelay: `${Math.min(index * 50, 200)}ms`
      }}
    >
      {/* Main Content */}
      <div className="flex items-start justify-between space-x-2 p-4">
        <div className="flex items-start space-x-2 flex-1">
          <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="grid gap-1 flex-1">
            {toast.title && (
              <div className="text-sm font-semibold">{toast.title}</div>
            )}
            <div className="text-sm opacity-90">{toast.description}</div>
            
            {/* Processing Summary Preview */}
            {isProcessingToast && toast.processingData?.summary && (
              <div className="mt-2">
                <div 
                  className={cn(
                    "text-xs opacity-75 cursor-pointer transition-all",
                    isExpanded ? "" : "overflow-hidden"
                  )}
                  style={!isExpanded ? {
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const
                  } : {}}
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {toast.processingData.summary}
                </div>
                {toast.processingData.summary.length > 100 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 mt-1"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>

      {/* Expanded Processing Details */}
      {isProcessingToast && isExpanded && toast.processingData && (
        <div className="border-t border-indigo-200 bg-indigo-25 p-3 space-y-2">
          {toast.processingData.processedFiles && toast.processingData.processedFiles.length > 0 && (
            <div>
              <div className="text-xs font-medium text-indigo-800 mb-1">Processed Files:</div>
              <div className="space-y-1">
                {toast.processingData.processedFiles.map((file, index) => (
                  <div key={index} className="text-xs text-indigo-700 flex items-center justify-between">
                    <span>{file.name}</span>
                    <span className="text-indigo-500">{(file.size / 1024).toFixed(1)}KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {toast.processingData.updatedSections && toast.processingData.updatedSections.length > 0 && (
            <div>
              <div className="text-xs font-medium text-indigo-800 mb-1">Updated Sections:</div>
              <div className="flex flex-wrap gap-1">
                {toast.processingData.updatedSections.map((section, index) => (
                  <span key={index} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                    {section}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {toast.processingData.fieldUpdates && toast.processingData.fieldUpdates.length > 0 && (
            <div>
              <div className="text-xs font-medium text-indigo-800 mb-1">Field Updates:</div>
              <div className="text-xs text-indigo-700">
                {toast.processingData.fieldUpdates.slice(0, 5).join(', ')}
                {toast.processingData.fieldUpdates.length > 5 && ` +${toast.processingData.fieldUpdates.length - 5} more`}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}