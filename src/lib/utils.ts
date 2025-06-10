import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility for combining Tailwind CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a unique ID
export function generateId(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length)
}

// Deep merge two objects
export function deepMerge<T>(target: T, source: Partial<T>): T {
  const output = { ...target }
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key as keyof typeof source])) {
        // Ensure target[key] is an object before attempting to merge into it.
        // If target[key] is not an object (e.g., null, undefined, primitive),
        // it should be overwritten by source[key] if source[key] is an object.
        if (isObject(target[key as keyof T])) {
          output[key as keyof T] = deepMerge(
            target[key as keyof T],
            source[key as keyof typeof source] as any
          );
        } else {
          // target[key] is not an object, so source[key] (which is an object) overwrites it.
          Object.assign(output, { [key]: source[key as keyof typeof source] });
        }
      } else {
        // source[key] is not an object (primitive or array), so assign it directly.
        Object.assign(output, { [key]: source[key as keyof typeof source] });
      }
    })
  }
  
  return output
}

// Check if value is an object
function isObject(item: any): item is Record<string, any> {
  return (
    item && typeof item === 'object' && !Array.isArray(item) && item !== null
  )
}

// Highlight occurrences of a text pattern in a string
export function highlightText(text: string, pattern: string): string {
  if (!pattern || !text) return text
  
  const regex = new RegExp(`(${pattern})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// Truncate text to a specific length with ellipsis
export function truncateText(text: string, length: number = 100): string {
  if (!text) return ''
  if (text.length <= length) return text
  
  return text.substring(0, length).trim() + '...'
}

// Parse error message from an error object or string
export function parseErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred'
  
  if (typeof error === 'string') return error
  
  if (error.message) return error.message
  
  if (error.error) return parseErrorMessage(error.error)
  
  return 'An unknown error occurred'
}

// Safe motion number helper to handle NaN or Infinity values that may occur in animation calculations
export function safeMotionNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

// Format a number as a file size (e.g., "1.5 MB")
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
