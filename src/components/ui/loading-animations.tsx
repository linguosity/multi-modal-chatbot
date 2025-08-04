'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/design-system/utils'
import { getClinicalTypographyClass } from '@/lib/design-system/typography-migration'
import type { BaseComponentProps } from '@/lib/design-system/types'

// Pulsing dots loader
export interface PulsingDotsProps extends BaseComponentProps {
  /** Number of dots */
  count?: number
  /** Size of dots */
  size?: 'sm' | 'md' | 'lg'
  /** Color variant */
  variant?: 'default' | 'clinical' | 'primary'
}

export function PulsingDots({
  count = 3,
  size = 'md',
  variant = 'default',
  className,
  'data-testid': testId,
  ...props
}: PulsingDotsProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-1 h-1'
      case 'lg':
        return 'w-3 h-3'
      default:
        return 'w-2 h-2'
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'clinical':
        return 'bg-blue-600'
      case 'primary':
        return 'bg-blue-500'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div
      className={cn('flex items-center space-x-1', className)}
      data-testid={testId}
      {...props}
    >
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className={cn(
            'rounded-full',
            getSizeClasses(),
            getVariantClasses()
          )}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: index * 0.2,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  )
}

// Spinning loader
export interface SpinnerProps extends BaseComponentProps {
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Color variant */
  variant?: 'default' | 'clinical' | 'primary'
  /** Thickness of the spinner */
  thickness?: 'thin' | 'normal' | 'thick'
}

export function Spinner({
  size = 'md',
  variant = 'default',
  thickness = 'normal',
  className,
  'data-testid': testId,
  ...props
}: SpinnerProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4'
      case 'lg':
        return 'w-8 h-8'
      case 'xl':
        return 'w-12 h-12'
      default:
        return 'w-6 h-6'
    }
  }

  const getThicknessClasses = () => {
    switch (thickness) {
      case 'thin':
        return 'border'
      case 'thick':
        return 'border-4'
      default:
        return 'border-2'
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'clinical':
        return 'border-blue-600 border-t-transparent'
      case 'primary':
        return 'border-blue-500 border-t-transparent'
      default:
        return 'border-gray-300 border-t-transparent'
    }
  }

  return (
    <motion.div
      className={cn(
        'rounded-full',
        getSizeClasses(),
        getThicknessClasses(),
        getVariantClasses(),
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }}
      data-testid={testId}
      {...props}
    />
  )
}

// Wave loader
export interface WaveLoaderProps extends BaseComponentProps {
  /** Number of bars */
  bars?: number
  /** Height of bars */
  height?: 'sm' | 'md' | 'lg'
  /** Color variant */
  variant?: 'default' | 'clinical' | 'primary'
}

export function WaveLoader({
  bars = 5,
  height = 'md',
  variant = 'default',
  className,
  'data-testid': testId,
  ...props
}: WaveLoaderProps) {
  const getHeightClasses = () => {
    switch (height) {
      case 'sm':
        return 'h-4'
      case 'lg':
        return 'h-8'
      default:
        return 'h-6'
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'clinical':
        return 'bg-blue-600'
      case 'primary':
        return 'bg-blue-500'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div
      className={cn('flex items-end space-x-1', className)}
      data-testid={testId}
      {...props}
    >
      {Array.from({ length: bars }).map((_, index) => (
        <motion.div
          key={index}
          className={cn(
            'w-1 rounded-full',
            getHeightClasses(),
            getVariantClasses()
          )}
          animate={{
            scaleY: [1, 0.3, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.1,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  )
}

// Skeleton shimmer effect
export interface ShimmerSkeletonProps extends BaseComponentProps {
  /** Width of skeleton */
  width?: string | number
  /** Height of skeleton */
  height?: string | number
  /** Whether skeleton is circular */
  circular?: boolean
  /** Number of lines for text skeleton */
  lines?: number
  /** Variant for different contexts */
  variant?: 'default' | 'clinical'
}

export function ShimmerSkeleton({
  width = '100%',
  height = '1rem',
  circular = false,
  lines = 1,
  variant = 'default',
  className,
  'data-testid': testId,
  ...props
}: ShimmerSkeletonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'clinical':
        return 'bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100'
      default:
        return 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200'
    }
  }

  if (lines > 1) {
    return (
      <div className={cn('space-y-2', className)} data-testid={testId} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={cn(
              'rounded overflow-hidden',
              getVariantClasses(),
              index === lines - 1 && 'w-3/4' // Last line is shorter
            )}
            style={{
              width: index === lines - 1 ? '75%' : width,
              height
            }}
            animate={{
              backgroundPosition: ['200% 0', '-200% 0']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      className={cn(
        'overflow-hidden',
        circular ? 'rounded-full' : 'rounded',
        getVariantClasses(),
        className
      )}
      style={{ width, height }}
      animate={{
        backgroundPosition: ['200% 0', '-200% 0']
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear'
      }}
      data-testid={testId}
      {...props}
    />
  )
}

// Progress ring
export interface ProgressRingProps extends BaseComponentProps {
  /** Progress value (0-100) */
  progress: number
  /** Ring size */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Stroke width */
  strokeWidth?: number
  /** Color variant */
  variant?: 'default' | 'clinical' | 'success' | 'warning' | 'error'
  /** Whether to show percentage */
  showPercentage?: boolean
}

export function ProgressRing({
  progress,
  size = 'md',
  strokeWidth = 4,
  variant = 'default',
  showPercentage = false,
  className,
  'data-testid': testId,
  ...props
}: ProgressRingProps) {
  const getSizeValue = () => {
    switch (size) {
      case 'sm':
        return 40
      case 'lg':
        return 80
      case 'xl':
        return 120
      default:
        return 60
    }
  }

  const getVariantColor = () => {
    switch (variant) {
      case 'clinical':
        return '#2563eb' // blue-600
      case 'success':
        return '#16a34a' // green-600
      case 'warning':
        return '#d97706' // orange-600
      case 'error':
        return '#dc2626' // red-600
      default:
        return '#6b7280' // gray-500
    }
  }

  const sizeValue = getSizeValue()
  const radius = (sizeValue - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      data-testid={testId}
      {...props}
    >
      <svg
        width={sizeValue}
        height={sizeValue}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={radius}
          stroke={getVariantColor()}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
      </svg>
      
      {/* Percentage text */}
      {showPercentage && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <span className={cn(
            'font-semibold',
            getClinicalTypographyClass('progressText'),
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base',
            size === 'xl' && 'text-lg'
          )}>
            {Math.round(progress)}%
          </span>
        </motion.div>
      )}
    </div>
  )
}

// Typing indicator
export interface TypingIndicatorProps extends BaseComponentProps {
  /** Whether to show typing indicator */
  isTyping: boolean
  /** Message to show */
  message?: string
  /** Variant */
  variant?: 'default' | 'clinical'
}

export function TypingIndicator({
  isTyping,
  message = 'Processing...',
  variant = 'default',
  className,
  'data-testid': testId,
  ...props
}: TypingIndicatorProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'clinical':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  if (!isTyping) return null

  return (
    <motion.div
      className={cn(
        'flex items-center space-x-2',
        getVariantClasses(),
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      data-testid={testId}
      {...props}
    >
      <PulsingDots count={3} size="sm" variant={variant} />
      <motion.span
        className={getClinicalTypographyClass('helpText')}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.span>
    </motion.div>
  )
}

// Heartbeat animation for critical alerts
export interface HeartbeatProps extends BaseComponentProps {
  /** Whether to show heartbeat */
  active: boolean
  /** Color variant */
  variant?: 'default' | 'warning' | 'error'
  /** Size */
  size?: 'sm' | 'md' | 'lg'
  /** Children to animate */
  children: React.ReactNode
}

export function Heartbeat({
  active,
  variant = 'default',
  size = 'md',
  children,
  className,
  'data-testid': testId,
  ...props
}: HeartbeatProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'warning':
        return 'text-orange-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <motion.div
      className={cn(getVariantClasses(), className)}
      animate={active ? {
        scale: [1, 1.05, 1, 1.05, 1],
        opacity: [1, 0.8, 1, 0.8, 1]
      } : {}}
      transition={{
        duration: 1.5,
        repeat: active ? Infinity : 0,
        ease: 'easeInOut'
      }}
      data-testid={testId}
      {...props}
    >
      {children}
    </motion.div>
  )
}