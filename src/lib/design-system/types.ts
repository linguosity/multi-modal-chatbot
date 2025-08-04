import React from 'react'
import { type ColorVariant, type SizeVariant } from '../design-tokens'

/**
 * Base props that all components should extend
 */
export interface BaseComponentProps {
  /** Additional CSS classes */
  className?: string
  /** Component variant for styling */
  variant?: ColorVariant
  /** Component size */
  size?: SizeVariant
  /** Whether the component is disabled */
  disabled?: boolean
  /** Whether the component is in a loading state */
  loading?: boolean
  /** Test identifier for automated testing */
  'data-testid'?: string
  /** Children elements */
  children?: React.ReactNode
}

/**
 * Accessibility props for interactive components
 */
export interface AccessibilityProps {
  /** Accessible label for screen readers */
  'aria-label'?: string
  /** ID of element that describes this component */
  'aria-describedby'?: string
  /** Whether the component is expanded (for collapsible elements) */
  'aria-expanded'?: boolean
  /** ID of element controlled by this component */
  'aria-controls'?: string
  /** ARIA role override */
  role?: string
  /** Whether the component is required */
  'aria-required'?: boolean
  /** Whether the component has an error */
  'aria-invalid'?: boolean
  /** ID of element that labels this component */
  'aria-labelledby'?: string
}

/**
 * Props for interactive components (buttons, links, form controls)
 */
export interface InteractiveComponentProps extends BaseComponentProps, AccessibilityProps {
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
  /** Key down handler for keyboard navigation */
  onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void
  /** Focus handler */
  onFocus?: (event: React.FocusEvent<HTMLElement>) => void
  /** Blur handler */
  onBlur?: (event: React.FocusEvent<HTMLElement>) => void
  /** Tab index for keyboard navigation */
  tabIndex?: number
  /** Whether the component is currently focused */
  autoFocus?: boolean
}

/**
 * Props for form components
 */
export interface FormComponentProps extends InteractiveComponentProps {
  /** Form field name */
  name?: string
  /** Form field value */
  value?: string | number | boolean
  /** Default value for uncontrolled components */
  defaultValue?: string | number | boolean
  /** Change handler */
  onChange?: (value: any, event?: React.ChangeEvent<HTMLElement>) => void
  /** Whether the field is required */
  required?: boolean
  /** Whether the field is readonly */
  readOnly?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Error message */
  error?: string
  /** Help text */
  helpText?: string
  /** Field label */
  label?: string
}

/**
 * Props for modal/dialog components
 */
export interface ModalComponentProps extends BaseComponentProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Close handler */
  onClose: () => void
  /** Modal title */
  title: string
  /** Whether to close on overlay click */
  closeOnOverlayClick?: boolean
  /** Whether to close on escape key */
  closeOnEscape?: boolean
  /** Whether to show close button */
  showCloseButton?: boolean
  /** Modal footer content */
  footer?: React.ReactNode
}

/**
 * Props for navigation components
 */
export interface NavigationComponentProps extends BaseComponentProps {
  /** Navigation items */
  items: NavigationItem[]
  /** Current active item */
  activeItem?: string
  /** Navigation change handler */
  onNavigate?: (item: NavigationItem) => void
}

export interface NavigationItem {
  /** Unique identifier */
  id: string
  /** Display label */
  label: string
  /** Navigation URL */
  href?: string
  /** Click handler */
  onClick?: () => void
  /** Icon component */
  icon?: React.ComponentType<{ className?: string }>
  /** Whether the item is active */
  isActive?: boolean
  /** Whether the item is disabled */
  disabled?: boolean
  /** Child navigation items */
  children?: NavigationItem[]
}

/**
 * Props for data display components
 */
export interface DataDisplayProps extends BaseComponentProps {
  /** Data to display */
  data: any[]
  /** Loading state */
  loading?: boolean
  /** Error state */
  error?: string
  /** Empty state message */
  emptyMessage?: string
  /** Render function for custom display */
  renderItem?: (item: any, index: number) => React.ReactNode
}

/**
 * Props for status/badge components
 */
export interface StatusComponentProps extends BaseComponentProps {
  /** Status type */
  status: 'success' | 'warning' | 'error' | 'info' | 'clinical' | 'incomplete'
  /** Status label */
  label: string
  /** Optional icon */
  icon?: React.ComponentType<{ className?: string }>
  /** Whether to show as a dot indicator */
  dot?: boolean
}

/**
 * Common component state interface
 */
export interface ComponentState {
  /** Whether the component is mounted */
  isMounted: boolean
  /** Whether the component has focus */
  hasFocus: boolean
  /** Whether the component is hovered */
  isHovered: boolean
  /** Whether the component is pressed/active */
  isPressed: boolean
  /** Any error state */
  error?: string
}

/**
 * Animation/transition props
 */
export interface AnimationProps {
  /** Animation duration in milliseconds */
  duration?: number
  /** Animation easing function */
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'
  /** Animation delay in milliseconds */
  delay?: number
  /** Whether animation is disabled */
  disableAnimation?: boolean
}

/**
 * Responsive props for components that adapt to screen size
 */
export interface ResponsiveProps {
  /** Responsive size variants */
  responsive?: {
    sm?: SizeVariant
    md?: SizeVariant
    lg?: SizeVariant
    xl?: SizeVariant
  }
  /** Whether to hide on specific breakpoints */
  hideOn?: ('sm' | 'md' | 'lg' | 'xl')[]
  /** Whether to show only on specific breakpoints */
  showOn?: ('sm' | 'md' | 'lg' | 'xl')[]
}

/**
 * Theme props for components that support theming
 */
export interface ThemeProps {
  /** Theme variant */
  theme?: 'light' | 'dark' | 'clinical'
  /** Custom color overrides */
  colors?: Partial<Record<ColorVariant, string>>
}

/**
 * Validation state for form components
 */
export interface ValidationState {
  /** Whether the field is valid */
  isValid: boolean
  /** Whether the field has been touched */
  isTouched: boolean
  /** Whether the field is dirty (changed from initial value) */
  isDirty: boolean
  /** Whether validation is in progress */
  isValidating: boolean
  /** Validation error message */
  error?: string
  /** Validation warnings */
  warnings?: string[]
}

/**
 * Loading state interface
 */
export interface LoadingState {
  /** Whether loading is in progress */
  isLoading: boolean
  /** Loading progress (0-100) */
  progress?: number
  /** Loading message */
  message?: string
  /** Whether the operation can be cancelled */
  cancellable?: boolean
  /** Cancel handler */
  onCancel?: () => void
}

/**
 * Generic event handlers
 */
export interface EventHandlers {
  /** Generic click handler */
  onClick?: (event: React.MouseEvent) => void
  /** Generic change handler */
  onChange?: (value: any, event?: React.ChangeEvent) => void
  /** Generic submit handler */
  onSubmit?: (data: any, event?: React.FormEvent) => void
  /** Generic error handler */
  onError?: (error: Error) => void
  /** Generic success handler */
  onSuccess?: (data: any) => void
}