'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { progressToastDispatcher, ProgressToast } from '@/lib/progress-toast-dispatcher'
import {
  eventBus,
  ProcessingCompleteEvent,
  dispatchProgressEvent,
  dispatchSseLine,
} from '@/lib/event-bus'
import type { ProgressEvent } from '@/lib/progress-events'
import { ProgressToastContainer } from '@/components/ProgressToast'
import { useRecentUpdates } from '@/lib/context/RecentUpdatesContext'

interface ProgressToastContextType {
  toasts: ProgressToast[]
  /** Dispatch a typed progress event (preferred path). */
  dispatch: (event: ProgressEvent) => void
  /** Parse and dispatch a raw SSE `data:` line. Returns false if non-JSON. */
  dispatchSse: (raw: string) => boolean
  clearAllToasts: () => void
  dismissToast: (id: string) => void
}

const ProgressToastContext = createContext<ProgressToastContextType | undefined>(undefined)

export function ProgressToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ProgressToast[]>([])
  const { addRecentUpdate } = useRecentUpdates()

  useEffect(() => {
    const unsubscribe = progressToastDispatcher.subscribe((toastMap) => {
      setToasts(Array.from(toastMap.values()))
    })

    // Mark inline updates as recent so other UI surfaces can flag them.
    const unsubscribeEvents = eventBus.subscribe<ProcessingCompleteEvent>(
      'processing-complete',
      (evt) => {
        if (!evt?.id) return
        const [sectionId, fieldPath] = String(evt.id).split('.')
        if (evt.success && sectionId && fieldPath) {
          try {
            addRecentUpdate(sectionId, [fieldPath], 'ai_update', 'info')
          } catch {
            /* noop */
          }
        }
      },
    )

    return () => {
      unsubscribe()
      unsubscribeEvents()
      progressToastDispatcher.cleanup()
    }
  }, [addRecentUpdate])

  return (
    <ProgressToastContext.Provider
      value={{
        toasts,
        dispatch: dispatchProgressEvent,
        dispatchSse: dispatchSseLine,
        clearAllToasts: () => progressToastDispatcher.clearAllToasts(),
        dismissToast: (id: string) => progressToastDispatcher.removeToast(id),
      }}
    >
      {children}
      <ProgressToastContainer
        toasts={toasts}
        onDismiss={(id) => progressToastDispatcher.removeToast(id)}
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
