import { NextResponse } from 'next/server'

/**
 * Safely stringify JSON data, handling circular references
 */
export function safeStringify(data: any, space?: number): string {
  const seen = new WeakSet()
  
  return JSON.stringify(data, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]'
      }
      seen.add(value)
    }
    return value
  }, space)
}

/**
 * Create a NextResponse with safe JSON serialization
 */
export function safeJsonResponse<T = any>(data: T, init?: ResponseInit): NextResponse<T> {
  try {
    return NextResponse.json(data, init)
  } catch (error) {
    console.error('JSON serialization error:', error)
    
    // Fallback to safe stringify
    const safeData = safeStringify(data)
    return new NextResponse(safeData, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers
      }
    }) as NextResponse<T>
  }
}

/**
 * Remove circular references from an object
 */
export function removeCircularReferences<T>(obj: T): T {
  const seen = new WeakSet()
  
  function clean(value: any): any {
    if (typeof value !== 'object' || value === null) {
      return value
    }
    
    if (seen.has(value)) {
      return '[Circular Reference]'
    }
    
    seen.add(value)
    
    if (Array.isArray(value)) {
      return value.map(clean)
    }
    
    const cleaned: any = {}
    for (const [key, val] of Object.entries(value)) {
      cleaned[key] = clean(val)
    }
    
    return cleaned
  }
  
  return clean(obj)
}