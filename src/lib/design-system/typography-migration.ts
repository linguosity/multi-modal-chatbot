/**
 * Typography Migration Utilities
 * 
 * This file contains utilities to help migrate from inconsistent typography
 * to our standardized design system typography scale.
 */

import { tokens, type TypographyScale } from '../design-tokens'

// Mapping of old Tailwind classes to our semantic typography scale
export const typographyMigrationMap: Record<string, TypographyScale> = {
  // Text sizes
  'text-xs': 'xs',      // 12px - Captions, metadata, fine print
  'text-sm': 'sm',      // 14px - Body text, labels, secondary content
  'text-base': 'base',  // 16px - Primary body text, form inputs
  'text-lg': 'lg',      // 18px - Subheadings, emphasized text
  'text-xl': 'xl',      // 20px - Section headings, card titles
  'text-2xl': '2xl',    // 24px - Page headings, modal titles
  'text-3xl': '3xl',    // 30px - Hero headings (rarely used)
  'text-4xl': '4xl',    // 36px - Display headings (rarely used)
}

// Semantic usage guidelines for each typography scale
export const typographyUsageGuide: Record<TypographyScale, {
  description: string
  examples: string[]
  shouldUse: string[]
  shouldNotUse: string[]
}> = {
  xs: {
    description: 'Extra small text for metadata and fine print',
    examples: ['File sizes', 'Timestamps', 'Helper text', 'Captions'],
    shouldUse: ['Metadata', 'Fine print', 'Status indicators', 'Tooltips'],
    shouldNotUse: ['Primary content', 'Form labels', 'Navigation items']
  },
  sm: {
    description: 'Small text for secondary content and labels',
    examples: ['Form labels', 'Secondary text', 'Navigation items', 'Button text'],
    shouldUse: ['Form labels', 'Secondary content', 'Navigation', 'Buttons'],
    shouldNotUse: ['Primary headings', 'Hero text', 'Main content blocks']
  },
  base: {
    description: 'Base text size for primary body content',
    examples: ['Paragraph text', 'Form inputs', 'List items', 'Card content'],
    shouldUse: ['Body text', 'Form inputs', 'Primary content', 'Descriptions'],
    shouldNotUse: ['Headings', 'Metadata', 'Fine print']
  },
  lg: {
    description: 'Large text for subheadings and emphasis',
    examples: ['Subheadings', 'Emphasized text', 'Large buttons', 'Card titles'],
    shouldUse: ['Subheadings', 'Emphasis', 'Important labels', 'Card titles'],
    shouldNotUse: ['Body text', 'Metadata', 'Fine print']
  },
  xl: {
    description: 'Extra large text for section headings',
    examples: ['Section headings', 'Modal titles', 'Page subtitles'],
    shouldUse: ['Section headings', 'Modal titles', 'Important announcements'],
    shouldNotUse: ['Body text', 'Navigation', 'Form labels']
  },
  '2xl': {
    description: 'Double extra large for page headings',
    examples: ['Page titles', 'Main headings', 'Hero text'],
    shouldUse: ['Page titles', 'Main headings', 'Primary CTAs'],
    shouldNotUse: ['Body text', 'Secondary content', 'Navigation']
  },
  '3xl': {
    description: 'Triple extra large for hero headings (use sparingly)',
    examples: ['Hero headings', 'Landing page titles'],
    shouldUse: ['Hero sections', 'Landing pages', 'Marketing content'],
    shouldNotUse: ['Application UI', 'Forms', 'Navigation']
  },
  '4xl': {
    description: 'Quadruple extra large for display headings (use very sparingly)',
    examples: ['Display headings', 'Marketing banners'],
    shouldUse: ['Marketing materials', 'Landing pages', 'Special announcements'],
    shouldNotUse: ['Application UI', 'Clinical interfaces', 'Forms']
  }
}

// Spacing migration map
export const spacingMigrationMap: Record<string, keyof typeof tokens.spacing> = {
  // Padding classes
  'p-1': 'xs',    // 4px
  'p-2': 'sm',    // 8px
  'p-3': 'md',    // 12px -> use 'md' (16px) for better consistency
  'p-4': 'md',    // 16px
  'p-5': 'lg',    // 20px -> use 'lg' (24px)
  'p-6': 'lg',    // 24px
  'p-8': 'xl',    // 32px
  'p-12': '2xl',  // 48px
  'p-16': '3xl',  // 64px
  
  // Margin classes (same mapping)
  'm-1': 'xs',
  'm-2': 'sm',
  'm-3': 'md',
  'm-4': 'md',
  'm-5': 'lg',
  'm-6': 'lg',
  'm-8': 'xl',
  'm-12': '2xl',
  'm-16': '3xl',
}

// Generate consistent className for typography
export function getTypographyClass(
  size: TypographyScale,
  weight: keyof typeof tokens.typography.weights = 'normal',
  color: string = 'gray-900'
): string {
  const sizeClass = `text-${size}`
  const weightClass = `font-${weight}`
  const colorClass = `text-${color}`
  
  return `${sizeClass} ${weightClass} ${colorClass}`
}

// Generate consistent className for spacing
export function getSpacingClass(
  property: 'p' | 'px' | 'py' | 'pt' | 'pr' | 'pb' | 'pl' | 'm' | 'mx' | 'my' | 'mt' | 'mr' | 'mb' | 'ml',
  size: keyof typeof tokens.spacing
): string {
  const sizeMap: Record<keyof typeof tokens.spacing, string> = {
    xs: '1',
    sm: '2',
    md: '4',
    lg: '6',
    xl: '8',
    '2xl': '12',
    '3xl': '16',
    '4xl': '24'
  }
  
  return `${property}-${sizeMap[size]}`
}

// Clinical-specific typography recommendations
export const clinicalTypographyGuide = {
  reportTitle: { size: '2xl' as TypographyScale, weight: 'bold' as const },
  sectionHeading: { size: 'xl' as TypographyScale, weight: 'semibold' as const },
  subsectionHeading: { size: 'lg' as TypographyScale, weight: 'medium' as const },
  bodyText: { size: 'base' as TypographyScale, weight: 'normal' as const },
  formLabel: { size: 'sm' as TypographyScale, weight: 'medium' as const },
  helpText: { size: 'xs' as TypographyScale, weight: 'normal' as const },
  buttonText: { size: 'sm' as TypographyScale, weight: 'medium' as const },
  navigationText: { size: 'sm' as TypographyScale, weight: 'normal' as const },
  metadata: { size: 'xs' as TypographyScale, weight: 'normal' as const },
  errorText: { size: 'xs' as TypographyScale, weight: 'medium' as const },
  statusText: { size: 'xs' as TypographyScale, weight: 'medium' as const }
}

// Helper function to get clinical typography class
export function getClinicalTypographyClass(
  usage: keyof typeof clinicalTypographyGuide,
  color?: string
): string {
  const guide = clinicalTypographyGuide[usage]
  return getTypographyClass(guide.size, guide.weight, color)
}

// Migration helper to suggest better typography
export function suggestTypographyImprovement(currentClass: string): {
  suggested: string
  reason: string
  usage: string
} | null {
  // Extract text size from className
  const textSizeMatch = currentClass.match(/text-(xs|sm|base|lg|xl|2xl|3xl|4xl)/)
  if (!textSizeMatch) return null
  
  const currentSize = textSizeMatch[1] as TypographyScale
  const guide = typographyUsageGuide[currentSize]
  
  return {
    suggested: getTypographyClass(currentSize),
    reason: guide.description,
    usage: guide.examples.join(', ')
  }
}

// Spacing consistency checker
export function checkSpacingConsistency(className: string): {
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []
  
  // Check for inconsistent padding/margin combinations
  const spacingClasses = className.match(/(p|m)(x|y|t|r|b|l)?-\d+/g) || []
  
  if (spacingClasses.length > 3) {
    issues.push('Too many spacing classes - consider consolidating')
    suggestions.push('Use fewer, more semantic spacing values')
  }
  
  // Check for non-standard spacing values
  const nonStandardSpacing = spacingClasses.filter(cls => {
    const value = cls.match(/-(\d+)$/)?.[1]
    return value && !['1', '2', '4', '6', '8', '12', '16', '24'].includes(value)
  })
  
  if (nonStandardSpacing.length > 0) {
    issues.push(`Non-standard spacing values: ${nonStandardSpacing.join(', ')}`)
    suggestions.push('Use design token spacing values (xs, sm, md, lg, xl, 2xl, 3xl)')
  }
  
  return { issues, suggestions }
}