import { useCallback, useState } from 'react'

export interface ValidationRule {
  /** Rule identifier */
  id: string
  /** Validation function */
  validate: (content: string) => string | null
  /** Whether this rule is required */
  required?: boolean
}

export interface UseEditorValidationOptions {
  /** Validation rules */
  rules?: ValidationRule[]
  /** Whether to validate on change */
  validateOnChange?: boolean
  /** Whether to validate on blur */
  validateOnBlur?: boolean
  /** Custom validation function */
  customValidator?: (content: string) => Record<string, string>
}

export interface UseEditorValidationReturn {
  /** Current validation errors */
  errors: Record<string, string>
  /** Whether the content is valid */
  isValid: boolean
  /** Validate content manually */
  validate: (content: string) => boolean
  /** Clear all validation errors */
  clearErrors: () => void
  /** Set a specific error */
  setError: (key: string, message: string) => void
  /** Clear a specific error */
  clearError: (key: string) => void
}

export function useEditorValidation({
  rules = [],
  validateOnChange = true,
  validateOnBlur = true,
  customValidator
}: UseEditorValidationOptions = {}): UseEditorValidationReturn {
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validate content
  const validate = useCallback(
    (content: string): boolean => {
      const newErrors: Record<string, string> = {}

      // Run built-in rules
      for (const rule of rules) {
        const error = rule.validate(content)
        if (error) {
          newErrors[rule.id] = error
        }
      }

      // Run custom validator
      if (customValidator) {
        const customErrors = customValidator(content)
        Object.assign(newErrors, customErrors)
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    },
    [rules, customValidator]
  )

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  // Set specific error
  const setError = useCallback((key: string, message: string) => {
    setErrors(prev => ({ ...prev, [key]: message }))
  }, [])

  // Clear specific error
  const clearError = useCallback((key: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[key]
      return newErrors
    })
  }, [])

  const isValid = Object.keys(errors).length === 0

  return {
    errors,
    isValid,
    validate,
    clearErrors,
    setError,
    clearError
  }
}

// Common validation rules
export const commonValidationRules = {
  required: (fieldName: string): ValidationRule => ({
    id: 'required',
    validate: (content: string) => {
      const trimmed = content.trim()
      return trimmed.length === 0 ? `${fieldName} is required` : null
    },
    required: true
  }),

  minLength: (min: number, fieldName: string): ValidationRule => ({
    id: 'minLength',
    validate: (content: string) => {
      return content.length < min 
        ? `${fieldName} must be at least ${min} characters` 
        : null
    }
  }),

  maxLength: (max: number, fieldName: string): ValidationRule => ({
    id: 'maxLength',
    validate: (content: string) => {
      return content.length > max 
        ? `${fieldName} must be no more than ${max} characters` 
        : null
    }
  }),

  wordCount: (min: number, max: number, fieldName: string): ValidationRule => ({
    id: 'wordCount',
    validate: (content: string) => {
      const words = content.trim().split(/\s+/).filter(word => word.length > 0)
      const count = words.length
      
      if (count < min) {
        return `${fieldName} must have at least ${min} words`
      }
      if (count > max) {
        return `${fieldName} must have no more than ${max} words`
      }
      return null
    }
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    id: 'pattern',
    validate: (content: string) => {
      return regex.test(content) ? null : message
    }
  }),

  noEmptyLines: (fieldName: string): ValidationRule => ({
    id: 'noEmptyLines',
    validate: (content: string) => {
      const hasEmptyLines = /\n\s*\n/.test(content)
      return hasEmptyLines ? `${fieldName} should not contain empty lines` : null
    }
  }),

  professionalTone: (fieldName: string): ValidationRule => ({
    id: 'professionalTone',
    validate: (content: string) => {
      // Simple check for unprofessional words/phrases
      const unprofessionalWords = ['very', 'really', 'totally', 'awesome', 'cool']
      const lowerContent = content.toLowerCase()
      
      for (const word of unprofessionalWords) {
        if (lowerContent.includes(word)) {
          return `${fieldName} should maintain a professional tone. Consider replacing "${word}"`
        }
      }
      return null
    }
  })
}