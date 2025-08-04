'use client'

import React from 'react'
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/design-system/utils'
import { getClinicalTypographyClass } from '@/lib/design-system/typography-migration'
import type { BaseComponentProps } from '@/lib/design-system/types'

export type ValidationSeverity = 'error' | 'warning' | 'info' | 'success'

export interface ValidationMessage {
  id: string
  message: string
  severity: ValidationSeverity
  field?: string
  recoveryAction?: string
}

export interface FormValidationProps extends BaseComponentProps {
  /** Validation messages */
  messages: ValidationMessage[]
  /** Whether to show inline with fields */
  inline?: boolean
  /** Whether to group by severity */
  groupBySeverity?: boolean
  /** Maximum number of messages to show */
  maxMessages?: number
  /** Custom message renderer */
  messageRenderer?: (message: ValidationMessage) => React.ReactNode
  /** Callback when recovery action is clicked */
  onRecoveryAction?: (message: ValidationMessage) => void
  /** Whether to auto-dismiss success messages */
  autoDismissSuccess?: boolean
  /** Auto-dismiss delay in milliseconds */
  autoDismissDelay?: number
}

const severityConfig = {
  error: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-500'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    iconColor: 'text-orange-500'
  },
  info: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-500'
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-500'
  }
}

export function FormValidation({
  messages,
  inline = false,
  groupBySeverity = false,
  maxMessages = 10,
  messageRenderer,
  onRecoveryAction,
  autoDismissSuccess = true,
  autoDismissDelay = 5000,
  className,
  'data-testid': testId,
  ...props
}: FormValidationProps) {
  const [dismissedMessages, setDismissedMessages] = React.useState<Set<string>>(new Set())

  // Auto-dismiss success messages
  React.useEffect(() => {
    if (autoDismissSuccess) {
      const successMessages = messages.filter(m => m.severity === 'success')
      if (successMessages.length > 0) {
        const timer = setTimeout(() => {
          setDismissedMessages(prev => {
            const newSet = new Set(prev)
            successMessages.forEach(m => newSet.add(m.id))
            return newSet
          })
        }, autoDismissDelay)
        return () => clearTimeout(timer)
      }
    }
  }, [messages, autoDismissSuccess, autoDismissDelay])

  const visibleMessages = messages
    .filter(message => !dismissedMessages.has(message.id))
    .slice(0, maxMessages)

  if (visibleMessages.length === 0) {
    return null
  }

  const dismissMessage = (messageId: string) => {
    setDismissedMessages(prev => new Set([...prev, messageId]))
  }

  const renderMessage = (message: ValidationMessage) => {
    if (messageRenderer) {
      return messageRenderer(message)
    }

    const config = severityConfig[message.severity]
    const Icon = config.icon

    return (
      <div
        key={message.id}
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg border',
          config.bgColor,
          config.borderColor,
          inline ? 'text-sm' : 'text-base'
        )}
        role="alert"
        aria-live="polite"
      >
        <Icon
          className={cn(
            'h-4 w-4 mt-0.5 flex-shrink-0',
            config.iconColor
          )}
          aria-hidden="true"
        />
        
        <div className="flex-1 min-w-0">
          <div className={cn(
            'font-medium',
            config.color,
            getClinicalTypographyClass(inline ? 'helpText' : 'bodyText')
          )}>
            {message.message}
          </div>
          
          {message.recoveryAction && (
            <button
              onClick={() => onRecoveryAction?.(message)}
              className={cn(
                'mt-2 text-sm underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded',
                config.color,
                'focus:ring-current'
              )}
            >
              {message.recoveryAction}
            </button>
          )}
        </div>
        
        {/* Dismiss button */}
        <button
          onClick={() => dismissMessage(message.id)}
          className={cn(
            'text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded',
            'h-4 w-4 flex items-center justify-center text-xs'
          )}
          aria-label="Dismiss message"
        >
          ×
        </button>
      </div>
    )
  }

  if (groupBySeverity) {
    const groupedMessages = visibleMessages.reduce((groups, message) => {
      if (!groups[message.severity]) {
        groups[message.severity] = []
      }
      groups[message.severity].push(message)
      return groups
    }, {} as Record<ValidationSeverity, ValidationMessage[]>)

    const severityOrder: ValidationSeverity[] = ['error', 'warning', 'info', 'success']

    return (
      <div
        className={cn('space-y-4', className)}
        data-testid={testId}
        {...props}
      >
        {severityOrder.map(severity => {
          const messagesForSeverity = groupedMessages[severity]
          if (!messagesForSeverity || messagesForSeverity.length === 0) {
            return null
          }

          return (
            <div key={severity} className="space-y-2">
              <h4 className={cn(
                'text-sm font-medium capitalize',
                severityConfig[severity].color,
                getClinicalTypographyClass('formLabel')
              )}>
                {severity} ({messagesForSeverity.length})
              </h4>
              <div className="space-y-2">
                {messagesForSeverity.map(renderMessage)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className={cn('space-y-2', className)}
      data-testid={testId}
      {...props}
    >
      {visibleMessages.map(renderMessage)}
    </div>
  )
}

// Inline field validation component
export interface FieldValidationProps extends BaseComponentProps {
  /** Field name */
  fieldName: string
  /** Validation messages for this field */
  messages: ValidationMessage[]
  /** Whether to show only the first message */
  showFirstOnly?: boolean
}

export function FieldValidation({
  fieldName,
  messages,
  showFirstOnly = true,
  className,
  'data-testid': testId,
  ...props
}: FieldValidationProps) {
  const fieldMessages = messages.filter(m => m.field === fieldName)
  
  if (fieldMessages.length === 0) {
    return null
  }

  const messagesToShow = showFirstOnly ? [fieldMessages[0]] : fieldMessages
  const highestSeverity = fieldMessages.reduce((highest, message) => {
    const severityOrder = { error: 4, warning: 3, info: 2, success: 1 }
    return severityOrder[message.severity] > severityOrder[highest.severity] ? message : highest
  })

  const config = severityConfig[highestSeverity.severity]
  const Icon = config.icon

  return (
    <div
      className={cn('mt-1', className)}
      data-testid={testId}
      {...props}
    >
      {messagesToShow.map(message => (
        <div
          key={message.id}
          className={cn(
            'flex items-start gap-2 text-sm',
            config.color
          )}
          role="alert"
          aria-live="polite"
        >
          <Icon
            className={cn('h-3 w-3 mt-0.5 flex-shrink-0', config.iconColor)}
            aria-hidden="true"
          />
          <span className={getClinicalTypographyClass('helpText')}>
            {message.message}
          </span>
        </div>
      ))}
    </div>
  )
}

// Form validation summary component
export interface ValidationSummaryProps extends BaseComponentProps {
  /** All validation messages */
  messages: ValidationMessage[]
  /** Whether the form is valid */
  isValid: boolean
  /** Custom title */
  title?: string
  /** Whether to show counts */
  showCounts?: boolean
}

export function ValidationSummary({
  messages,
  isValid,
  title = 'Form Validation',
  showCounts = true,
  className,
  'data-testid': testId,
  ...props
}: ValidationSummaryProps) {
  const errorCount = messages.filter(m => m.severity === 'error').length
  const warningCount = messages.filter(m => m.severity === 'warning').length
  const infoCount = messages.filter(m => m.severity === 'info').length

  if (isValid && messages.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg',
          className
        )}
        data-testid={testId}
        {...props}
      >
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className={cn(
          'text-green-700 font-medium',
          getClinicalTypographyClass('bodyText')
        )}>
          All fields are valid
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'p-4 border rounded-lg',
        errorCount > 0 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200',
        className
      )}
      data-testid={testId}
      {...props}
    >
      <div className="flex items-center gap-2 mb-3">
        {errorCount > 0 ? (
          <AlertCircle className="h-5 w-5 text-red-500" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
        )}
        <h3 className={cn(
          'font-medium',
          errorCount > 0 ? 'text-red-700' : 'text-yellow-700',
          getClinicalTypographyClass('subsectionHeading')
        )}>
          {title}
        </h3>
      </div>

      {showCounts && (
        <div className="flex gap-4 mb-3 text-sm">
          {errorCount > 0 && (
            <span className="text-red-600">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-orange-600">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
          {infoCount > 0 && (
            <span className="text-blue-600">
              {infoCount} info
            </span>
          )}
        </div>
      )}

      <FormValidation
        messages={messages}
        groupBySeverity={true}
        maxMessages={5}
      />
    </div>
  )
}