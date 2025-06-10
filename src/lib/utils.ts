import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility for combining Tailwind CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date as a string (e.g., "Jan 1, 2023")
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Generate a unique ID
export function generateId(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length)
}

// Calculate age from date of birth
export function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}

// Deep merge two objects
export function deepMerge<T>(target: T, source: Partial<T>): T {
  const output = { ...target }
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key as keyof typeof source])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key as keyof typeof source] })
        } else {
          output[key as keyof T] = deepMerge(
            target[key as keyof T],
            source[key as keyof typeof source] as any
          )
        }
      } else {
        Object.assign(output, { [key]: source[key as keyof typeof source] })
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
