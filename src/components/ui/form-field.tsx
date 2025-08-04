'use client'

import { forwardRef, useState } from 'react'
import { AlertCircle, HelpCircle, Eye, EyeOff, Check } from 'lucide-react'
import { cn, getFormFieldClasses } from '@/lib/design-system/utils'
import { Input } from './input'
import { Label } from './label'
import { Switch } from './switch'
import type { FormComponentProps } from '@/lib/design-system/types'

interface FormFieldProps extends FormComponentProps {
  label: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'switch'
  helpText?: string
  showOptional?: boolean
  children?: React.ReactNode
  options?: Array<{ value: string | number; label: string; disabled?: boolean }>
  rows?: number // for textarea
  resize?: boolean // for textarea
  showPasswordToggle?: boolean // for password fields
  autoSave?: boolean // for auto-save integration
  onAutoSave?: (value: any) => Promise<void>
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    custom?: (value: any) => string | null
  }
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ 
    label, 
    type = 'text',
    name,
    value,
    onChange,
    error,
    required,
    disabled,
    loading,
    placeholder,
    helpText,
    showOptional = false,
    className,
    children,
    options = [],
    rows = 3,
    resize = true,
    showPasswordToggle = false,
    autoSave = false,
    onAutoSave,
    validation,
    'data-testid': testId,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isAutoSaving, setIsAutoSaving] = useState(false)
    
    const fieldId = name || `field-${Math.random().toString(36).substr(2, 9)}`
    const hasError = !!error
    const isPasswordField = type === 'password'
    const actualType = isPasswordField && showPassword ? 'text' : type

    // Auto-save functionality
    const handleAutoSave = async (newValue: any) => {
      if (autoSave && onAutoSave && newValue !== value) {
        setIsAutoSaving(true)
        try {
          await onAutoSave(newValue)
        } catch (err) {
          console.error('Auto-save failed:', err)
        } finally {
          setIsAutoSaving(false)
        }
      }
    }

    const handleChange = (newValue: any) => {
      onChange?.(newValue)
      if (autoSave) {
        // Debounce auto-save
        const timeoutId = setTimeout(() => handleAutoSave(newValue), 1000)
        return () => clearTimeout(timeoutId)
      }
    }

    // Validation
    const validateValue = (val: any): string | null => {
      if (!validation) return null
      
      if (validation.minLength && val && val.length < validation.minLength) {
        return `Minimum ${validation.minLength} characters required`
      }
      
      if (validation.maxLength && val && val.length > validation.maxLength) {
        return `Maximum ${validation.maxLength} characters allowed`
      }
      
      if (validation.pattern && val && !validation.pattern.test(val)) {
        return 'Invalid format'
      }
      
      if (validation.custom) {
        return validation.custom(val)
      }
      
      return null
    }

    const renderField = () => {
      if (children) return children

      switch (type) {
        case 'textarea':
          return (
            <textarea
              ref={ref as any}
              id={fieldId}
              name={name}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled || loading}
              rows={rows}
              className={getFormFieldClasses({ 
                hasError, 
                disabled: disabled || loading,
                className: cn(
                  'min-h-[80px]',
                  !resize && 'resize-none'
                )
              })}
              aria-invalid={hasError}
              aria-describedby={
                error ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined
              }
              data-testid={testId}
              {...props}
            />
          )

        case 'select':
          return (
            <select
              ref={ref as any}
              id={fieldId}
              name={name}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled || loading}
              className={getFormFieldClasses({ hasError, disabled: disabled || loading })}
              aria-invalid={hasError}
              aria-describedby={
                error ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined
              }
              data-testid={testId}
              {...props}
            >
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>
          )

        case 'checkbox':
          return (
            <div className="flex items-center space-x-2">
              <input
                ref={ref}
                type="checkbox"
                id={fieldId}
                name={name}
                checked={!!value}
                onChange={(e) => handleChange(e.target.checked)}
                disabled={disabled || loading}
                className={cn(
                  'h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500',
                  hasError && 'border-red-300',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                aria-invalid={hasError}
                aria-describedby={
                  error ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined
                }
                data-testid={testId}
                {...props}
              />
              <Label htmlFor={fieldId} className="text-sm font-normal">
                {label}
              </Label>
            </div>
          )

        case 'switch':
          return (
            <div className="flex items-center justify-between">
              <Label htmlFor={fieldId} className="text-sm font-medium">
                {label}
              </Label>
              <Switch
                id={fieldId}
                checked={!!value}
                onCheckedChange={handleChange}
                disabled={disabled || loading}
                aria-describedby={
                  error ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined
                }
                data-testid={testId}
              />
            </div>
          )

        case 'radio':
          return (
            <div className="space-y-2">
              {options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`${fieldId}-${option.value}`}
                    name={name}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => handleChange(e.target.value)}
                    disabled={disabled || loading || option.disabled}
                    className={cn(
                      'h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500',
                      hasError && 'border-red-300'
                    )}
                    aria-invalid={hasError}
                    data-testid={testId}
                  />
                  <Label htmlFor={`${fieldId}-${option.value}`} className="text-sm font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          )

        default:
          return (
            <Input
              ref={ref}
              id={fieldId}
              name={name}
              type={actualType}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled || loading}
              className={getFormFieldClasses({ hasError, disabled: disabled || loading })}
              aria-invalid={hasError}
              aria-describedby={
                error ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined
              }
              data-testid={testId}
              {...props}
            />
          )
      }
    }

    // For checkbox and switch, we handle the label differently
    if (type === 'checkbox' || type === 'switch') {
      return (
        <div className={cn('space-y-2', className)}>
          {renderField()}
          
          {/* Help Text */}
          {helpText && !error && (
            <p id={`${fieldId}-help`} className="text-xs text-gray-500">
              {helpText}
            </p>
          )}

          {/* Error Message */}
          {error && (
            <p id={`${fieldId}-error`} className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          )}
        </div>
      )
    }

    return (
      <div className={cn('space-y-2', className)}>
        {/* Label */}
        <div className="flex items-center justify-between">
          <Label 
            htmlFor={fieldId}
            className={cn(
              'text-sm font-medium',
              hasError ? 'text-red-700' : 'text-gray-700',
              disabled && 'text-gray-400'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
            {showOptional && !required && (
              <span className="text-gray-400 ml-1 font-normal">(optional)</span>
            )}
          </Label>
          
          <div className="flex items-center gap-2">
            {/* Auto-save indicator */}
            {autoSave && isAutoSaving && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <div className="animate-spin h-3 w-3 border border-gray-300 border-t-gray-600 rounded-full"></div>
                Saving...
              </div>
            )}
            
            {/* Help tooltip */}
            {helpText && (
              <div className="group relative">
                <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute right-0 top-6 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {helpText}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Field */}
        <div className="relative">
          {renderField()}
          
          {/* Password toggle */}
          {isPasswordField && showPasswordToggle && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          )}
          
          {/* Success/Error Icons */}
          {!isPasswordField && (
            <>
              {hasError && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
              )}
              {!hasError && value && !loading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Help Text */}
        {helpText && !error && (
          <p id={`${fieldId}-help`} className="text-xs text-gray-500">
            {helpText}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p id={`${fieldId}-error`} className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

// Convenience exports for backward compatibility and specific use cases
export const TextareaField = (props: Omit<FormFieldProps, 'type'>) => (
  <FormField {...props} type="textarea" />
)

export const SelectField = (props: Omit<FormFieldProps, 'type'>) => (
  <FormField {...props} type="select" />
)

export const CheckboxField = (props: Omit<FormFieldProps, 'type'>) => (
  <FormField {...props} type="checkbox" />
)

export const SwitchField = (props: Omit<FormFieldProps, 'type'>) => (
  <FormField {...props} type="switch" />
)

export const RadioField = (props: Omit<FormFieldProps, 'type'>) => (
  <FormField {...props} type="radio" />
)

export const PasswordField = (props: Omit<FormFieldProps, 'type'>) => (
  <FormField {...props} type="password" showPasswordToggle />
)