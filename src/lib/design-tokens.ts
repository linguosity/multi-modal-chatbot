// Design tokens for consistent styling across the application

export const tokens = {
  // Spacing scale based on 4px base unit
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
  },

  // Typography scale
  typography: {
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    }
  },

  // Color system - Clinical-appropriate palette
  colors: {
    // Primary brand colors - Professional blue for clinical settings
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },

    // Secondary colors - Complementary professional palette
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },

    // Semantic colors - Clinical status indicators
    semantic: {
      success: '#10b981',    // Assessment completed, positive outcomes
      warning: '#f59e0b',    // Needs attention, review required
      error: '#ef4444',      // Validation errors, critical issues
      info: '#3b82f6',       // General information, guidance
      clinical: '#6366f1',   // Clinical data highlight, assessment results
    },

    // Neutral grays (consolidated from 23 different shades to 9 semantic grays)
    gray: {
      50: '#f9fafb',   // Page background
      100: '#f3f4f6',  // Card background, subtle fills
      200: '#e5e7eb',  // Borders, dividers
      300: '#d1d5db',  // Disabled states, placeholders
      400: '#9ca3af',  // Muted text, icons
      500: '#6b7280',  // Secondary text
      600: '#4b5563',  // Primary text
      700: '#374151',  // Headings, emphasis
      800: '#1f2937',  // High contrast text
      900: '#111827',  // Maximum contrast
    },

    // State colors for interactive elements
    interactive: {
      hover: '#f3f4f6',      // Hover state background
      active: '#e5e7eb',     // Active/pressed state
      focus: '#3b82f6',      // Focus ring color
      disabled: '#d1d5db',   // Disabled element color
      selected: '#dbeafe',   // Selected item background
    },

    // Clinical-specific colors for assessment data
    assessment: {
      above: '#10b981',      // Above average/typical scores
      average: '#3b82f6',    // Average/typical range
      below: '#f59e0b',      // Below average, needs attention
      concern: '#ef4444',    // Significant concern, intervention needed
      incomplete: '#9ca3af', // Incomplete assessment
    }
  },

  // Border radius system
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px',
  },

  // Shadow system
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // Animation durations
  animation: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },

  // Z-index scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  }
}

// CSS custom properties for use in Tailwind config
export const cssVariables = {
  ':root': {
    // Spacing
    '--spacing-xs': tokens.spacing.xs,
    '--spacing-sm': tokens.spacing.sm,
    '--spacing-md': tokens.spacing.md,
    '--spacing-lg': tokens.spacing.lg,
    '--spacing-xl': tokens.spacing.xl,
    '--spacing-2xl': tokens.spacing['2xl'],
    '--spacing-3xl': tokens.spacing['3xl'],
    '--spacing-4xl': tokens.spacing['4xl'],

    // Colors
    '--color-primary': tokens.colors.primary[600],
    '--color-primary-hover': tokens.colors.primary[700],
    '--color-success': tokens.colors.semantic.success,
    '--color-warning': tokens.colors.semantic.warning,
    '--color-error': tokens.colors.semantic.error,
    '--color-info': tokens.colors.semantic.info,

    // Typography
    '--font-size-xs': tokens.typography.sizes.xs,
    '--font-size-sm': tokens.typography.sizes.sm,
    '--font-size-base': tokens.typography.sizes.base,
    '--font-size-lg': tokens.typography.sizes.lg,
    '--font-size-xl': tokens.typography.sizes.xl,

    // Border radius
    '--border-radius-sm': tokens.borderRadius.sm,
    '--border-radius-base': tokens.borderRadius.base,
    '--border-radius-md': tokens.borderRadius.md,
    '--border-radius-lg': tokens.borderRadius.lg,

    // Shadows
    '--shadow-sm': tokens.shadows.sm,
    '--shadow-base': tokens.shadows.base,
    '--shadow-md': tokens.shadows.md,
    '--shadow-lg': tokens.shadows.lg,
  }
}

// Type definitions for design tokens
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'clinical'
export type SizeVariant = 'sm' | 'md' | 'lg' | 'xl'
export type SpacingScale = keyof typeof tokens.spacing
export type TypographyScale = keyof typeof tokens.typography.sizes

// Export tokens as the default export for easier importing
export { tokens as default }

// Utility functions for consistent styling
export const getSpacing = (size: SpacingScale) => tokens.spacing[size]

export const getColor = (color: string, shade?: number) => {
  if (shade && color in tokens.colors && typeof tokens.colors[color as keyof typeof tokens.colors] === 'object') {
    return (tokens.colors[color as keyof typeof tokens.colors] as any)[shade]
  }
  return tokens.colors.semantic[color as keyof typeof tokens.colors.semantic] || color
}

export const getFontSize = (size: TypographyScale) => tokens.typography.sizes[size]
export const getBorderRadius = (size: keyof typeof tokens.borderRadius) => tokens.borderRadius[size]

// Utility functions for generating consistent Tailwind classes
export const getTextSizeClass = (size: TypographyScale): string => {
  const sizeMap: Record<TypographyScale, string> = {
    xs: 'text-xs',
    sm: 'text-sm', 
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl'
  }
  return sizeMap[size]
}

export const getSpacingClass = (property: 'p' | 'px' | 'py' | 'pt' | 'pr' | 'pb' | 'pl' | 'm' | 'mx' | 'my' | 'mt' | 'mr' | 'mb' | 'ml', size: SpacingScale): string => {
  const sizeMap: Record<SpacingScale, string> = {
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

export const getColorClass = (property: 'text' | 'bg' | 'border', variant: ColorVariant, shade?: number): string => {
  const variantMap: Record<ColorVariant, string> = {
    primary: 'blue',
    secondary: 'slate',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    info: 'blue',
    clinical: 'indigo'
  }
  
  const color = variantMap[variant]
  const shadeStr = shade ? `-${shade}` : '-600' // Default to 600 shade
  return `${property}-${color}${shadeStr}`
}

export const getBorderRadiusClass = (size: keyof typeof tokens.borderRadius): string => {
  const sizeMap: Record<keyof typeof tokens.borderRadius, string> = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    base: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full'
  }
  return sizeMap[size]
}

// Component variant utilities
export const getButtonVariantClasses = (variant: ColorVariant, size: SizeVariant = 'md'): string => {
  const variantClasses: Record<ColorVariant, string> = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300',
    success: 'bg-green-600 hover:bg-green-700 text-white border-green-600',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500',
    error: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
    info: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500',
    clinical: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600'
  }
  
  const sizeClasses: Record<SizeVariant, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  }
  
  return `${variantClasses[variant]} ${sizeClasses[size]} border rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`
}

export const getCardClasses = (variant: 'default' | 'elevated' | 'bordered' = 'default'): string => {
  const baseClasses = 'bg-white rounded-lg'
  
  const variantClasses = {
    default: 'border border-gray-200',
    elevated: 'shadow-md',
    bordered: 'border-2 border-gray-200'
  }
  
  return `${baseClasses} ${variantClasses[variant]}`
}