/**
 * Field Path Resolution Utilities for Structured AI Processing
 * 
 * This module provides utilities for navigating and manipulating nested structured data
 * using dot notation field paths (e.g., "assessment_results.wisc_scores.verbal_iq").
 */

import { FieldSchema, SectionSchema } from './structured-schemas';

export interface FieldPathResolver {
  getFieldValue(data: any, path: string): any;
  setFieldValue(data: any, path: string, value: any): any;
  validateFieldPath(path: string, schema: SectionSchema): boolean;
  getFieldSchema(path: string, schema: SectionSchema): FieldSchema | null;
  hasFieldPath(data: any, path: string): boolean;
  deleteFieldPath(data: any, path: string): any;
}

export interface FieldPathValidationResult {
  isValid: boolean;
  errors: string[];
  fieldSchema?: FieldSchema;
  pathSegments: string[];
}

/**
 * Implementation of field path resolution with comprehensive error handling
 * and support for complex nested structures including arrays and objects.
 */
export class StructuredFieldPathResolver implements FieldPathResolver {
  
  /**
   * Gets a value from nested data using dot notation path
   * Supports array indices: "tests.0.score" or "items[2].name"
   */
  getFieldValue(data: any, path: string): any {
    if (!data || !path) return undefined;
    
    const parts = this.parseFieldPath(path);
    let current = data;
    
    for (const part of parts) {
      if (current == null) return undefined;
      
      if (part.isArrayIndex) {
        if (!Array.isArray(current)) {
          return undefined;
        }
        if (part.index >= current.length || part.index < 0) {
          return undefined;
        }
        current = current[part.index];
      } else {
        if (typeof current !== 'object' || Array.isArray(current)) {
          return undefined;
        }
        current = current[part.key];
      }
    }
    
    return current;
  }

  /**
   * Sets a value in nested data using dot notation path
   * Creates intermediate objects/arrays as needed
   */
  setFieldValue(data: any, path: string, value: any): any {
    if (!path) throw new Error('Field path cannot be empty');
    
    const parts = this.parseFieldPath(path);
    const result = this.deepClone(data) || {};
    let current = result;
    
    // Navigate to the parent of the target field
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const nextPart = parts[i + 1];
      
      if (part.isArrayIndex) {
        if (!Array.isArray(current)) {
          throw new Error(`Expected array at path segment "${this.reconstructPath(parts.slice(0, i + 1))}"`);
        }
        
        // Extend array if necessary
        while (current.length <= part.index) {
          current.push(nextPart.isArrayIndex ? [] : {});
        }
        current = current[part.index];
      } else {
        if (current[part.key] == null) {
          // Create appropriate container based on next part
          current[part.key] = nextPart.isArrayIndex ? [] : {};
        }
        current = current[part.key];
      }
    }
    
    // Set the final value
    const lastPart = parts[parts.length - 1];
    if (lastPart.isArrayIndex) {
      if (!Array.isArray(current)) {
        throw new Error(`Expected array at final path segment`);
      }
      while (current.length <= lastPart.index) {
        current.push(null);
      }
      current[lastPart.index] = value;
    } else {
      current[lastPart.key] = value;
    }
    
    return result;
  }

  /**
   * Validates if a field path exists in the schema
   */
  validateFieldPath(path: string, schema: SectionSchema): boolean {
    const result = this.validateFieldPathDetailed(path, schema);
    return result.isValid;
  }

  /**
   * Provides detailed validation of a field path against schema
   */
  validateFieldPathDetailed(path: string, schema: SectionSchema): FieldPathValidationResult {
    const errors: string[] = [];
    
    if (!path) {
      return {
        isValid: false,
        errors: ['Field path cannot be empty'],
        pathSegments: []
      };
    }

    if (!schema || !schema.fields) {
      return {
        isValid: false,
        errors: ['Schema is invalid or missing fields'],
        pathSegments: []
      };
    }

    try {
      const parts = this.parseFieldPath(path);
      const pathSegments = parts.map(p => p.isArrayIndex ? `[${p.index}]` : p.key);
      const fieldSchema = this.getFieldSchema(path, schema);
      
      if (!fieldSchema) {
        return {
          isValid: false,
          errors: [`Field path "${path}" does not exist in schema`],
          pathSegments
        };
      }

      return {
        isValid: true,
        errors: [],
        fieldSchema,
        pathSegments
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
        pathSegments: []
      };
    }
  }

  /**
   * Gets the field schema for a given path
   */
  getFieldSchema(path: string, schema: SectionSchema): FieldSchema | null {
    if (!path || !schema?.fields) return null;
    
    try {
      const parts = this.parseFieldPath(path);
      let currentFields = schema.fields;
      let currentField: FieldSchema | null = null;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        // Skip array indices - they don't change the field schema
        if (part.isArrayIndex) {
          continue;
        }
        
        // Find the field in current level
        currentField = currentFields.find(f => f.key === part.key) || null;
        if (!currentField) return null;
        
        // If this is the last part, return the field
        if (i === parts.length - 1) {
          return currentField;
        }
        
        // Navigate deeper for object types
        if (currentField.type === 'object' && currentField.children) {
          currentFields = currentField.children;
        } else if (currentField.type === 'array') {
          // For arrays, continue with the same field schema
          continue;
        } else {
          // Can't navigate deeper into primitive types
          return null;
        }
      }
      
      return currentField;
    } catch {
      return null;
    }
  }

  /**
   * Checks if a field path exists in the data (not schema)
   */
  hasFieldPath(data: any, path: string): boolean {
    try {
      const value = this.getFieldValue(data, path);
      return value !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Deletes a field path from data
   */
  deleteFieldPath(data: any, path: string): any {
    if (!data || !path) return data;
    
    try {
      const parts = this.parseFieldPath(path);
      const result = this.deepClone(data);
      let current = result;
      
      // Navigate to parent
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        
        if (part.isArrayIndex) {
          if (!Array.isArray(current) || part.index >= current.length) {
            return result; // Path doesn't exist
          }
          current = current[part.index];
        } else {
          if (!current || typeof current !== 'object' || !current.hasOwnProperty(part.key)) {
            return result; // Path doesn't exist
          }
          current = current[part.key];
        }
      }
      
      // Delete the final field
      const lastPart = parts[parts.length - 1];
      if (lastPart.isArrayIndex) {
        if (Array.isArray(current) && lastPart.index < current.length) {
          current.splice(lastPart.index, 1);
        }
      } else {
        if (current && typeof current === 'object') {
          delete current[lastPart.key];
        }
      }
      
      return result;
    } catch {
      return data; // Return original data if deletion fails
    }
  }

  /**
   * Parses a field path into structured parts
   * Supports both dot notation and bracket notation for arrays
   */
  private parseFieldPath(path: string): PathPart[] {
    const parts: PathPart[] = [];
    const segments = path.split('.');
    
    for (const segment of segments) {
      // Check for array notation: "field[0]" or just "0"
      const arrayMatch = segment.match(/^(.+)\[(\d+)\]$/) || segment.match(/^(\d+)$/);
      
      if (arrayMatch) {
        if (arrayMatch[1] && arrayMatch[1] !== segment) {
          // "field[0]" case - add field first, then index
          parts.push({ key: arrayMatch[1], isArrayIndex: false, index: -1 });
          parts.push({ key: '', isArrayIndex: true, index: parseInt(arrayMatch[2], 10) });
        } else {
          // "0" case - just the index
          parts.push({ key: '', isArrayIndex: true, index: parseInt(arrayMatch[1] || arrayMatch[2], 10) });
        }
      } else {
        // Regular field name
        parts.push({ key: segment, isArrayIndex: false, index: -1 });
      }
    }
    
    return parts;
  }

  /**
   * Reconstructs a path from parsed parts
   */
  private reconstructPath(parts: PathPart[]): string {
    return parts.map(part => 
      part.isArrayIndex ? `[${part.index}]` : part.key
    ).join('.');
  }

  /**
   * Deep clones an object to avoid mutations
   */
  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (Array.isArray(obj)) return obj.map(item => this.deepClone(item));
    
    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }
}

/**
 * Internal interface for parsed path parts
 */
interface PathPart {
  key: string;
  isArrayIndex: boolean;
  index: number;
}

/**
 * Utility functions for common field path operations
 */
export class FieldPathUtils {
  private static resolver = new StructuredFieldPathResolver();

  /**
   * Quick access to get a field value
   */
  static getValue(data: any, path: string): any {
    return this.resolver.getFieldValue(data, path);
  }

  /**
   * Quick access to set a field value
   */
  static setValue(data: any, path: string, value: any): any {
    return this.resolver.setFieldValue(data, path, value);
  }

  /**
   * Quick access to check if path exists
   */
  static hasPath(data: any, path: string): boolean {
    return this.resolver.hasFieldPath(data, path);
  }

  /**
   * Quick access to validate path against schema
   */
  static isValidPath(path: string, schema: SectionSchema): boolean {
    return this.resolver.validateFieldPath(path, schema);
  }

  /**
   * Get all field paths from a schema (useful for debugging/testing)
   */
  static getAllFieldPaths(schema: SectionSchema): string[] {
    const paths: string[] = [];
    
    function collectPaths(fields: FieldSchema[], prefix = '') {
      for (const field of fields) {
        const currentPath = prefix ? `${prefix}.${field.key}` : field.key;
        paths.push(currentPath);
        
        if (field.type === 'object' && field.children) {
          collectPaths(field.children, currentPath);
        } else if (field.type === 'array') {
          // Add example array path
          paths.push(`${currentPath}.0`);
        }
      }
    }
    
    if (schema.fields) {
      collectPaths(schema.fields);
    }
    
    return paths;
  }

  /**
   * Compare two data objects and return changed field paths
   */
  static getChangedPaths(oldData: any, newData: any, schema: SectionSchema): string[] {
    const allPaths = this.getAllFieldPaths(schema);
    const changedPaths: string[] = [];
    
    for (const path of allPaths) {
      const oldValue = this.getValue(oldData, path);
      const newValue = this.getValue(newData, path);
      
      if (!this.deepEqual(oldValue, newValue)) {
        changedPaths.push(path);
      }
    }
    
    return changedPaths;
  }

  /**
   * Deep equality check for values
   */
  private static deepEqual(a: any, b: any): boolean {
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
      }
      
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
    
    return false;
  }
}

// Export singleton instance for convenience
export const fieldPathResolver = new StructuredFieldPathResolver();