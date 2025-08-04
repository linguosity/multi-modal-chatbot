'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/design-system/utils'
import { getClinicalTypographyClass } from '@/lib/design-system/typography-migration'
import { 
  fadeInOut, 
  buttonHover, 
  buttonTap, 
  transitionClasses,
  clinicalAnimations,
  fieldVariants
} from '@/lib/animations/transitions'
import type { BaseComponentProps } from '@/lib/design-system/types'

// Enhanced Button with micro-interactions
export interface InteractiveButtonProps extends BaseComponentProps {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'clinical'
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Whether button is loading */
  loading?: boolean
  /** Loading text */
  loadingText?: string
  /** Success state */
  success?: boolean
  /** Success text */
  successText?: string
  /** Error state */
  error?: boolean
  /** Error text */
  errorText?: string
  /** Icon component */
  icon?: React.ComponentType<{ className?: string }>
  /** Icon position */
  iconPosition?: 'left' | 'right'
  /** Click handler */
  onClick?: () => void
  /** Children */
  children: React.ReactNode
}

export function InteractiveButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  success = false,
  successText,
  error = false,
  errorText,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  children,
  className,
  disabled,
  'data-testid': testId,
  ...props
}: InteractiveButtonProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
  const buttonRef = useRef<HTMLButtonElement>(null)

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
      case 'secondary':
        return 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
      case 'outline':
        return 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500'
      case 'ghost':
        return 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
      case 'clinical':
        return 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 focus:ring-blue-400'
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm'
      case 'lg':
        return 'px-6 py-3 text-lg'
      default:
        return 'px-4 py-2 text-base'
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return

    // Create ripple effect
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const newRipple = { id: Date.now(), x, y }
      
      setRipples(prev => [...prev, newRipple])
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
      }, 600)
    }

    onClick?.()
  }

  const getCurrentText = () => {
    if (loading && loadingText) return loadingText
    if (success && successText) return successText
    if (error && errorText) return errorText
    return children
  }

  const getCurrentState = () => {
    if (loading) return 'loading'
    if (success) return 'success'
    if (error) return 'error'
    return 'default'
  }

  return (
    <motion.button
      ref={buttonRef}
      whileHover={!disabled && !loading ? buttonHover : undefined}
      whileTap={!disabled && !loading ? buttonTap : undefined}
      animate={error ? fieldVariants.error : success ? fieldVariants.success : undefined}
      className={cn(
        'relative overflow-hidden rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        getSizeClasses(),
        getVariantClasses(),
        transitionClasses.all,
        disabled && 'opacity-50 cursor-not-allowed',
        loading && 'cursor-wait',
        className
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      data-testid={testId}
      aria-busy={loading}
      aria-label={loading ? loadingText : undefined}
      {...props}
    >
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            className="absolute bg-white/30 rounded-full pointer-events-none"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Button content */}
      <div className="flex items-center justify-center gap-2">
        {/* Loading spinner */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            />
          )}
        </AnimatePresence>

        {/* Icon */}
        {Icon && !loading && iconPosition === 'left' && (
          <Icon className="w-4 h-4" />
        )}

        {/* Text */}
        <motion.span
          key={getCurrentState()}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className={getClinicalTypographyClass('buttonText')}
        >
          {getCurrentText()}
        </motion.span>

        {/* Icon right */}
        {Icon && !loading && iconPosition === 'right' && (
          <Icon className="w-4 h-4" />
        )}
      </div>

      {/* Press effect overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-black/10 transition-opacity duration-150',
          isPressed ? 'opacity-100' : 'opacity-0'
        )}
      />
    </motion.button>
  )
}

// Enhanced Input with micro-interactions
export interface InteractiveInputProps extends BaseComponentProps {
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  /** Input value */
  value?: string
  /** Placeholder text */
  placeholder?: string
  /** Whether input is focused */
  focused?: boolean
  /** Whether input has error */
  error?: boolean
  /** Error message */
  errorMessage?: string
  /** Success state */
  success?: boolean
  /** Success message */
  successMessage?: string
  /** Input variant */
  variant?: 'default' | 'clinical'
  /** Change handler */
  onChange?: (value: string) => void
  /** Focus handler */
  onFocus?: () => void
  /** Blur handler */
  onBlur?: () => void
}

export function InteractiveInput({
  type = 'text',
  value = '',
  placeholder,
  focused = false,
  error = false,
  errorMessage,
  success = false,
  successMessage,
  variant = 'default',
  onChange,
  onFocus,
  onBlur,
  className,
  disabled,
  'data-testid': testId,
  ...props
}: InteractiveInputProps) {
  const [isFocused, setIsFocused] = useState(focused)
  const [hasValue, setHasValue] = useState(value.length > 0)

  const getVariantClasses = () => {
    switch (variant) {
      case 'clinical':
        return cn(
          'bg-blue-50/30 border-blue-200 focus:border-blue-400 focus:bg-blue-50/50',
          error && 'border-red-300 focus:border-red-400 bg-red-50/30',
          success && 'border-green-300 focus:border-green-400 bg-green-50/30'
        )
      default:
        return cn(
          'bg-white border-gray-300 focus:border-blue-500',
          error && 'border-red-300 focus:border-red-500',
          success && 'border-green-300 focus:border-green-500'
        )
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setHasValue(newValue.length > 0)
    onChange?.(newValue)
  }

  const handleFocus = () => {
    setIsFocused(true)
    onFocus?.()
  }

  const handleBlur = () => {
    setIsFocused(false)
    onBlur?.()
  }

  return (
    <div className="relative">
      <motion.div
        animate={error ? fieldVariants.error : success ? fieldVariants.success : undefined}
        className="relative"
      >
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            'w-full px-3 py-2 rounded-lg border transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            variant === 'clinical' ? 'focus:ring-blue-400' : 'focus:ring-blue-500',
            getVariantClasses(),
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          data-testid={testId}
          {...props}
        />

        {/* Focus indicator */}
        <motion.div
          className={cn(
            'absolute inset-0 rounded-lg pointer-events-none',
            variant === 'clinical' 
              ? 'ring-2 ring-blue-400 ring-opacity-50' 
              : 'ring-2 ring-blue-500 ring-opacity-50'
          )}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ 
            opacity: isFocused ? 1 : 0,
            scale: isFocused ? 1 : 1.02
          }}
          transition={{ duration: 0.2 }}
        />

        {/* Floating label effect */}
        {placeholder && (
          <motion.label
            className={cn(
              'absolute left-3 pointer-events-none transition-all duration-200',
              getClinicalTypographyClass('helpText'),
              isFocused || hasValue 
                ? 'top-0 -translate-y-1/2 text-xs bg-white px-1' 
                : 'top-1/2 -translate-y-1/2 text-base',
              variant === 'clinical' && 'bg-blue-50/30',
              error && 'text-red-600',
              success && 'text-green-600',
              isFocused && !error && !success && (
                variant === 'clinical' ? 'text-blue-600' : 'text-blue-500'
              )
            )}
            animate={{
              fontSize: isFocused || hasValue ? '0.75rem' : '1rem',
              y: isFocused || hasValue ? '-50%' : '-50%',
              top: isFocused || hasValue ? '0px' : '50%'
            }}
            transition={{ duration: 0.2 }}
          >
            {placeholder}
          </motion.label>
        )}
      </motion.div>

      {/* Status messages */}
      <AnimatePresence>
        {(errorMessage || successMessage) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'mt-1 text-sm',
              getClinicalTypographyClass('helpText'),
              error && 'text-red-600',
              success && 'text-green-600'
            )}
          >
            {errorMessage || successMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Enhanced Card with hover effects
export interface InteractiveCardProps extends BaseComponentProps {
  /** Card variant */
  variant?: 'default' | 'clinical' | 'elevated'
  /** Whether card is clickable */
  clickable?: boolean
  /** Whether card is selected */
  selected?: boolean
  /** Click handler */
  onClick?: () => void
  /** Children */
  children: React.ReactNode
}

export function InteractiveCard({
  variant = 'default',
  clickable = false,
  selected = false,
  onClick,
  children,
  className,
  'data-testid': testId,
  ...props
}: InteractiveCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'clinical':
        return cn(
          'bg-blue-50/30 border-blue-200',
          selected && 'bg-blue-100/50 border-blue-300 ring-2 ring-blue-400 ring-opacity-50',
          clickable && 'hover:bg-blue-50/50 hover:border-blue-300'
        )
      case 'elevated':
        return cn(
          'bg-white border-gray-200 shadow-sm',
          selected && 'border-blue-300 ring-2 ring-blue-500 ring-opacity-50',
          clickable && 'hover:shadow-md hover:border-gray-300'
        )
      default:
        return cn(
          'bg-white border-gray-200',
          selected && 'border-blue-300 ring-2 ring-blue-500 ring-opacity-50',
          clickable && 'hover:bg-gray-50 hover:border-gray-300'
        )
    }
  }

  return (
    <motion.div
      whileHover={clickable ? { y: -2, scale: 1.01 } : undefined}
      whileTap={clickable ? { scale: 0.99 } : undefined}
      className={cn(
        'rounded-lg border p-4 transition-all duration-200',
        getVariantClasses(),
        clickable && 'cursor-pointer',
        className
      )}
      onClick={clickable ? onClick : undefined}
      data-testid={testId}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Progress indicator with smooth animations
export interface AnimatedProgressProps extends BaseComponentProps {
  /** Progress value (0-100) */
  value: number
  /** Progress variant */
  variant?: 'default' | 'clinical' | 'success' | 'warning' | 'error'
  /** Whether to show percentage */
  showPercentage?: boolean
  /** Custom label */
  label?: string
  /** Size */
  size?: 'sm' | 'md' | 'lg'
}

export function AnimatedProgress({
  value,
  variant = 'default',
  showPercentage = false,
  label,
  size = 'md',
  className,
  'data-testid': testId,
  ...props
}: AnimatedProgressProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'clinical':
        return 'bg-blue-600'
      case 'success':
        return 'bg-green-600'
      case 'warning':
        return 'bg-orange-600'
      case 'error':
        return 'bg-red-600'
      default:
        return 'bg-blue-600'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-1'
      case 'lg':
        return 'h-3'
      default:
        return 'h-2'
    }
  }

  return (
    <div className={cn('w-full', className)} data-testid={testId} {...props}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className={cn(
              'text-sm font-medium',
              getClinicalTypographyClass('formLabel')
            )}>
              {label}
            </span>
          )}
          {showPercentage && (
            <motion.span
              key={value}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                'text-sm font-medium',
                getClinicalTypographyClass('helpText')
              )}
            >
              {Math.round(value)}%
            </motion.span>
          )}
        </div>
      )}
      
      <div className={cn(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        getSizeClasses()
      )}>
        <motion.div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            getVariantClasses()
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}