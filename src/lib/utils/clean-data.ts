/**
 * Utility functions to clean data and prevent circular references
 */

export function removeCircularReferences(obj: any, seen = new WeakSet()): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (seen.has(obj)) {
    return '[Circular Reference]';
  }

  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map(item => removeCircularReferences(item, seen));
  }

  const cleaned: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cleaned[key] = removeCircularReferences(obj[key], seen);
    }
  }

  return cleaned;
}

export function safeStringify(obj: any, space?: number): string {
  try {
    return JSON.stringify(obj, null, space);
  } catch (error) {
    // If JSON.stringify fails due to circular references, clean the object first
    const cleaned = removeCircularReferences(obj);
    try {
      return JSON.stringify(cleaned, null, space);
    } catch (secondError) {
      return '[Object with circular references - could not stringify]';
    }
  }
}

export function hasCircularReference(obj: any, seen = new WeakSet()): boolean {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  if (seen.has(obj)) {
    return true;
  }

  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.some(item => hasCircularReference(item, seen));
  }

  for (const key in obj) {
    if (obj.hasOwnProperty(key) && hasCircularReference(obj[key], seen)) {
      return true;
    }
  }

  return false;
}