# Implementation Plan

- [x] 1. Pass 1: Fix Compiler Stoppers
  - Fix critical import and variable initialization issues that prevent compilation
  - Address immediate syntax errors and missing exports
  - _Requirements: 1.1, 3.1, 3.2_

- [x] 1.1 Fix createServerSupabase import issues across codebase
  - Update all imports from `createServerSupabase` to `createSupabaseServerClient` in affected files
  - Verify correct function usage in src/app/page.tsx, src/app/auth/actions.ts, and API routes
  - _Requirements: 3.2_

- [x] 1.2 Initialize response variables in API routes
  - Fix uninitialized `response` variable in src/app/api/ai/generate-section/route.ts
  - Add proper initialization before try/catch blocks to prevent "used before assigned" errors
  - _Requirements: 3.1_

- [x] 1.3 Verify and fix any remaining critical import errors
  - Run `tsc --noEmit` to identify any remaining import-related compilation blockers
  - Fix any missing exports or incorrect import paths discovered
  - _Requirements: 1.1, 3.2_

- [x] 2. Pass 2: Synchronize Domain Models (Report ⇄ Section)
  - Standardize type definitions between database schema and frontend interfaces
  - Implement consistent camelCase naming and add missing fields
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2.1 Update Section interface in src/types/report-types.ts
  - Add missing fields: hydratedHtml, studentBio, isRequired, isGenerated
  - Ensure consistent camelCase naming (sectionType instead of section_type)
  - Create comprehensive Section interface that matches component expectations
  - _Requirements: 2.1, 2.2_

- [x] 2.2 Implement database-to-frontend transformation functions
  - Create transformation utilities in src/lib/server/getReportForView.ts
  - Add snake_case to camelCase conversion for section_type → sectionType
  - Ensure all database responses are properly transformed before reaching components
  - _Requirements: 2.3_

- [x] 2.3 Update API route response mapping
  - Modify src/app/api/ai/generate-section/route.ts to output canonical Section shape
  - Update other API routes to use consistent type transformations
  - Ensure all API responses match the frontend type expectations
  - _Requirements: 2.3_

- [ ] 3. Pass 3: Fix Component Prop Contracts
  - Update component interfaces to match the standardized type definitions
  - Fix prop mismatches in ReportSidebar, StudentBioCard, and other components
  - _Requirements: 2.4_

- [ ] 3.1 Fix ReportSidebar component prop expectations
  - Update ReportSidebar to handle isRequired/isGenerated properties correctly
  - Ensure component can work with the standardized Section interface
  - Fix any prop spreading issues with structured_data access
  - _Requirements: 2.4_

- [ ] 3.2 Fix StudentBioCard component prop handling
  - Update StudentBioCard to safely access Json structured_data properties
  - Add proper type guards for structured_data field access
  - Replace direct structured_data.foo access with safe-access helpers
  - _Requirements: 2.4_

- [ ] 3.3 Update other components with Section interface dependencies
  - Identify and fix any other components that expect the old Section shape
  - Ensure all components can handle the new standardized Section interface
  - Add proper TypeScript interfaces for component props
  - _Requirements: 2.4_

- [ ] 4. Pass 4: Fix UI Library Variant Issues
  - Add missing variant types to UI components
  - Ensure design system components support all documented variants
  - _Requirements: 4.1_

- [ ] 4.1 Add missing "outline" variant to Button component
  - Update buttonVariants in src/components/ui/button.tsx to include "outline" variant
  - Add proper styling for outline variant: transparent background with border
  - Ensure variant type union includes "outline" option
  - _Requirements: 4.1_

- [ ] 4.2 Verify and fix other UI component variant issues
  - Check for any other missing variants in UI components that cause type errors
  - Update component variant unions to match actual usage in the codebase
  - Test that all variant props are properly typed and functional
  - _Requirements: 4.1_

- [ ] 5. Pass 5: Resolve Third-party Version Conflicts
  - Fix Tiptap and ProseMirror package version inconsistencies
  - Ensure all related packages use compatible versions
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 5.1 Audit and align Tiptap package versions
  - Run `pnpm why @tiptap/core` to identify version conflicts
  - Update all @tiptap/* packages to use identical versions (target: 2.25.0 or latest stable)
  - Ensure no duplicate versions of core Tiptap packages exist
  - _Requirements: 5.1, 5.2_

- [ ] 5.2 Resolve ProseMirror dependency conflicts
  - Add package resolutions to package.json for prosemirror-* packages
  - Ensure only one version of each ProseMirror core package is installed
  - Fix NodeViewRenderer and AnyExtension compatibility issues
  - _Requirements: 5.2, 5.3_

- [ ] 5.3 Update package.json with version resolutions
  - Add resolutions field to package.json to lock compatible versions
  - Run `pnpm install` to apply version resolutions
  - Verify that Tiptap components compile without version conflicts
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 6. Pass 6: Fix Edge-case Type Mismatches
  - Address remaining specific type incompatibilities
  - Fix AI content generation type issues
  - _Requirements: 6.1, 6.2_

- [ ] 6.1 Fix ContentBlockParam vs DocumentBlockParam type issues
  - Identify where ContentBlockParam and DocumentBlockParam are mismatched
  - Update AI content generation code to use correct parameter types
  - Add missing source field if creating DocumentBlock objects
  - _Requirements: 6.1_

- [ ] 6.2 Fix reportMeta type expectations
  - Update reportMeta usage to expect Record<string, any> structure
  - Fix any code that passes raw strings instead of key-value objects
  - Ensure proper object structure: { reportMeta: { key: value } }
  - _Requirements: 6.2_

- [ ] 7. Validation and Testing
  - Verify compilation success and maintain functionality
  - Add type-safety measures to prevent regression
  - _Requirements: 1.1, 7.1, 7.2, 7.3, 7.4_

- [ ] 7.1 Run comprehensive TypeScript compilation check
  - Execute `tsc --noEmit` to verify zero compilation errors
  - Ensure `pnpm build` completes successfully
  - Confirm development server starts without TypeScript errors
  - _Requirements: 1.1_

- [ ] 7.2 Add type-only unit tests for schema validation
  - Create type-only tests using expectType to lock Report and Section schemas
  - Add tests in src/lib/__tests__/ to prevent type regression
  - Ensure critical interfaces maintain their expected structure
  - _Requirements: 7.4_

- [ ] 7.3 Verify functional integrity after fixes
  - Test that existing features continue to work after type fixes
  - Ensure report creation, editing, and viewing functionality is intact
  - Verify AI generation and data processing still functions correctly
  - _Requirements: 7.3_

- [ ] 7.4 Document changes and commit each pass
  - Commit changes after each pass with descriptive messages
  - Document any breaking changes or migration notes
  - Update relevant documentation for type changes
  - _Requirements: 7.1_