'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { progressToastDispatcher, ProgressToast } from '@/lib/progress-toast-dispatcher'
import { logProcessor, eventBus, ProcessingCompleteEvent } from '@/lib/event-bus'
import { ProgressToastContainer } from '@/components/ProgressToast'
import { useRecentUpdates } from '@/lib/context/RecentUpdatesContext'

interface ProgressToastContextType {
  toasts: ProgressToast[]
  processLogLine: (logLine: string) => void
  clearAllToasts: () => void
  dismissToast: (id: string) => void
}

const ProgressToastContext = createContext<ProgressToastContextType | undefined>(undefined)

export function ProgressToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ProgressToast[]>([])
  const { addRecentUpdate } = useRecentUpdates()

  useEffect(() => {
    // Subscribe to toast updates
    const unsubscribe = progressToastDispatcher.subscribe((toastMap) => {
      setToasts(Array.from(toastMap.values()))
    })

    // Also listen for processing complete events to mark inline updates
    const unsubscribeEvents = eventBus.subscribe<ProcessingCompleteEvent>('processing-complete', (evt) => {
      if (!evt?.id) return
      const [sectionId, fieldPath] = String(evt.id).split('.')
      if (evt.success && sectionId && fieldPath) {
        try { addRecentUpdate(sectionId, [fieldPath], 'ai_update', 'info') } catch {}
      }
    })

    return () => {
      unsubscribe()
      unsubscribeEvents()
      // Cleanup on unmount
      progressToastDispatcher.cleanup()
      logProcessor.cleanup()
    }
  }, [])

  const processLogLine = (logLine: string) => {
    logProcessor.processLogLine(logLine)
  }

  const clearAllToasts = () => {
    progressToastDispatcher.clearAllToasts()
  }

  const dismissToast = (id: string) => {
    // Remove specific toast using the dispatcher's method
    progressToastDispatcher.removeToast(id)
  }

  return (
    <ProgressToastContext.Provider value={{
      toasts,
      processLogLine,
      clearAllToasts,
      dismissToast
    }}>
      {children}
      
      {/* Render toast container */}
      <ProgressToastContainer 
        toasts={toasts}
        onDismiss={dismissToast}
      />
    </ProgressToastContext.Provider>
  )
}

export function useProgressToasts() {
  const context = useContext(ProgressToastContext)
  if (context === undefined) {
    throw new Error('useProgressToasts must be used within a ProgressToastProvider')
  }
  return context
}

/**
 * Hook for simulating log processing (for testing)
 */
export function useLogSimulator() {
  const { processLogLine } = useProgressToasts()

  const simulateProcessing = (sectionId: string, fields: string[]) => {
    fields.forEach((field, index) => {
      // Simulate processing start
      setTimeout(() => {
        processLogLine(`📝 Processing update: ${sectionId}.${field} ... replace`)
      }, index * 500)

      // Simulate processing complete
      setTimeout(() => {
        const success = Math.random() > 0.1 // 90% success rate
        if (success) {
          processLogLine(`✅ Updated ${sectionId}.${field}`)
        } else {
          processLogLine(`❌ Failed to update ${sectionId}.${field}`)
        }
      }, (index * 500) + 2000 + Math.random() * 3000)
    })
  }

  const simulateError = (sectionId: string, field: string) => {
    processLogLine(`📝 Processing update: ${sectionId}.${field} ... replace`)
    setTimeout(() => {
      processLogLine(`❌ Failed to update ${sectionId}.${field}`)
    }, 2000)
  }

  const simulateTimeout = (sectionId: string, field: string) => {
    processLogLine(`📝 Processing update: ${sectionId}.${field} ... replace`)
    // Don't send completion - will timeout after 30s
  }

  return {
    simulateProcessing,
    simulateError,
    simulateTimeout
  }
}
