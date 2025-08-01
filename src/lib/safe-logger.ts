/**
 * Safe logging utilities to prevent circular reference errors
 */
import { stringify as flattedStringify } from 'flatted';

/**
 * Safely stringify an object, handling circular references with flatted
 */
export function safeStringify(obj: any, space?: number): string {
  try {
    return JSON.stringify(obj, null, space);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('circular')) {
      console.warn('🔄 Circular reference detected, using flatted for safe serialization');
      try {
        return flattedStringify(obj, null, space);
      } catch (flattedError) {
        return '[Flatted Error: ' + flattedError + ']';
      }
    }
    return '[Stringify Error: ' + error + ']';
  }
}

/**
 * Safe console.log that handles circular references
 */
export function safeLog(message: string, obj?: any): void {
  if (obj === undefined) {
    console.log(message);
    return;
  }
  
  try {
    console.log(message, obj);
  } catch (error) {
    console.log(message, safeStringify(obj, 2));
  }
}

/**
 * Safe deep clone that handles circular references
 */
export function safeClone<T>(obj: T): T {
  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Handle primitives
  if (typeof obj !== 'object') {
    return obj;
  }
  
  // First try structuredClone (modern browsers/Node.js) - it handles circular refs natively
  if (typeof structuredClone !== 'undefined') {
    try {
      return structuredClone(obj);
    } catch (structuredCloneError) {
      console.warn('structuredClone failed, trying flatted method');
    }
  }
  
  // Use flatted to handle circular references safely
  try {
    const flattedString = flattedStringify(obj);
    return JSON.parse(flattedString);
  } catch (flattedError) {
    console.warn('Flatted clone failed, using shallow clone as last resort');
    // Last resort: shallow clone
    if (Array.isArray(obj)) {
      return [...obj] as T;
    }
    return { ...obj } as T;
  }
}

/**
 * Check if an object has circular references
 */
export function hasCircularReference(obj: any): boolean {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }
  
  try {
    // Use a more defensive approach with a timeout-like mechanism
    const seen = new WeakSet();
    
    function checkCircular(current: any): boolean {
      if (current === null || current === undefined || typeof current !== 'object') {
        return false;
      }
      
      if (seen.has(current)) {
        return true;
      }
      
      seen.add(current);
      
      try {
        if (Array.isArray(current)) {
          for (const item of current) {
            if (checkCircular(item)) {
              return true;
            }
          }
        } else {
          for (const key in current) {
            if (current.hasOwnProperty(key)) {
              if (checkCircular(current[key])) {
                return true;
              }
            }
          }
        }
      } catch (error) {
        // If we can't iterate, assume it might have circular refs
        return true;
      }
      
      return false;
    }
    
    return checkCircular(obj);
  } catch (error) {
    // If our check fails, assume there might be circular references
    return true;
  }
}