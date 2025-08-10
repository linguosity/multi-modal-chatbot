/**
 * Data Integrity Guard System
 * 
 * This system prevents the "Russian-doll" structured_data nesting issue
 * and validates field paths to maintain data integrity.
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
  code?: string
  suggestion?: string
}

export interface FieldUpdate {
  section_id: string
  field_path: string
  value: any
  merge_strategy: 'replace' | 'append' | 'merge'
  confidence?: number
  source_reference?: string
}

export interface CleanupResult {
  cleanedData: any
  issuesFound: string[]
  wasCorrupted: boolean
  cleanupActions: string[]
}

export interface StructuredDataIntegritySystem {
  validateFieldPath(fieldPath: string): ValidationResult
  validateUpdate(update: FieldUpdate): ValidationResult
  preventCircularReferences(data: any): any
  cleanCorruptedData(data: any): CleanupResult
}

export class DataIntegrityGuard implements StructuredDataIntegritySystem {
  private readonly FORBIDDEN_FIELD_PATHS = [
    /^structured_data(\.|$)/,
    /^$/,
    /^\s*$/
  ]

  /**
   * Validates field paths to prevent structured_data nesting
   */
  validateFieldPath(fieldPath: string): ValidationResult {
    // Check for null, undefined, or empty paths
    if (!fieldPath || typeof fieldPath !== 'string') {
      return {
        isValid: false,
        error: 'Field path cannot be null, undefined, or empty',
        code: 'INVALID_FIELD_PATH'
      }
    }

    // Check for forbidden patterns that cause Russian-doll nesting
    for (const pattern of this.FORBIDDEN_FIELD_PATHS) {
      if (pattern.test(fieldPath)) {
        return {
          isValid: false,
          error: `Field path "${fieldPath}" is forbidden. Cannot nest structured_data inside itself.`,
          code: 'FORBIDDEN_FIELD_PATH',
          suggestion: 'Use specific field paths like "assessment_results.test_scores.wisc_v.verbal_iq"'
        }
      }
    }

    // Validate path structure
    const pathParts = fieldPath.split('.')
    if (pathParts.some(part => !part.trim())) {
      return {
        isValid: false,
        error: 'Field path contains empty segments',
        code: 'MALFORMED_FIELD_PATH'
      }
    }

    return { isValid: true }
  }

  /**
   * Validates complete field updates
   */
  validateUpdate(update: FieldUpdate): ValidationResult {
    // Validate field path
    const pathValidation = this.validateFieldPath(update.field_path)
    if (!pathValidation.isValid) {
      return pathValidation
    }

    // Validate section ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(update.section_id)) {
      return {
        isValid: false,
        error: `Invalid section ID format: ${update.section_id}`,
        code: 'INVALID_SECTION_ID'
      }
    }

    // Validate merge strategy
    const validStrategies = ['replace', 'append', 'merge']
    if (!validStrategies.includes(update.merge_strategy)) {
      return {
        isValid: false,
        error: `Invalid merge strategy: ${update.merge_strategy}`,
        code: 'INVALID_MERGE_STRATEGY'
      }
    }

    // Validate confidence score
    if (update.confidence !== undefined && (update.confidence < 0 || update.confidence > 1)) {
      return {
        isValid: false,
        error: `Confidence score must be between 0 and 1, got: ${update.confidence}`,
        code: 'INVALID_CONFIDENCE_SCORE'
      }
    }

    return { isValid: true }
  }

  /**
   * Prevents circular references in data structures
   */
  preventCircularReferences(data: any): any {
    if (!data || typeof data !== 'object') return data

    const seen = new WeakSet()
    const path: string[] = []

    function traverse(obj: any, currentPath: string[]): any {
      if (obj === null || typeof obj !== 'object') return obj
      
      // Detect circular reference
      if (seen.has(obj)) {
        console.warn(`[DataIntegrityGuard] Circular reference detected at path: ${currentPath.join('.')}`)
        return '[Circular Reference Removed]'
      }

      seen.add(obj)

      if (Array.isArray(obj)) {
        return obj.map((item, index) => 
          traverse(item, [...currentPath, index.toString()])
        )
      }

      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        const newPath = [...currentPath, key]
        
        // CRITICAL: Prevent Russian-doll structured_data nesting
        if (key === 'structured_data' && currentPath.length > 0) {
          console.warn(`[DataIntegrityGuard] Prevented structured_data nesting at path: ${newPath.join('.')}`)
          continue
        }

        result[key] = traverse(value, newPath)
      }

      seen.delete(obj) // Allow the same object in different branches
      return result
    }

    return traverse(data, [])
  }

  /**
   * Cleans corrupted data with Russian-doll patterns
   */
  cleanCorruptedData(data: any): CleanupResult {
    if (!data || typeof data !== 'object') {
      return { cleanedData: data, issuesFound: [], wasCorrupted: false, cleanupActions: [] }
    }

    const issues: string[] = []
    let wasCorrupted = false

    // Check for Russian-doll pattern
    if (this.hasRussianDollPattern(data)) {
      issues.push('Russian-doll structured_data nesting detected')
      wasCorrupted = true
    }

    // Check for excessive numeric keys (sign of corruption)
    const numericKeys = Object.keys(data).filter(key => /^\d+$/.test(key))
    if (numericKeys.length > 100) {
      issues.push(`Excessive numeric keys detected: ${numericKeys.length}`)
      wasCorrupted = true
    }

    // Clean the data
    const cleanedData = this.performDataCleanup(data, issues)

    return {
      cleanedData,
      issuesFound: issues,
      wasCorrupted,
      cleanupActions: this.getCleanupActions(issues)
    }
  }

  /**
   * Detects Russian-doll pattern in data
   */
  private hasRussianDollPattern(data: any, depth = 0): boolean {
    if (depth > 10) return true // Prevent infinite recursion
    
    if (data && typeof data === 'object' && data.structured_data) {
      return true || this.hasRussianDollPattern(data.structured_data, depth + 1)
    }
    
    return false
  }

  /**
   * Performs actual data cleanup
   */
  private performDataCleanup(data: any, issues: string[]): any {
    if (!data || typeof data !== 'object') return data

    const cleaned: any = {}
    
    for (const [key, value] of Object.entries(data)) {
      // CRITICAL: Skip nested structured_data to prevent Russian-doll issue
      if (key === 'structured_data' && typeof value === 'object') {
        console.warn(`[DataIntegrityGuard] Removed nested structured_data key during cleanup`)
        continue
      }
      
      // Skip excessive numeric keys (likely corruption)
      if (/^\d+$/.test(key) && parseInt(key) > 100) {
        continue
      }
      
      // Recursively clean nested objects
      if (typeof value === 'object' && value !== null) {
        cleaned[key] = this.performDataCleanup(value, issues)
      } else {
        cleaned[key] = value
      }
    }
    
    return cleaned
  }

  /**
   * Gets cleanup actions performed
   */
  private getCleanupActions(issues: string[]): string[] {
    const actions: string[] = []
    
    if (issues.some(issue => issue.includes('Russian-doll'))) {
      actions.push('Removed nested structured_data keys')
    }
    
    if (issues.some(issue => issue.includes('numeric keys'))) {
      actions.push('Removed excessive numeric keys')
    }
    
    return actions
  }
}

// Singleton instance for global use
export const dataIntegrityGuard = new DataIntegrityGuard()

// Immediate fix function for existing API
export function validateAndCleanFieldUpdate(update: FieldUpdate): { isValid: boolean; cleanedUpdate?: FieldUpdate; error?: string } {
  const guard = new DataIntegrityGuard()
  
  // Validate the update
  const validation = guard.validateUpdate(update)
  if (!validation.isValid) {
    return { isValid: false, error: validation.error }
  }

  // Clean the value if it's an object
  if (typeof update.value === 'object' && update.value !== null) {
    const cleanupResult = guard.cleanCorruptedData(update.value)
    if (cleanupResult.wasCorrupted) {
      console.warn(`[DataIntegrityGuard] Cleaned corrupted data in field update:`, cleanupResult.issuesFound)
      return {
        isValid: true,
        cleanedUpdate: {
          ...update,
          value: cleanupResult.cleanedData
        }
      }
    }
  }

  return { isValid: true, cleanedUpdate: update }
}