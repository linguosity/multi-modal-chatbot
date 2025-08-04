import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { tokens, type ColorVariant, type SizeVariant, type SpacingScale, type TypographyScale } from '../design-tokens'

/**
 * Utility function to merge Tailwind classes with proper precedence
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate consistent component classes based on design tokens
 */
export interface ComponentVariantProps {
  variant?: ColorVariant
  size?: SizeVariant
  disabled?: boolean
  loading?: boolean
  className?: string
}

/**
 * Button component class generator
 */
export function getButtonClasses({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className
}: ComponentVariantProps = {}): string {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  
  const variantClasses: Record<ColorVariant, string> = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white border-primary-600 focus:ring-primary-500',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 focus:ring-primary-500',
    success: 'bg-green-600 hover:bg-green-700 text-white border-green-600 focus:ring-green-500',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 focus:ring-yellow-500',
    error: 'bg-red-600 hover:bg-red-700 text-white border-red-600 focus:ring-red-500',
    info: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500 focus:ring-blue-500',
    clinical: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 focus:ring-indigo-500'
  }
  
  const sizeClasses: Record<SizeVariant, string> = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-md',
    lg: 'px-6 py-3 text-lg rounded-lg',
    xl: 'px-8 py-4 text-xl rounded-lg'
  }
  
  const stateClasses = cn({
    'opacity-50 cursor-not-allowed': disabled,
    'cursor-wait': loading
  })
  
  return cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    stateClasses,
    'border', // Ensure border is always present
    className
  )
}

/**
 * Card component class generator
 */
export function getCardClasses({
  variant = 'default',
  className
}: {
  variant?: 'default' | 'elevated' | 'bordered' | 'clinical'
  className?: string
} = {}): string {
  const baseClasses = 'bg-white rounded-lg'
  
  const variantClasses = {
    default: 'border border-gray-200',
    elevated: 'shadow-md border border-gray-100',
    bordered: 'border-2 border-gray-200',
    clinical: 'border border-gray-200 shadow-sm bg-gray-50/50'
  }
  
  return cn(baseClasses, variantClasses[variant], className)
}

/**
 * Form field class generator
 */
export function getFormFieldClasses({
  hasError = false,
  disabled = false,
  className
}: {
  hasError?: boolean
  disabled?: boolean
  className?: string
} = {}): string {
  const baseClasses = 'block w-full rounded-md border px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const stateClasses = cn({
    'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500': hasError,
    'border-gray-300 focus:border-primary-500 focus:ring-primary-500': !hasError && !disabled,
    'bg-gray-50 text-gray-500 cursor-not-allowed': disabled
  })
  
  return cn(baseClasses, stateClasses, className)
}

/**
 * Modal class generator
 */
export function getModalClasses({
  size = 'md',
  className
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
} = {}): string {
  const baseClasses = 'relative bg-white rounded-lg shadow-xl'
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4'
  }
  
  return cn(baseClasses, sizeClasses[size], className)
}

/**
 * Text class generator for consistent typography
 */
export function getTextClasses({
  size = 'base',
  weight = 'normal',
  color = 'gray-900',
  className
}: {
  size?: TypographyScale
  weight?: keyof typeof tokens.typography.weights
  color?: string
  className?: string
} = {}): string {
  const sizeClass = `text-${size}`
  const weightClass = `font-${weight}`
  const colorClass = `text-${color}`
  
  return cn(sizeClass, weightClass, colorClass, className)
}

/**
 * Spacing class generator
 */
export function getSpacingClasses({
  p, px, py, pt, pr, pb, pl,
  m, mx, my, mt, mr, mb, ml,
  className
}: {
  p?: SpacingScale
  px?: SpacingScale
  py?: SpacingScale
  pt?: SpacingScale
  pr?: SpacingScale
  pb?: SpacingScale
  pl?: SpacingScale
  m?: SpacingScale
  mx?: SpacingScale
  my?: SpacingScale
  mt?: SpacingScale
  mr?: SpacingScale
  mb?: SpacingScale
  ml?: SpacingScale
  className?: string
} = {}): string {
  const spacingMap: Record<SpacingScale, string> = {
    xs: '1',
    sm: '2',
    md: '4',
    lg: '6',
    xl: '8',
    '2xl': '12',
    '3xl': '16',
    '4xl': '24'
  }
  
  const classes = []
  
  if (p) classes.push(`p-${spacingMap[p]}`)
  if (px) classes.push(`px-${spacingMap[px]}`)
  if (py) classes.push(`py-${spacingMap[py]}`)
  if (pt) classes.push(`pt-${spacingMap[pt]}`)
  if (pr) classes.push(`pr-${spacingMap[pr]}`)
  if (pb) classes.push(`pb-${spacingMap[pb]}`)
  if (pl) classes.push(`pl-${spacingMap[pl]}`)
  
  if (m) classes.push(`m-${spacingMap[m]}`)
  if (mx) classes.push(`mx-${spacingMap[mx]}`)
  if (my) classes.push(`my-${spacingMap[my]}`)
  if (mt) classes.push(`mt-${spacingMap[mt]}`)
  if (mr) classes.push(`mr-${spacingMap[mr]}`)
  if (mb) classes.push(`mb-${spacingMap[mb]}`)
  if (ml) classes.push(`ml-${spacingMap[ml]}`)
  
  return cn(...classes, className)
}

/**
 * Status indicator class generator for clinical data
 */
export function getStatusClasses({
  status,
  size = 'md',
  className
}: {
  status: 'success' | 'warning' | 'error' | 'info' | 'clinical' | 'incomplete'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}): string {
  const baseClasses = 'inline-flex items-center font-medium rounded-full'
  
  const statusClasses = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    clinical: 'bg-indigo-100 text-indigo-800',
    incomplete: 'bg-gray-100 text-gray-600'
  }
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  }
  
  return cn(baseClasses, statusClasses[status], sizeClasses[size], className)
}

/**
 * Focus ring utility for accessibility
 */
export function getFocusRingClasses(color: ColorVariant = 'primary'): string {
  const colorMap: Record<ColorVariant, string> = {
    primary: 'focus:ring-primary-500',
    secondary: 'focus:ring-gray-500',
    success: 'focus:ring-green-500',
    warning: 'focus:ring-yellow-500',
    error: 'focus:ring-red-500',
    info: 'focus:ring-blue-500',
    clinical: 'focus:ring-indigo-500'
  }
  
  return cn('focus:outline-none focus:ring-2 focus:ring-offset-2', colorMap[color])
}