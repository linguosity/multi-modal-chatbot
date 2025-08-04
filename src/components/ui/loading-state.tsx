'use client'

import React from 'react'
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/design-system/utils'
import { getClinicalTypographyClass } from '@/lib/design-system/typography-migration'
import type { BaseComponentProps } from '@/lib/design-system/types'

export type LoadingStateType = 'loading' | 'success' | 'error' | 'idle'
export type LoadingSize = 'sm' | 'md' | 'lg' | 'xl'
export type LoadingVariant = 'default' | 'clinical' | 'minimal' | 'overlay'

export interface LoadingStateProps extends BaseComponentProps {
  /** Current loading state */
  state: LoadingStateType
  /** Loading message */
  message?: string
  /** Success message */
  successMessage?: string
  /** Error message */
  errorMessage?: string
  /** Loading size */
  size?: LoadingSize
  /** Loading variant */
  variant?: LoadingVariant
  /** Whether to show as overlay */
  overlay?: boolean
  /** Custom retry handler */
  onRetry?: () => void
  /** Custom dismiss handler */
  onDismiss?: () => void
  /** Whether to auto-dismiss success state */
  autoDismissSuccess?: boolean
  /** Auto-dismiss delay in milliseconds */
  autoDismissDelay?: number
  /** Children to render when not loading */
  children?: React.ReactNode
}

const sizeConfig = {
  sm: {
    icon: 'h-4 w-4',
    text: 'text-sm',
    padding: 'p-2',
    gap: 'gap-2'
  },
  md: {
    icon: 'h-5 w-5',
    text: 'text-base',
    padding: 'p-3',
    gap: 'gap-3'
  },
  lg: {
    icon: 'h-6 w-6',
    text: 'text-lg',
    padding: 'p-4',
    gap: 'gap-4'
  },
  xl: {
    icon: 'h-8 w-8',
    text: 'text-xl',
    padding: 'p-6',
    gap: 'gap-4'
  }
}

const stateConfig = {
  loading: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    animate: true
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  idle: {
    icon: Clock,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  }
}

export function LoadingState({
  state,
  message = 'Loading...',
  successMessage = 'Success!',
  errorMessage = 'Something went wrong',
  size = 'md',
  variant = 'default',
  overlay = false,
  onRetry,
  onDismiss,
  autoDismissSuccess = false,
  autoDismissDelay = 3000,
  children,
  className,
  disabled,
  loading,
  'data-testid': testId,
  ...props
}: LoadingStateProps) {
  const sizeStyles = sizeConfig[size]
  const stateStyles = stateConfig[state]
  const Icon = stateStyles.icon

  // Auto-dismiss success state
  React.useEffect(() => {
    if (state === 'success' && autoDismissSuccess && onDismiss) {
      const timer = setTimeout(onDismiss, autoDismissDelay)
      return () => clearTimeout(timer)
    }
  }, [state, autoDismissSuccess, autoDismissDelay, onDismiss])

  const getCurrentMessage = () => {
    switch (state) {
      case 'success':
        return successMessage
      case 'error':
        return errorMessage
      case 'loading':
        return message
      default:
        return message
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'clinical':
        return cn(
          'border rounded-lg',
          stateStyles.bgColor,
          stateStyles.borderColor
        )
      case 'minimal':
        return 'bg-transparent'
      case 'overlay':
        return 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center'
      default:
        return cn(
          'rounded-lg',
          stateStyles.bgColor
        )
    }
  }

  const loadingContent = (
    <div
      className={cn(
        'flex items-center justify-center',
        sizeStyles.gap,
        sizeStyles.padding,
        getVariantClasses(),
        disabled && 'opacity-50',
        className
      )}
      data-testid={testId}
      role="status"
      aria-live="polite"
      aria-label={getCurrentMessage()}
      {...props}
    >
      <Icon
        className={cn(
          sizeStyles.icon,
          stateStyles.color,
          stateStyles.animate && 'animate-spin'
        )}
        aria-hidden="true"
      />
      
      <div className="flex flex-col items-center gap-2">
        <span className={cn(
          sizeStyles.text,
          stateStyles.color,
          'font-medium',
          getClinicalTypographyClass('bodyText')
        )}>
          {getCurrentMessage()}
        </span>
        
        {/* Action buttons */}
        {state === 'error' && (
          <div className="flex items-center gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className={cn(
                  'px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700',
                  'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
                  'transition-colors duration-200'
                )}
                aria-label="Retry operation"
              >
                Retry
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={cn(
                  'px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50',
                  'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
                  'transition-colors duration-200'
                )}
                aria-label="Dismiss error"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
        
        {state === 'success' && onDismiss && !autoDismissSuccess && (
          <button
            onClick={onDismiss}
            className={cn(
              'px-3 py-1 text-sm text-green-600 border border-green-300 rounded hover:bg-green-50',
              'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
              'transition-colors duration-200'
            )}
            aria-label="Dismiss success message"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )

  // Overlay variant
  if (overlay || variant === 'overlay') {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {loadingContent}
      </div>
    )
  }

  // Show children when not loading (unless it's an overlay)
  if (state === 'idle' && children) {
    return <>{children}</>
  }

  return loadingContent
}

// Skeleton loading component
export interface SkeletonProps extends BaseComponentProps {
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

export function Skeleton({
  width = '100%',
  height = '1rem',
  circular = false,
  lines = 1,
  variant = 'default',
  className,
  'data-testid': testId,
  ...props
}: SkeletonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'clinical':
        return 'bg-blue-100'
      default:
        return 'bg-gray-200'
    }
  }

  if (lines > 1) {
    return (
      <div className={cn('space-y-2', className)} data-testid={testId} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'animate-pulse rounded',
              getVariantClasses(),
              index === lines - 1 && 'w-3/4' // Last line is shorter
            )}
            style={{
              width: index === lines - 1 ? '75%' : width,
              height
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'animate-pulse',
        circular ? 'rounded-full' : 'rounded',
        getVariantClasses(),
        className
      )}
      style={{ width, height }}
      data-testid={testId}
      aria-hidden="true"
      {...props}
    />
  )
}

// Loading wrapper component
export interface LoadingWrapperProps extends BaseComponentProps {
  /** Whether content is loading */
  isLoading: boolean
  /** Loading state props */
  loadingProps?: Partial<LoadingStateProps>
  /** Skeleton props for skeleton loading */
  skeletonProps?: Partial<SkeletonProps>
  /** Whether to use skeleton instead of loading state */
  useSkeleton?: boolean
  /** Children to render when not loading */
  children: React.ReactNode
}

export function LoadingWrapper({
  isLoading,
  loadingProps,
  skeletonProps,
  useSkeleton = false,
  children,
  className,
  'data-testid': testId,
  ...props
}: LoadingWrapperProps) {
  if (isLoading) {
    if (useSkeleton) {
      return (
        <Skeleton
          {...skeletonProps}
          className={className}
          data-testid={testId}
          {...props}
        />
      )
    }
    
    return (
      <LoadingState
        state="loading"
        {...loadingProps}
        className={className}
        data-testid={testId}
        {...props}
      />
    )
  }

  return <>{children}</>
}