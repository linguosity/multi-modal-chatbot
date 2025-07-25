'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { ToastContainer, Toast } from '@/components/ui/toast'

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void
  showAIUpdateToast: (updatedSections: string[], changes?: string[]) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
  }, [])

  const showAIUpdateToast = useCallback((updatedSections: string[], changes: string[] = []) => {
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

  const closeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, showAIUpdateToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}