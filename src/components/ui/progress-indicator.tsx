'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ProgressIndicatorProps {
  steps: string[]
  currentStep: number
  className?: string
  variant?: 'horizontal' | 'vertical'
  showLabels?: boolean
}

export function ProgressIndicator({ 
  steps, 
  currentStep, 
  className,
  variant = 'horizontal',
  showLabels = true 
}: ProgressIndicatorProps) {
  return (
    <div className={cn(
      'flex',
      variant === 'horizontal' ? 'flex-row items-center' : 'flex-col',
      className
    )}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isUpcoming = index > currentStep

        return (
          <div
            key={index}
            className={cn(
              'flex items-center',
              variant === 'horizontal' && index < steps.length - 1 && 'flex-1'
            )}
          >
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200',
                  isCompleted && 'bg-green-500 text-white',
                  isCurrent && 'bg-blue-500 text-white ring-4 ring-blue-100',
                  isUpcoming && 'bg-gray-200 text-gray-500'
                )}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              
              {/* Step Label */}
              {showLabels && (
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center max-w-20',
                    variant === 'horizontal' && 'hidden sm:block',
                    isCurrent && 'text-blue-600',
                    isCompleted && 'text-green-600',
                    isUpcoming && 'text-gray-500'
                  )}
                >
                  {step}
                </span>
              )}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'transition-all duration-200',
                  variant === 'horizontal' 
                    ? 'flex-1 h-0.5 mx-4' 
                    : 'w-0.5 h-8 my-2 ml-4',
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Compact version for smaller spaces
export function CompactProgressIndicator({ 
  current, 
  total, 
  className 
}: { 
  current: number
  total: number
  className?: string 
}) {
  const percentage = Math.round((current / total) * 100)

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-600 min-w-fit">
        {current} of {total}
      </span>
    </div>
  )
}

// Hook for managing progress state
export function useProgress(totalSteps: number) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const nextStep = () => {
    setCurrentStep(prev => {
      const next = Math.min(prev + 1, totalSteps - 1)
      if (next === totalSteps - 1) {
        setIsComplete(true)
      }
      return next
    })
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
    setIsComplete(false)
  }

  const goToStep = (step: number) => {
    const clampedStep = Math.max(0, Math.min(step, totalSteps - 1))
    setCurrentStep(clampedStep)
    setIsComplete(clampedStep === totalSteps - 1)
  }

  const reset = () => {
    setCurrentStep(0)
    setIsComplete(false)
  }

  return {
    currentStep,
    isComplete,
    nextStep,
    prevStep,
    goToStep,
    reset,
    progress: Math.round((currentStep / (totalSteps - 1)) * 100)
  }
}