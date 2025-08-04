# UI/UX Phase 2 Cleanup Design Document

## Overview

This design document outlines the technical approach for Phase 2 UI/UX cleanup, building on the foundation established in Phase 1. The focus is on creating a cohesive design system, eliminating component inconsistencies, and implementing professional polish that serves speech-language pathologists' clinical workflow needs.

## Architecture

### Design System Architecture

```
src/lib/design-system/
├── tokens/
│   ├── colors.ts          # Semantic color palette
│   ├── typography.ts      # Font scales and weights
│   ├── spacing.ts         # 8px grid system
│   └── shadows.ts         # Elevation system
├── components/
│   ├── base/              # Foundational components
│   ├── forms/             # Form-specific components
│   └── navigation/        # Navigation components
└── utils/
    ├── classNames.ts      # Utility for consistent styling
    └── accessibility.ts   # A11y helpers
```

### Component Consolidation Strategy

```
Current State (45+ components with inconsistencies)
├── 3 different modal patterns → 1 BaseModal
├── 4 different editor components → 2 unified editors
├── 18 different form patterns → 1 FormField system
└── 16 different API patterns → 1 createApiHandler

Target State (Consolidated and consistent)
├── BaseModal (with variants)
├── UnifiedEditor (TiptapEditor + StructuredEditor)
├── FormSystem (FormField + validation)
└── APISystem (createApiHandler + error handling)
```

## Components and Interfaces

### 1. Design Token System

```typescript
// src/lib/design-system/tokens/index.ts
export const designTokens = {
  colors: {
    // Semantic colors for clinical application
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      900: '#1e3a8a'
    },
    semantic: {
      success: '#10b981',    // Assessment completed
      warning: '#f59e0b',    // Needs attention
      error: '#ef4444',      // Validation error
      info: '#3b82f6',       // General information
      clinical: '#6366f1'    // Clinical data highlight
    },
    neutral: {
      // Reduced from 23 different grays to 8 semantic grays
      50: '#f9fafb',   // Background
      100: '#f3f4f6',  // Card background
      200: '#e5e7eb',  // Border
      300: '#d1d5db',  // Disabled
      500: '#6b7280',  // Secondary text
      600: '#4b5563',  // Primary text
      800: '#1f2937',  // Headings
      900: '#111827'   // High contrast
    }
  },
  
  typography: {
    // Reduced from 12 different sizes to 6 semantic sizes
    sizes: {
      xs: '0.75rem',    // 12px - Captions, metadata
      sm: '0.875rem',   // 14px - Body text, labels
      base: '1rem',     // 16px - Primary body text
      lg: '1.125rem',   // 18px - Subheadings
      xl: '1.25rem',    // 20px - Section headings
      '2xl': '1.5rem'   // 24px - Page headings
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    },
    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75'
    }
  },
  
  spacing: {
    // 8px grid system (4px base unit)
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem'    // 64px
  },
  
  borderRadius: {
    // Reduced from 6 different values to 4 semantic values
    sm: '0.25rem',   // 4px - Small elements
    md: '0.375rem',  // 6px - Buttons, inputs
    lg: '0.5rem',    // 8px - Cards, modals
    xl: '0.75rem'    // 12px - Large containers
  },
  
  shadows: {
    // Clinical-appropriate elevation system
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  }
} as const;
```

### 2. Base Component System

```typescript
// src/lib/design-system/components/base/BaseComponent.ts
export interface BaseComponentProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  'data-testid'?: string;
}

// Accessibility props for all interactive components
export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  role?: string;
}

export interface InteractiveComponentProps extends BaseComponentProps, AccessibilityProps {
  onClick?: (event: React.MouseEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  tabIndex?: number;
}
```

### 3. Unified Modal System

```typescript
// src/components/ui/BaseModal.tsx (Enhanced)
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'clinical' | 'warning' | 'error';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  size = 'md',
  variant = 'default',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  children,
  footer,
  className
}: BaseModalProps) {
  // Implementation with:
  // - Focus management (trap focus, restore on close)
  // - Keyboard navigation (Escape, Tab)
  // - Accessibility (ARIA labels, roles)
  // - Animation (smooth open/close)
  // - Portal rendering (avoid z-index issues)
}
```

### 4. Consolidated Form System

```typescript
// src/components/ui/FormField.tsx (Enhanced)
export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox';
  value?: string | number | boolean;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  helpText?: string;
  options?: Array<{ label: string; value: string | number }>;
  rows?: number; // for textarea
  min?: number; // for number inputs
  max?: number; // for number inputs
  autoComplete?: string;
  'data-testid'?: string;
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  loading = false,
  error,
  helpText,
  options,
  rows = 3,
  min,
  max,
  autoComplete,
  'data-testid': testId
}: FormFieldProps) {
  // Implementation with:
  // - Consistent styling across all input types
  // - Built-in validation state display
  // - Loading state handling
  // - Accessibility compliance
  // - Auto-save integration hooks
}
```

### 5. Navigation Enhancement System

```typescript
// src/components/navigation/BreadcrumbNav.tsx (Enhanced)
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  onClick?: () => void;
}

export interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  separator?: React.ComponentType<{ className?: string }>;
  maxItems?: number;
  className?: string;
}

// src/components/navigation/SectionProgress.tsx
export interface SectionProgressProps {
  sections: Array<{
    id: string;
    title: string;
    status: 'not-started' | 'in-progress' | 'completed' | 'needs-review';
    progress?: number; // 0-100 for partial completion
  }>;
  currentSectionId?: string;
  onSectionClick?: (sectionId: string) => void;
}
```

## Data Models

### 1. Design Token Types

```typescript
// src/lib/design-system/types.ts
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'clinical';
export type SizeVariant = 'sm' | 'md' | 'lg' | 'xl';
export type SpacingScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type TypographyScale = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';

export interface ComponentVariants {
  variant: ColorVariant;
  size: SizeVariant;
  disabled: boolean;
  loading: boolean;
}

export interface AccessibilityState {
  hasError: boolean;
  isRequired: boolean;
  isDisabled: boolean;
  describedBy?: string;
  labelledBy?: string;
}
```

### 2. Form State Management

```typescript
// src/lib/hooks/useFormState.ts (Enhanced)
export interface FormFieldState {
  value: any;
  error?: string;
  touched: boolean;
  dirty: boolean;
  validating: boolean;
}

export interface FormState<T = Record<string, any>> {
  data: T;
  fields: Record<keyof T, FormFieldState>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  submitCount: number;
  errors: Record<keyof T, string>;
}

export interface FormActions<T = Record<string, any>> {
  setFieldValue: (name: keyof T, value: any) => void;
  setFieldError: (name: keyof T, error: string) => void;
  setFieldTouched: (name: keyof T, touched: boolean) => void;
  validateField: (name: keyof T) => Promise<void>;
  validateForm: () => Promise<boolean>;
  resetForm: (data?: Partial<T>) => void;
  submitForm: () => Promise<void>;
}
```

## Error Handling

### 1. Centralized Error Boundary System

```typescript
// src/components/error/ErrorBoundary.tsx
export interface ErrorBoundaryProps {
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  children: React.ReactNode;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  variant?: 'page' | 'component' | 'inline';
}

// src/components/error/ErrorDisplay.tsx
export interface ErrorDisplayProps {
  title: string;
  message: string;
  variant?: 'error' | 'warning' | 'info';
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  showDetails?: boolean;
  details?: string;
}
```

### 2. Form Validation System

```typescript
// src/lib/validation/validators.ts
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface ValidationSchema {
  [fieldName: string]: ValidationRule[];
}

export function createValidator(schema: ValidationSchema) {
  return {
    validateField: (name: string, value: any): string | null => {
      // Implementation
    },
    validateForm: (data: Record<string, any>): Record<string, string> => {
      // Implementation
    }
  };
}
```

## Testing Strategy

### 1. Component Testing Approach

```typescript
// src/lib/testing/test-utils.tsx
export interface RenderOptions {
  initialState?: any;
  theme?: 'light' | 'dark';
  user?: any;
  route?: string;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderOptions = {}
) {
  // Wrapper with all necessary providers
  // - Theme provider
  // - Router provider
  // - Auth provider
  // - Toast provider
}

// Component test example
describe('BaseModal', () => {
  it('should trap focus within modal', async () => {
    const user = userEvent.setup();
    render(
      <BaseModal isOpen={true} onClose={jest.fn()} title="Test Modal">
        <button>First</button>
        <button>Second</button>
      </BaseModal>
    );
    
    // Test focus trapping
    await user.tab();
    expect(screen.getByText('First')).toHaveFocus();
    
    await user.tab();
    expect(screen.getByText('Second')).toHaveFocus();
    
    await user.tab();
    expect(screen.getByLabelText('Close modal')).toHaveFocus();
  });
});
```

### 2. Accessibility Testing

```typescript
// src/lib/testing/accessibility.ts
export async function testAccessibility(component: React.ReactElement) {
  const { container } = render(component);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

export function testKeyboardNavigation(component: React.ReactElement) {
  // Test keyboard navigation patterns
  // - Tab order
  // - Enter/Space activation
  // - Arrow key navigation
  // - Escape key handling
}
```

### 3. Visual Regression Testing

```typescript
// src/lib/testing/visual.ts
export function createVisualTest(name: string, component: React.ReactElement) {
  return {
    name,
    component,
    variants: [
      { name: 'default', props: {} },
      { name: 'loading', props: { loading: true } },
      { name: 'error', props: { error: 'Test error' } },
      { name: 'disabled', props: { disabled: true } }
    ]
  };
}
```

## Implementation Plan

### Phase 2.1: Design System Foundation (Week 1)
1. Create design token system
2. Implement base component interfaces
3. Update existing components to use tokens
4. Create utility functions for consistent styling

### Phase 2.2: Component Consolidation (Week 2)
1. Consolidate modal implementations into BaseModal
2. Merge editor components into unified system
3. Standardize form components with FormField
4. Update all API routes to use createApiHandler

### Phase 2.3: Navigation and UX Polish (Week 3)
1. Implement breadcrumb navigation system
2. Add section progress indicators
3. Create loading states and micro-interactions
4. Implement keyboard navigation patterns

### Phase 2.4: Performance and Accessibility (Week 4)
1. Optimize bundle size and loading performance
2. Implement comprehensive accessibility features
3. Add error boundaries and recovery mechanisms
4. Create comprehensive test coverage

This design provides a systematic approach to creating a professional, consistent, and maintainable UI/UX system that serves the specific needs of speech-language pathologists while establishing a solid foundation for future development.