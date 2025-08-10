# Structured AI Processing Requirements

## ⚠️ CRITICAL DEVELOPMENT WARNING

**Stack Overflow Risk**: This feature processes deeply nested report data structures. All implementations MUST use iterative algorithms, never recursive ones. See `DEVELOPMENT_GUIDELINES.md` for mandatory patterns and code review checklist.

**Mandatory Before Implementation:**
- [ ] Review `DEVELOPMENT_GUIDELINES.md`
- [ ] Use iterative traversal for all object processing
- [ ] Never use `JSON.stringify` in useEffect dependencies
- [ ] Gate debug logging behind `process.env.NEXT_PUBLIC_DEBUG`

## Introduction

This feature will evolve the AI assistant from HTML-based content updates to structured JSON-based data processing. Instead of generating HTML content for report sections, the AI will directly update specific fields within the structured data schemas, providing more precise control, better data integrity, and seamless integration with the existing schema system.

## Requirements

### Requirement 1: JSON-Based Data Updates

**User Story:** As a developer, I want the AI to update specific fields in the structured JSON data rather than generating HTML content so that data integrity is maintained and the updates integrate seamlessly with the schema system.

#### Acceptance Criteria

1. WHEN the AI processes assessment content THEN it SHALL update specific fields in the JSON structure using field paths
2. WHEN updating nested data THEN the system SHALL support dot notation field paths (e.g., "assessment_results.wisc_scores.verbal_iq")
3. WHEN multiple fields need updates THEN the system SHALL batch all changes in a single operation
4. WHEN field updates are applied THEN the system SHALL validate against the section's schema
5. IF a field path is invalid THEN the system SHALL return a specific error without affecting other updates
6. WHEN updates are successful THEN the system SHALL return the complete updated section data
7. WHEN schema validation fails THEN the system SHALL preserve the original data and report validation errors

### Requirement 2: Enhanced Tool Definition for Structured Updates

**User Story:** As a system, I want to provide Claude with a comprehensive tool for updating structured data so that it can make precise, targeted changes to specific fields within report sections.

#### Acceptance Criteria

1. WHEN defining the update tool THEN it SHALL accept an array of field updates with section IDs, field paths, and values
2. WHEN specifying merge strategies THEN the tool SHALL support "replace", "append", and "merge" operations
3. WHEN updating array fields THEN the system SHALL support adding, removing, or modifying specific array elements
4. WHEN updating object fields THEN the system SHALL support partial object updates without overwriting unrelated properties
5. IF the tool receives invalid parameters THEN it SHALL return detailed error information for each invalid update
6. WHEN processing updates THEN the tool SHALL maintain referential integrity between related fields
7. WHEN updates are complete THEN the tool SHALL return a summary of all changes made

### Requirement 3: Complete Report Structure Context

**User Story:** As Claude, I want to receive the complete report structure and available schemas so that I can understand the data model and make informed decisions about which fields to update.

#### Acceptance Criteria

1. WHEN processing begins THEN Claude SHALL receive the complete JSON structure of all report sections
2. WHEN schemas are available THEN Claude SHALL receive the schema definitions for each section type
3. WHEN existing data is present THEN Claude SHALL see the current values for all fields
4. WHEN field constraints exist THEN Claude SHALL receive validation rules and allowed values
5. IF sections have relationships THEN Claude SHALL understand the dependencies between fields
6. WHEN making updates THEN Claude SHALL have access to field descriptions and expected data types
7. WHEN processing multiple sections THEN Claude SHALL see the complete context to avoid conflicts

### Requirement 4: Smart Field-Level Merging

**User Story:** As a user, I want the system to intelligently merge new data with existing structured data so that no information is lost and the updates are contextually appropriate.

#### Acceptance Criteria

1. WHEN merging array data THEN the system SHALL detect and avoid duplicate entries
2. WHEN updating object fields THEN the system SHALL preserve unrelated properties
3. WHEN appending to lists THEN the system SHALL maintain logical ordering and grouping
4. WHEN replacing values THEN the system SHALL preserve data types and format constraints
5. IF merge conflicts occur THEN the system SHALL flag conflicts for user review
6. WHEN merging nested structures THEN the system SHALL handle deep object merging correctly
7. WHEN updates affect calculated fields THEN the system SHALL update dependent values automatically

### Requirement 5: Precise Change Tracking and Visualization

**User Story:** As a user, I want to see exactly which fields were changed by the AI so that I can review and approve specific modifications rather than entire sections.

#### Acceptance Criteria

1. WHEN fields are updated THEN the system SHALL track changes at the individual field level
2. WHEN displaying changes THEN the UI SHALL highlight specific fields that were modified
3. WHEN showing change history THEN the system SHALL display before and after values for each field
4. WHEN multiple fields change THEN the system SHALL group related changes logically
5. IF nested fields are updated THEN the system SHALL show the complete field path for clarity
6. WHEN changes are reviewed THEN users SHALL be able to approve or reject individual field updates
7. WHEN field changes are undone THEN the system SHALL restore the exact previous values

### Requirement 6: Schema-Aware Validation and Error Handling

**User Story:** As a system, I want to validate all AI-generated updates against the defined schemas so that data integrity is maintained and invalid updates are prevented.

#### Acceptance Criteria

1. WHEN updates are received THEN the system SHALL validate each field against its schema definition
2. WHEN validation fails THEN the system SHALL provide specific error messages for each invalid field
3. WHEN data types don't match THEN the system SHALL attempt type coercion before rejecting updates
4. WHEN required fields are missing THEN the system SHALL flag missing data without blocking other updates
5. IF enum values are invalid THEN the system SHALL suggest valid alternatives
6. WHEN constraints are violated THEN the system SHALL explain the constraint and provide guidance
7. WHEN validation succeeds THEN the system SHALL confirm the data meets all schema requirements

### Requirement 7: Backward Compatibility with HTML Approach

**User Story:** As a developer, I want to maintain backward compatibility with the existing HTML-based approach so that the transition can be gradual and existing functionality continues to work.

#### Acceptance Criteria

1. WHEN sections use structured schemas THEN the system SHALL use the new JSON-based approach
2. WHEN sections are HTML-only THEN the system SHALL fall back to the existing HTML generation
3. WHEN mixed section types exist THEN the system SHALL handle both approaches in the same report
4. WHEN migrating sections THEN the system SHALL provide tools to convert HTML content to structured data
5. IF structured processing fails THEN the system SHALL gracefully fall back to HTML generation
6. WHEN both approaches are used THEN the system SHALL maintain consistent user experience
7. WHEN deprecating HTML approach THEN the system SHALL provide clear migration paths

### Requirement 8: Performance Optimization for Complex Structures

**User Story:** As a user, I want the structured data processing to be fast and efficient even with complex nested data structures so that the AI assistant remains responsive.

#### Acceptance Criteria

1. WHEN processing large data structures THEN the system SHALL optimize field access and updates
2. WHEN making multiple updates THEN the system SHALL batch operations to minimize database calls
3. WHEN validating complex schemas THEN the system SHALL cache validation results for repeated operations
4. WHEN updating nested fields THEN the system SHALL use efficient deep object manipulation
5. IF processing takes too long THEN the system SHALL provide progress indicators and allow cancellation
6. WHEN memory usage is high THEN the system SHALL implement streaming or chunked processing
7. WHEN concurrent updates occur THEN the system SHALL handle race conditions and maintain data consistency
</content>