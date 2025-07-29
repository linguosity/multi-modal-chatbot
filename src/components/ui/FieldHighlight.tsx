'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import { useRecentUpdates } from '@/lib/context/RecentUpdatesContext'
import { cn } from '@/lib/utils'

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
  const [animationClass, setAnimationClass] = useState('')
  const [isFlashing, setIsFlashing] = useState(false)
  const sparkleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if this field was recently updated
  const isUpdated = isFieldRecentlyUpdated(sectionId, fieldPath)

  useEffect(() => {
    if (isUpdated && !isHighlighted) {
      console.log(`✨ Field highlighting activated: ${sectionId}.${fieldPath}`);
      setIsHighlighted(true)
      setShowSparkle(true)
      setAnimationClass('flash-fade')
      
      // Remove animation class after completion to allow re-triggering
      animationTimeoutRef.current = setTimeout(() => {
        setAnimationClass('')
        setIsFlashing(false)
      }, 500) // Slightly longer than animation duration
      
      // Hide sparkle after limited pulses (1.5s = 3 cycles of 0.5s)
      sparkleTimeoutRef.current = setTimeout(() => {
        setShowSparkle(false)
      }, 1500)

    } else if (!isUpdated && isHighlighted) {
      setIsHighlighted(false)
      setShowSparkle(false)
      setAnimationClass('')
      setIsFlashing(false)
    }

    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current)
      if (sparkleTimeoutRef.current) clearTimeout(sparkleTimeoutRef.current)
    }
  }, [isUpdated, isHighlighted])

  const handleFieldInteraction = () => {
    if (isHighlighted) {
      console.log(`🎯 User interacted with field ${sectionId}.${fieldPath}, clearing highlight`)
      clearFieldUpdate(sectionId, fieldPath)
      setIsHighlighted(false)
      setShowSparkle(false)
      setAnimationClass('')
      setIsFlashing(false)
    }
  }

  return (
    <div 
      className={cn(
        'relative group transition-all duration-300 ease-out',
        animationClass,
        isHighlighted && !animationClass && 'bg-[var(--hl-fade-bg-start)] border border-[var(--hl-fade-border)] rounded-lg p-2 shadow-sm',
        className
      )}
      onClick={handleFieldInteraction}
      onFocus={handleFieldInteraction}
      tabIndex={isHighlighted ? 0 : -1}
      role={isHighlighted ? 'region' : undefined}
      aria-label={isHighlighted ? 'Recently updated by AI' : undefined}
    >
      {/* Sparkle indicator with limited cycles */}
      {showSparkle && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="relative">
            <Sparkles className="h-4 w-4 text-blue-500 sparkle-limited" />
            {/* Pulse ring with limited animation */}
            <div className="absolute inset-0 rounded-full bg-blue-400 opacity-75 sparkle-limited"></div>
          </div>
        </div>
      )}
      
      {/* Subtle glow effect during highlight */}
      {isHighlighted && !isFlashing && (
        <div className="absolute inset-0 rounded-lg bg-blue-100 opacity-20 animate-pulse pointer-events-none"></div>
      )}
      
      {/* AI update tooltip - only show on hover/focus */}
      {isHighlighted && (
        <div className="absolute -top-8 left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
          Recently updated by AI
        </div>
      )}
      
      {children}
    </div>
  )
}