'use client'

import React, { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useRecentUpdates } from '@/lib/context/RecentUpdatesContext'

interface FieldHighlightProps {
  sectionId: string
  fieldPath: string
  children: React.ReactNode
  className?: string
}

export function FieldHighlight({ sectionId, fieldPath, children, className = '' }: FieldHighlightProps) {
  const { isFieldRecentlyUpdated, clearFieldUpdate } = useRecentUpdates()
  const [isHighlighted, setIsHighlighted] = useState(false)
  const [showSparkle, setShowSparkle] = useState(false)

  // Check if this field was recently updated
  const isUpdated = isFieldRecentlyUpdated(sectionId, fieldPath)

  useEffect(() => {
    if (isUpdated && !isHighlighted) {
      setIsHighlighted(true)
      setShowSparkle(true)
      
      // Hide sparkle after animation
      const sparkleTimer = setTimeout(() => {
        setShowSparkle(false)
      }, 2000)

      return () => clearTimeout(sparkleTimer)
    } else if (!isUpdated && isHighlighted) {
      setIsHighlighted(false)
      setShowSparkle(false)
    }
  }, [isUpdated, isHighlighted])

  const handleFieldInteraction = () => {
    if (isHighlighted) {
      console.log(`🎯 User interacted with field ${sectionId}.${fieldPath}, clearing highlight`)
      clearFieldUpdate(sectionId, fieldPath)
      setIsHighlighted(false)
      setShowSparkle(false)
    }
  }

  return (
    <div 
      className={`relative transition-all duration-500 ${
        isHighlighted 
          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-2 shadow-sm animate-in fade-in-0 slide-in-from-left-1' 
          : ''
      } ${className}`}
      onClick={handleFieldInteraction}
      onFocus={handleFieldInteraction}
    >
      {/* Sparkle indicator */}
      {showSparkle && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="relative">
            <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping"></div>
          </div>
        </div>
      )}
      
      {/* Glow effect */}
      {isHighlighted && (
        <div className="absolute inset-0 rounded-lg bg-blue-100 opacity-20 animate-pulse pointer-events-none"></div>
      )}
      
      {/* AI update tooltip */}
      {isHighlighted && (
        <div className="absolute -top-8 left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
          Recently updated by AI
        </div>
      )}
      
      {children}
    </div>
  )
}