'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { ToastProvider as UIToastProvider, useToast as useUIToast, Toast } from '@/components/ui/toast'

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void
  showAIUpdateToast: (updatedSections: string[], changes?: string[], customMessage?: string) => void
  showProcessingSummaryToast: (processingData: {
    summary?: string
    updatedSections?: string[]
    processedFiles?: Array<{ name: string; type: string; size: number }>
    fieldUpdates?: string[]
  }) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

function ToastContextProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useUIToast()

  const showToast = useCallback((toastData: Omit<Toast, 'id'>) => {
    toast(toastData)
  }, [toast])

  const showAIUpdateToast = useCallback((updatedSections: string[], changes: string[] = [], customMessage?: string) => {
    // If custom message provided, show simple toast
    if (customMessage) {
      showToast({
        type: 'success',
        description: customMessage,
        duration: 3000 // Shorter duration for simple saves
      })
      return
    }

    const sectionText = updatedSections.length === 1 
      ? updatedSections[0] 
      : `${updatedSections.length} sections`
    
    const changeText = changes.length > 0 
      ? `Updated ${changes.length} fields: ${changes.slice(0, 3).join(', ')}${changes.length > 3 ? '...' : ''}`
      : 'Content updated with AI analysis'

    showToast({
      type: 'ai_update',
      title: `AI Updated ${sectionText}`,
      description: changeText,
      duration: 8000 // Longer duration for AI updates
    })
  }, [showToast])

  const showProcessingSummaryToast = useCallback((processingData: {
    summary?: string
    updatedSections?: string[]
    processedFiles?: Array<{ name: string; type: string; size: number }>
    fieldUpdates?: string[]
  }) => {
    const fileCount = processingData.processedFiles?.length || 0
    const sectionCount = processingData.updatedSections?.length || 0
    
    const title = fileCount > 0 
      ? `Processed ${fileCount} file${fileCount > 1 ? 's' : ''}`
      : 'AI Processing Complete'
    
    const description = sectionCount > 0 
      ? `Updated ${sectionCount} section${sectionCount > 1 ? 's' : ''} with extracted data`
      : 'Analysis completed successfully'

    showToast({
      type: 'ai_processing',
      title,
      description,
      processingData,
      persistent: true, // Don't auto-dismiss
      duration: 0 // Disable auto-dismiss
    })
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, showAIUpdateToast, showProcessingSummaryToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <UIToastProvider>
      <ToastContextProvider>
        {children}
      </ToastContextProvider>
    </UIToastProvider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}