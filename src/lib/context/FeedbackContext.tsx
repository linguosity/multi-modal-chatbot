'use client'

import React, { createContext, useContext, useCallback } from 'react'
import { useRecentUpdates } from './RecentUpdatesContext'
import { useToast } from './ToastContext'

interface FeedbackOptions {
  // Toast options
  showToast?: boolean
  toastTitle?: string
  toastMessage?: string
  toastType?: 'success' | 'error' | 'info' | 'warning'
  toastAction?: {
    label: string
    onClick: () => void
  }
  
  // Field highlight options
  highlightFields?: boolean
  
  // Badge options
  updateBadges?: boolean
}

interface FeedbackContextType {
  // Unified feedback for field updates
  notifyFieldUpdate: (
    sectionId: string, 
    fieldPaths: string[], 
    options?: FeedbackOptions
  ) => void
  
  // Unified feedback for section updates
  notifySectionUpdate: (
    sectionId: string, 
    fieldPaths: string[], 
    options?: FeedbackOptions
  ) => void
  
  // Unified feedback for save operations
  notifySave: (
    entityType: string,
    entityName?: string,
    options?: FeedbackOptions & { undoAction?: () => void }
  ) => void
  
  // Unified feedback for AI operations
  notifyAIUpdate: (
    sectionId: string,
    fieldPaths: string[],
    options?: FeedbackOptions
  ) => void
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined)

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { addRecentUpdate } = useRecentUpdates()
  const { showToast } = useToast()

  const notifyFieldUpdate = useCallback((
    sectionId: string, 
    fieldPaths: string[], 
    options: FeedbackOptions = {}
  ) => {
    const {
      showToast = false,
      toastTitle,
      toastMessage,
      toastType = 'info',
      toastAction,
      highlightFields = true,
      updateBadges = true
    } = options

    // 1. Field highlighting (inline micro-interaction)
    if (highlightFields) {
      addRecentUpdate(sectionId, fieldPaths, 'user_edit')
    }

    // 2. Toast notification (ephemeral confirmation)
    if (showToast && toastMessage) {
      showToast({
        title: toastTitle,
        description: toastMessage,
        type: toastType,
        duration: 4000
      })
    }

    // Note: Badges are handled by individual components using the RecentUpdatesContext
  }, [addRecentUpdate, showToast])

  const notifySectionUpdate = useCallback((
    sectionId: string, 
    fieldPaths: string[], 
    options: FeedbackOptions = {}
  ) => {
    const {
      showToast = true,
      toastTitle = 'Section Updated',
      toastMessage = 'Your changes have been saved',
      toastType = 'success',
      highlightFields = true
    } = options

    notifyFieldUpdate(sectionId, fieldPaths, {
      ...options,
      showToast,
      toastTitle,
      toastMessage,
      toastType,
      highlightFields
    })
  }, [notifyFieldUpdate])

  const notifySave = useCallback((
    entityType: string,
    entityName?: string,
    options: FeedbackOptions & { undoAction?: () => void } = {}
  ) => {
    const {
      showToast = true,
      toastType = 'success',
      undoAction
    } = options

    const message = entityName 
      ? `${entityType} "${entityName}" saved`
      : `${entityType} saved`

    if (showToast) {
      showToast({
        description: message,
        type: toastType,
        duration: 4000
      })
    }
  }, [showToast])

  const notifyAIUpdate = useCallback((
    sectionId: string,
    fieldPaths: string[],
    options: FeedbackOptions & { beforeState?: any, undoAction?: () => void } = {}
  ) => {
    const {
      showToast = true,
      toastTitle = 'AI Update Complete',
      toastMessage = 'Content has been generated and highlighted',
      toastType = 'success',
      highlightFields = true,
      beforeState,
      undoAction
    } = options

    // Determine importance based on scope of changes
    const importance = fieldPaths.length > 3 ? 'critical' : 'notice'

    // 1. Field highlighting for AI updates with undo state
    if (highlightFields) {
      addRecentUpdate(sectionId, fieldPaths, 'ai_update', importance, beforeState)
    }

    // 2. Toast notification with undo if available
    if (showToast) {
      showToast({
        title: toastTitle,
        description: toastMessage,
        type: toastType,
        duration: importance === 'critical' ? 10000 : 6000, // Longer for critical updates
        action: undoAction ? {
          label: 'Undo',
          onClick: undoAction
        } : undefined
      })
    }
  }, [addRecentUpdate, showToast])

  return (
    <FeedbackContext.Provider value={{
      notifyFieldUpdate,
      notifySectionUpdate,
      notifySave,
      notifyAIUpdate
    }}>
      {children}
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider')
  }
  return context
}

// Convenience hooks for common patterns
export function useFieldFeedback() {
  const { notifyFieldUpdate } = useFeedback()
  
  return useCallback((sectionId: string, fieldPath: string, options?: FeedbackOptions) => {
    notifyFieldUpdate(sectionId, [fieldPath], options)
  }, [notifyFieldUpdate])
}

export function useSaveFeedback() {
  const { notifySave } = useFeedback()
  
  return useCallback((entityType: string, entityName?: string, undoAction?: () => void) => {
    notifySave(entityType, entityName, { undoAction })
  }, [notifySave])
}

export function useAIFeedback() {
  const { notifyAIUpdate } = useFeedback()
  
  return useCallback((sectionId: string, fieldPaths: string[]) => {
    notifyAIUpdate(sectionId, fieldPaths)
  }, [notifyAIUpdate])
}