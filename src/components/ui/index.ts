// UI Components Index
// Centralized exports for all UI components

// Base components
export { Button } from './button'
export type { ButtonProps } from './button'

export { BaseModal } from './base-modal'
export type { BaseModalProps } from './base-modal'

export { FormField } from './form-field'
export type { FormFieldProps } from './form-field'

// Navigation components
export { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator } from './breadcrumb'
export type { BreadcrumbProps, BreadcrumbItemProps } from './breadcrumb'

export { SectionProgress } from './section-progress'
export type { SectionProgressProps } from './section-progress'

// Loading and state components
export { AutoSaveIndicator, useAutoSave } from './auto-save-indicator'
export type { AutoSaveIndicatorProps, SaveStatus } from './auto-save-indicator'

export { LoadingState, Skeleton, LoadingWrapper } from './loading-state'
export type { 
  LoadingStateProps, 
  SkeletonProps, 
  LoadingWrapperProps,
  LoadingStateType,
  LoadingSize,
  LoadingVariant
} from './loading-state'

export { ProgressIndicator } from './progress-indicator'
export type { ProgressIndicatorProps } from './progress-indicator'

// Form validation components
export { FormValidation, FieldValidation, ValidationSummary } from './form-validation'
export type { 
  FormValidationProps, 
  FieldValidationProps, 
  ValidationSummaryProps,
  ValidationMessage,
  ValidationSeverity
} from './form-validation'

// Interactive components with micro-interactions
export { InteractiveButton, InteractiveInput, InteractiveCard, AnimatedProgress } from './interactive-elements'
export type { 
  InteractiveButtonProps, 
  InteractiveInputProps, 
  InteractiveCardProps,
  AnimatedProgressProps
} from './interactive-elements'

// Animated navigation components
export { AnimatedBreadcrumb, AnimatedTabs, AnimatedSidebar } from './animated-navigation'
export type { 
  AnimatedBreadcrumbProps, 
  AnimatedTabsProps, 
  AnimatedSidebarProps,
  AnimatedBreadcrumbItem,
  AnimatedTabItem,
  AnimatedSidebarItem
} from './animated-navigation'

// Loading animations
export { 
  PulsingDots, 
  Spinner, 
  WaveLoader, 
  ShimmerSkeleton, 
  ProgressRing, 
  TypingIndicator, 
  Heartbeat 
} from './loading-animations'
export type { 
  PulsingDotsProps, 
  SpinnerProps, 
  WaveLoaderProps, 
  ShimmerSkeletonProps, 
  ProgressRingProps, 
  TypingIndicatorProps, 
  HeartbeatProps 
} from './loading-animations'

// Keyboard navigation components
export { 
  KeyboardShortcutsModal, 
  KeyboardGrid, 
  SectionNavigation, 
  FocusIndicator 
} from './keyboard-navigation'
export type { 
  KeyboardShortcutsModalProps, 
  KeyboardGridProps, 
  SectionNavigationProps, 
  FocusIndicatorProps 
} from './keyboard-navigation'

// Utility components
export { SplitButton } from './split-button'
export type { SplitButtonProps } from './split-button'

export { Toast } from './toast'
export type { ToastProps } from './toast'