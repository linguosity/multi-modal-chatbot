// Standardized component interfaces for consistent prop patterns

export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
  id?: string
  'data-testid'?: string
}

export interface InteractiveComponentProps extends BaseComponentProps {
  disabled?: boolean
  loading?: boolean
  onClick?: (event: React.MouseEvent) => void
  onFocus?: (event: React.FocusEvent) => void
  onBlur?: (event: React.FocusEvent) => void
}

export interface FormComponentProps extends InteractiveComponentProps {
  name?: string
  value?: string | number | boolean
  onChange?: (value: any) => void
  onValidate?: (value: any) => string | null
  error?: string | null
  required?: boolean
  placeholder?: string
  helpText?: string
}

export interface VariantComponentProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

export interface ModalComponentProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

export interface LoadingState {
  loading: boolean
  error: string | null
  success?: boolean
}

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  pageSize?: number
  totalItems?: number
}

export interface SortableProps {
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (field: string, direction: 'asc' | 'desc') => void
}

export interface FilterableProps {
  filters?: Record<string, any>
  onFilter?: (filters: Record<string, any>) => void
}

// Common event handler types
export type ClickHandler = (event: React.MouseEvent) => void
export type ChangeHandler<T = string> = (value: T) => void
export type SubmitHandler = (event: React.FormEvent) => void
export type KeyboardHandler = (event: React.KeyboardEvent) => void

// Accessibility props
export interface AccessibilityProps {
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-selected'?: boolean
  'aria-disabled'?: boolean
  role?: string
  tabIndex?: number
}

// Combined props for complex components
export interface ComplexComponentProps 
  extends BaseComponentProps, 
          VariantComponentProps, 
          LoadingState, 
          AccessibilityProps {}

// Status types for consistent state representation
export type Status = 'idle' | 'loading' | 'success' | 'error'
export type ValidationStatus = 'valid' | 'invalid' | 'pending'

// Common data structures
export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
  group?: string
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: string | number
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: any) => React.ReactNode
}

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

// Form validation types
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio'
  value?: any
  placeholder?: string
  helpText?: string
  validation?: ValidationRule
  options?: SelectOption[] // for select/radio fields
}