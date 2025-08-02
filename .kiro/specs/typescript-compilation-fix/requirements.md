# Requirements Document

## Introduction

The Linguosity application currently has extensive TypeScript compilation errors that prevent clean builds and development. This feature addresses the systematic resolution of these compilation issues through a structured 6-pass approach, focusing on compiler stoppers, domain model synchronization, component prop contracts, UI library compatibility, third-party version conflicts, and edge-case type mismatches.

## Requirements

### Requirement 1

**User Story:** As a developer, I want the TypeScript compiler to run without errors, so that I can build and deploy the application successfully.

#### Acceptance Criteria

1. WHEN running `tsc --noEmit` THEN the system SHALL complete without any compilation errors
2. WHEN running `pnpm build` THEN the system SHALL successfully create a production build
3. WHEN running the development server THEN the system SHALL start without TypeScript errors blocking functionality

### Requirement 2

**User Story:** As a developer, I want consistent type definitions across the codebase, so that data flows correctly between components and API endpoints.

#### Acceptance Criteria

1. WHEN accessing report section properties THEN the system SHALL use consistent camelCase naming (sectionType, not section_type)
2. WHEN hydrating report data THEN the system SHALL include all required fields (hydratedHtml, studentBio, etc.)
3. WHEN mapping database responses THEN the system SHALL transform snake_case to camelCase consistently
4. WHEN components receive props THEN the system SHALL match the canonical type definitions

### Requirement 3

**User Story:** As a developer, I want proper initialization of variables in API routes, so that runtime errors are prevented.

#### Acceptance Criteria

1. WHEN declaring response variables in try/catch blocks THEN the system SHALL initialize them before use
2. WHEN importing Supabase client functions THEN the system SHALL use correct export names
3. WHEN handling API responses THEN the system SHALL have proper error handling with initialized variables

### Requirement 4

**User Story:** As a developer, I want UI components to accept valid variant props, so that the design system works correctly.

#### Acceptance Criteria

1. WHEN using Button components with "outline" variant THEN the system SHALL accept the variant without type errors
2. WHEN using other UI components THEN the system SHALL support all documented variant options
3. WHEN extending component variants THEN the system SHALL maintain type safety

### Requirement 5

**User Story:** As a developer, I want consistent versions of Tiptap and ProseMirror packages, so that rich text editing works without conflicts.

#### Acceptance Criteria

1. WHEN installing Tiptap packages THEN the system SHALL use identical versions across all @tiptap/* packages
2. WHEN using NodeViewRenderer THEN the system SHALL be compatible with the installed Tiptap version
3. WHEN resolving ProseMirror dependencies THEN the system SHALL have only one version of each core package

### Requirement 6

**User Story:** As a developer, I want proper type matching for AI content generation, so that document processing works correctly.

#### Acceptance Criteria

1. WHEN creating ContentBlockParam objects THEN the system SHALL match the expected interface
2. WHEN handling reportMeta THEN the system SHALL use proper Record<string, any> structure
3. WHEN processing document blocks THEN the system SHALL include required source fields

### Requirement 7

**User Story:** As a developer, I want the fix process to be incremental and reversible, so that progress can be tracked and issues can be rolled back if needed.

#### Acceptance Criteria

1. WHEN completing each pass THEN the system SHALL reduce compilation errors significantly
2. WHEN committing changes THEN the system SHALL commit after each pass for easy rollback
3. WHEN running tests after fixes THEN the system SHALL maintain existing functionality
4. WHEN adding type-only unit tests THEN the system SHALL lock the schema to prevent regression