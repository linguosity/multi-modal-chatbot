import { useState, useCallback, useMemo } from 'react'

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
  message?: string
}

export interface FormField {
  name: string
  value: any
  rules?: ValidationRule[]
}

export interface ValidationError {
  field: string
  message: string
}

export interface FormValidationState {
  errors: Record<string, string>
  touched: Record<string, boolean>
  isValid: boolean
  isValidating: boolean
}

export interface FormValidationActions {
  validateField: (name: string, value: any, rules?: ValidationRule[]) => string | null
  validateForm: (fields: FormField[]) => ValidationError[]
  setFieldTouched: (name: string, touched?: boolean) => void
  setFieldError: (name: string, error: string | null) => void
  clearErrors: () => void
  reset: () => void
}

export function useFormValidation(initialFields: FormField[] = []): [FormValidationState, FormValidationActions] {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isValidating, setIsValidating] = useState(false)

  // Memoized validation state
  const state = useMemo<FormValidationState>(() => ({
    errors,
    touched,
    isValid: Object.keys(errors).length === 0,
    isValidating
  }), [errors, touched, isValidating])

  // Validate a single field
  const validateField = useCallback((name: string, value: any, rules: ValidationRule[] = []): string | null => {
    for (const rule of rules) {
      // Required validation
      if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
        return rule.message || `${name} is required`
      }

      // Skip other validations if value is empty and not required
      if (!value || (typeof value === 'string' && !value.trim())) {
        continue
      }

      // Min length validation
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        return rule.message || `${name} must be at least ${rule.minLength} characters`
      }

      // Max length validation
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        return rule.message || `${name} must be no more than ${rule.maxLength} characters`
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        return rule.message || `${name} format is invalid`
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value)
        if (customError) {
          return customError
        }
      }
    }

    return null
  }, [])

  // Validate entire form
  const validateForm = useCallback((fields: FormField[]): ValidationError[] => {
    setIsValidating(true)
    const validationErrors: ValidationError[] = []
    const newErrors: Record<string, string> = {}

    for (const field of fields) {
      const error = validateField(field.name, field.value, field.rules)
      if (error) {
        validationErrors.push({ field: field.name, message: error })
        newErrors[field.name] = error
      }
    }

    setErrors(newErrors)
    setIsValidating(false)
    return validationErrors
  }, [validateField])

  // Set field as touched
  const setFieldTouched = useCallback((name: string, isTouched = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }))
  }, [])

  // Set field error
  const setFieldError = useCallback((name: string, error: string | null) => {
    setErrors(prev => {
      if (error) {
        return { ...prev, [name]: error }
      } else {
        const { [name]: _, ...rest } = prev
        return rest
      }
    })
  }, [])

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  // Reset form validation state
  const reset = useCallback(() => {
    setErrors({})
    setTouched({})
    setIsValidating(false)
  }, [])

  const actions: FormValidationActions = {
    validateField,
    validateForm,
    setFieldTouched,
    setFieldError,
    clearErrors,
    reset
  }

  return [state, actions]
}

// Common validation rules
export const validationRules = {
  required: (message?: string): ValidationRule => ({
    required: true,
    message
  }),

  email: (message?: string): ValidationRule => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: message || 'Please enter a valid email address'
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    minLength: length,
    message
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    maxLength: length,
    message
  }),

  password: (message?: string): ValidationRule => ({
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    message: message || 'Password must be at least 8 characters with uppercase, lowercase, and number'
  }),

  phone: (message?: string): ValidationRule => ({
    pattern: /^\+?[\d\s\-\(\)]+$/,
    message: message || 'Please enter a valid phone number'
  }),

  url: (message?: string): ValidationRule => ({
    pattern: /^https?:\/\/.+/,
    message: message || 'Please enter a valid URL'
  }),

  custom: (validator: (value: any) => string | null): ValidationRule => ({
    custom: validator
  })
}

// Hook for auto-validation on change
export function useAutoValidation(
  name: string,
  value: any,
  rules: ValidationRule[] = [],
  onError?: (error: string | null) => void
) {
  const [validation] = useFormValidation()
  
  const error = useMemo(() => {
    const validationError = validation.validateField(name, value, rules)
    onError?.(validationError)
    return validationError
  }, [name, value, rules, validation, onError])

  return error
}