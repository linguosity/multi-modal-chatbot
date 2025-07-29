'use client'

import React from 'react'
import { Check, Dot, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UpdateBadgeProps {
  count?: number
  type?: 'updated' | 'completed' | 'new' | 'ai_narrative'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  ariaLabel?: string
}

export function UpdateBadge({ 
  count = 0, 
  type = 'updated', 
  size = 'sm', 
  className,
  ariaLabel 
}: UpdateBadgeProps) {
  if (count === 0 && type !== 'completed') return null

  const sizeClasses = {
    sm: 'h-2 w-2 text-[10px]',
    md: 'h-3 w-3 text-xs',
    lg: 'h-4 w-4 text-sm'
  }

  const typeConfig = {
    updated: {
      icon: Dot,
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
      showCount: true
    },
    completed: {
      icon: Check,
      bgColor: 'bg-green-500',
      textColor: 'text-white',
      showCount: false
    },
    new: {
      icon: Dot,
      bgColor: 'bg-orange-500',
      textColor: 'text-white',
      showCount: true
    },
    ai_narrative: {
      icon: Sparkles,
      bgColor: 'bg-purple-500',
      textColor: 'text-white',
      showCount: false
    }
  }

  const config = typeConfig[type]
  const Icon = config.icon

  // For dot indicators (no count)
  if (!config.showCount || count <= 1) {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          config.bgColor,
          sizeClasses[size],
          className
        )}
        aria-label={ariaLabel || `${type} indicator`}
      >
        <Icon className={cn('h-full w-full', config.textColor)} />
      </div>
    )
  }

  // For count badges
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full px-1.5 py-0.5 min-w-[1.25rem]',
        config.bgColor,
        config.textColor,
        'text-xs font-medium leading-none',
        className
      )}
      aria-label={ariaLabel || `${count} ${type} items`}
    >
      {count > 99 ? '99+' : count}
    </div>
  )
}

interface BadgeWrapperProps {
  children: React.ReactNode
  badge?: {
    count?: number
    type?: 'updated' | 'completed' | 'new'
    ariaLabel?: string
    updatedFields?: string[] // For tooltip details
  }
  className?: string
}

export function BadgeWrapper({ children, badge, className }: BadgeWrapperProps) {
  const tooltipText = badge?.updatedFields?.length 
    ? `Updated fields: ${badge.updatedFields.slice(0, 3).join(', ')}${badge.updatedFields.length > 3 ? '...' : ''}`
    : undefined

  return (
    <div 
      className={cn('relative inline-flex', className)}
      title={tooltipText}
    >
      {children}
      {badge && (
        <div className="absolute -top-1 -right-1 z-10">
          <UpdateBadge {...badge} />
        </div>
      )}
    </div>
  )
}