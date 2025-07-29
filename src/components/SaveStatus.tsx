'use client'

import React from 'react'
import { Check, Clock, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SaveStatusProps {
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  onForceSave?: () => void
  error?: Error | null
}

export function SaveStatus({ 
  isSaving, 
  lastSaved, 
  hasUnsavedChanges, 
  onForceSave,
  error 
}: SaveStatusProps) {
  const formatLastSaved = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    
    if (diffMinutes < 1) return 'just now'
    if (diffMinutes === 1) return '1 minute ago'
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours === 1) return '1 hour ago'
    if (diffHours < 24) return `${diffHours} hours ago`
    
    return date.toLocaleDateString()
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <AlertCircle className="h-4 w-4" />
        <span>Save failed</span>
        {onForceSave && (
          <Button 
            onClick={onForceSave} 
            size="sm" 
            variant="outline"
            className="h-6 px-2 text-xs"
          >
            Retry
          </Button>
        )}
      </div>
    )
  }

  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600">
        <div className="animate-spin">
          <Save className="h-4 w-4" />
        </div>
        <span>Saving...</span>
      </div>
    )
  }

  if (hasUnsavedChanges) {
    return (
      <div className="flex items-center gap-2 text-sm text-orange-600">
        <Clock className="h-4 w-4" />
        <span>Unsaved changes</span>
        {onForceSave && (
          <Button 
            onClick={onForceSave} 
            size="sm" 
            variant="outline"
            className="h-6 px-2 text-xs"
          >
            Save now
          </Button>
        )}
      </div>
    )
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Check className="h-4 w-4" />
        <span>Saved {formatLastSaved(lastSaved)}</span>
      </div>
    )
  }

  return null
}