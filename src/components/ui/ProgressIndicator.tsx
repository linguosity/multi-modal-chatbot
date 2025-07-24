'use client'

import React from 'react'
import { Check, Lock, Unlock } from 'lucide-react'

interface ProgressIndicatorProps {
  completed: number
  total: number
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function ProgressIndicator({ 
  completed, 
  total, 
  size = 'md', 
  showText = true,
  className = '' 
}: ProgressIndicatorProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-10 h-10'
  }
  
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Circular Progress */}
      <div className={`relative ${sizeClasses[size]}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          {/* Background circle */}
          <path
            className="text-gray-200"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Progress circle */}
          <path
            className={percentage === 100 ? "text-green-500" : "text-blue-500"}
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${percentage}, 100`}
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        
        {/* Center icon or percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          {percentage === 100 ? (
            <Check className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} text-green-600`} />
          ) : (
            <span className={`font-medium ${textSizes[size]} text-gray-700`}>
              {Math.round(percentage)}
            </span>
          )}
        </div>
      </div>

      {/* Text indicator */}
      {showText && (
        <span className={`${textSizes[size]} text-gray-600 font-medium`}>
          {completed}/{total} sections
        </span>
      )}
    </div>
  )
}

interface SectionToggleProps {
  isCompleted: boolean
  onToggle: () => void
  size?: 'sm' | 'md'
  className?: string
}

export function SectionToggle({ 
  isCompleted, 
  onToggle, 
  size = 'sm',
  className = '' 
}: SectionToggleProps) {
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  
  return (
    <button
      onClick={onToggle}
      className={`
        inline-flex items-center justify-center rounded-full transition-all duration-200
        ${isCompleted 
          ? 'bg-green-100 text-green-600 hover:bg-green-200' 
          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
        }
        ${size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'}
        ${className}
      `}
      title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
    >
      {isCompleted ? (
        <Check className={iconSize} />
      ) : (
        <div className={`rounded-full border-2 border-current ${size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'}`} />
      )}
    </button>
  )
}