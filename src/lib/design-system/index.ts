// Design System Exports
// This file provides a clean interface for importing design system utilities

// Design tokens
export { tokens, type ColorVariant, type SizeVariant, type SpacingScale, type TypographyScale } from '../design-tokens'

// Utility functions
export {
  cn,
  getButtonClasses,
  getCardClasses,
  getFormFieldClasses,
  getModalClasses,
  getTextClasses,
  getSpacingClasses,
  getStatusClasses,
  getFocusRingClasses,
  type ComponentVariantProps
} from './utils'

// Type definitions
export type {
  BaseComponentProps,
  AccessibilityProps,
  InteractiveComponentProps,
  FormComponentProps,
  ModalComponentProps,
  NavigationComponentProps,
  NavigationItem,
  DataDisplayProps,
  StatusComponentProps,
  ComponentState,
  AnimationProps,
  ResponsiveProps,
  ThemeProps,
  ValidationState,
  LoadingState,
  EventHandlers
} from './types'

// Re-export commonly used utilities from design-tokens
export {
  getSpacing,
  getColor,
  getFontSize,
  getBorderRadius,
  getTextSizeClass,
  getSpacingClass,
  getColorClass,
  getBorderRadiusClass,
  getButtonVariantClasses,
  getCardClasses as getCardVariantClasses
} from '../design-tokens'