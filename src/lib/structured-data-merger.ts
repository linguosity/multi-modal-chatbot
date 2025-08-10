/**
 * Smart field-level merging system for structured AI processing
 * Handles replace, append, and merge strategies with type-aware operations
 */

export type MergeStrategy = 'replace' | 'append' | 'merge';

export interface FieldSchema {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  options?: string[];
  children?: FieldSchema[];
  description?: string;
}

export interface MergeResult {
  success: boolean;
  mergedValue: any;
  conflicts?: ConflictInfo[];
  warnings?: string[];
  metadata: {
    originalValue: any;
    strategy: MergeStrategy;
    timestamp: string;
    confidence?: number;
  };
}

export interface ConflictInfo {
  field_path: string;
  conflict_type: 'type_mismatch' | 'value_conflict' | 'schema_violation';
  current_value: any;
  new_value: any;
  suggested_resolution: any;
  description: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MergeEngine {
  mergeFieldUpdate(
    currentValue: any,
    newValue: any,
    strategy: MergeStrategy,
    fieldSchema: FieldSchema,
    confidence?: number
  ): MergeResult;
}

/**
 * Core implementation of the structured data merging system
 */
export class StructuredDataMerger implements MergeEngine {
  private conflictThreshold: number = 0.7; // Confidence threshold for conflict detection

  constructor(conflictThreshold?: number) {
    if (conflictThreshold !== undefined) {
      this.conflictThreshold = conflictThreshold;
    }
  }

  /**
   * Main entry point for merging field updates
   */
  mergeFieldUpdate(
    currentValue: any,
    newValue: any,
    strategy: MergeStrategy,
    fieldSchema: FieldSchema,
    confidence?: number
  ): MergeResult {
    try {
      switch (strategy) {
        case 'replace':
          return this.replaceValue(currentValue, newValue, fieldSchema, confidence);
        case 'append':
          return this.appendValue(currentValue, newValue, fieldSchema, confidence);
        case 'merge':
          return this.mergeValue(currentValue, newValue, fieldSchema, confidence);
        default:
          throw new Error(`Unknown merge strategy: ${strategy}`);
      }
    } catch (error) {
      return {
        success: false,
        mergedValue: currentValue,
        warnings: [`Merge failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        metadata: {
          originalValue: currentValue,
          strategy,
          timestamp: new Date().toISOString(),
          confidence
        }
      };
    }
  }

  /**
   * Replace strategy: completely overwrite the existing value
   */
  private replaceValue(
    current: any,
    newVal: any,
    schema: FieldSchema,
    confidence?: number
  ): MergeResult {
    const validationResult = this.validateFieldValue(newVal, schema);
    const conflicts: ConflictInfo[] = [];
    const warnings: string[] = [];

    // Check for validation errors
    if (!validationResult.valid) {
      return {
        success: false,
        mergedValue: current,
        warnings: validationResult.errors,
        metadata: {
          originalValue: current,
          strategy: 'replace',
          timestamp: new Date().toISOString(),
          confidence
        }
      };
    }

    // Add validation warnings
    warnings.push(...validationResult.warnings);

    // Detect potential conflicts based on confidence and value differences
    if (confidence !== undefined && confidence < this.conflictThreshold && current !== null && current !== undefined) {
      conflicts.push({
        field_path: schema.key,
        conflict_type: 'value_conflict',
        current_value: current,
        new_value: newVal,
        suggested_resolution: newVal,
        description: `Low confidence (${Math.round(confidence * 100)}%) replacement of existing value`
      });
    }

    return {
      success: true,
      mergedValue: newVal,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        originalValue: current,
        strategy: 'replace',
        timestamp: new Date().toISOString(),
        confidence
      }
    };
  }

  /**
   * Append strategy: add to existing arrays or concatenate strings
   */
  private appendValue(
    current: any,
    newVal: any,
    schema: FieldSchema,
    confidence?: number
  ): MergeResult {
    const warnings: string[] = [];
    const conflicts: ConflictInfo[] = [];

    if (schema.type === 'array') {
      const currentArray = Array.isArray(current) ? current : [];
      const newArray = Array.isArray(newVal) ? newVal : [newVal];
      
      // Remove duplicates while preserving order
      const merged = [...currentArray];
      const addedItems: any[] = [];
      
      newArray.forEach(item => {
        if (!merged.some(existing => this.deepEqual(existing, item))) {
          merged.push(item);
          addedItems.push(item);
        }
      });

      // Check if any items were skipped due to duplicates
      if (addedItems.length < newArray.length) {
        warnings.push(`${newArray.length - addedItems.length} duplicate items were skipped during append`);
      }

      return {
        success: true,
        mergedValue: merged,
        warnings: warnings.length > 0 ? warnings : undefined,
        metadata: {
          originalValue: current,
          strategy: 'append',
          timestamp: new Date().toISOString(),
          confidence
        }
      };
    } else if (schema.type === 'string') {
      const currentStr = current || '';
      const newStr = String(newVal);
      
      // Smart concatenation with appropriate separators
      let separator = '';
      if (currentStr && !currentStr.endsWith('.') && !currentStr.endsWith('\n') && !currentStr.endsWith(' ')) {
        separator = currentStr.endsWith(',') ? ' ' : '. ';
      }
      
      const merged = currentStr + separator + newStr;

      return {
        success: true,
        mergedValue: merged,
        metadata: {
          originalValue: current,
          strategy: 'append',
          timestamp: new Date().toISOString(),
          confidence
        }
      };
    }

    // For non-appendable types, fall back to replace with warning
    warnings.push(`Cannot append to ${schema.type} field, falling back to replace strategy`);
    const replaceResult = this.replaceValue(current, newVal, schema, confidence);
    
    return {
      ...replaceResult,
      warnings: [...(replaceResult.warnings || []), ...warnings]
    };
  }

  /**
   * Merge strategy: intelligently combine objects while preserving existing properties
   */
  private mergeValue(
    current: any,
    newVal: any,
    schema: FieldSchema,
    confidence?: number
  ): MergeResult {
    const warnings: string[] = [];
    const conflicts: ConflictInfo[] = [];

    if (schema.type === 'object' && schema.children) {
      const currentObj = current || {};
      const newObj = newVal || {};
      const merged = { ...currentObj };

      // Merge each property according to its schema
      schema.children.forEach(childSchema => {
        if (newObj.hasOwnProperty(childSchema.key)) {
          const childResult = this.mergeFieldUpdate(
            currentObj[childSchema.key],
            newObj[childSchema.key],
            'merge',
            childSchema,
            confidence
          );
          
          if (childResult.success) {
            merged[childSchema.key] = childResult.mergedValue;
          } else {
            warnings.push(`Failed to merge child field ${childSchema.key}: ${childResult.warnings?.join(', ')}`);
          }

          // Propagate conflicts and warnings from child merges
          if (childResult.conflicts) {
            conflicts.push(...childResult.conflicts);
          }
          if (childResult.warnings) {
            warnings.push(...childResult.warnings);
          }
        }
      });

      // Handle properties in newObj that aren't in the schema
      Object.keys(newObj).forEach(key => {
        if (!schema.children!.some(child => child.key === key)) {
          warnings.push(`Property '${key}' not found in schema, adding without validation`);
          merged[key] = newObj[key];
        }
      });

      return {
        success: true,
        mergedValue: merged,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        metadata: {
          originalValue: current,
          strategy: 'merge',
          timestamp: new Date().toISOString(),
          confidence
        }
      };
    } else if (schema.type === 'array') {
      // For arrays in merge mode, use append logic
      return this.appendValue(current, newVal, schema, confidence);
    }

    // For primitive types, fall back to replace with warning
    warnings.push(`Cannot merge ${schema.type} field, falling back to replace strategy`);
    const replaceResult = this.replaceValue(current, newVal, schema, confidence);
    
    return {
      ...replaceResult,
      warnings: [...(replaceResult.warnings || []), ...warnings]
    };
  }

  /**
   * Validate field value against schema constraints
   */
  private validateFieldValue(value: any, schema: FieldSchema): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Handle null/undefined values
    if (value === null || value === undefined) {
      if (schema.required) {
        errors.push(`Field '${schema.key}' is required but received ${value}`);
      }
      return { valid: errors.length === 0, errors, warnings };
    }

    // Type validation with coercion attempts
    switch (schema.type) {
      case 'string':
        if (typeof value !== 'string') {
          // Attempt coercion
          try {
            const coerced = String(value);
            warnings.push(`Coerced ${typeof value} to string: "${coerced}"`);
          } catch {
            errors.push(`Expected string, got ${typeof value} and coercion failed`);
          }
        }
        break;
        
      case 'number':
        if (typeof value !== 'number') {
          // Attempt coercion
          const coerced = Number(value);
          if (isNaN(coerced)) {
            errors.push(`Expected number, got ${typeof value} and coercion failed`);
          } else {
            warnings.push(`Coerced ${typeof value} to number: ${coerced}`);
          }
        } else if (isNaN(value)) {
          errors.push(`Number value is NaN`);
        }
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          // Attempt coercion for common boolean representations
          if (value === 'true' || value === 'false' || value === 1 || value === 0) {
            warnings.push(`Coerced ${typeof value} to boolean`);
          } else {
            errors.push(`Expected boolean, got ${typeof value}`);
          }
        }
        break;
        
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`Expected array, got ${typeof value}`);
        }
        break;
        
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push(`Expected object, got ${typeof value}`);
        }
        break;
    }

    // Enum validation
    if (schema.options && schema.options.length > 0) {
      const stringValue = String(value);
      if (!schema.options.includes(stringValue)) {
        errors.push(`Value "${stringValue}" not in allowed options: ${schema.options.join(', ')}`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Deep equality check for duplicate detection
   */
  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      
      if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
          if (!this.deepEqual(a[i], b[i])) return false;
        }
        return true;
      } else {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        
        for (const key of keysA) {
          if (!keysB.includes(key) || !this.deepEqual(a[key], b[key])) {
            return false;
          }
        }
        return true;
      }
    }
    
    return false;
  }

  /**
   * Batch merge multiple field updates
   */
  batchMerge(updates: Array<{
    currentValue: any;
    newValue: any;
    strategy: MergeStrategy;
    fieldSchema: FieldSchema;
    confidence?: number;
  }>): Array<MergeResult> {
    return updates.map(update => 
      this.mergeFieldUpdate(
        update.currentValue,
        update.newValue,
        update.strategy,
        update.fieldSchema,
        update.confidence
      )
    );
  }

  /**
   * Get merge statistics for analysis
   */
  getMergeStatistics(results: MergeResult[]): {
    totalUpdates: number;
    successfulUpdates: number;
    conflictCount: number;
    warningCount: number;
    averageConfidence?: number;
  } {
    const totalUpdates = results.length;
    const successfulUpdates = results.filter(r => r.success).length;
    const conflictCount = results.reduce((sum, r) => sum + (r.conflicts?.length || 0), 0);
    const warningCount = results.reduce((sum, r) => sum + (r.warnings?.length || 0), 0);
    
    const confidenceValues = results
      .map(r => r.metadata.confidence)
      .filter((c): c is number => c !== undefined);
    
    const averageConfidence = confidenceValues.length > 0
      ? confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length
      : undefined;

    return {
      totalUpdates,
      successfulUpdates,
      conflictCount,
      warningCount,
      averageConfidence
    };
  }
}