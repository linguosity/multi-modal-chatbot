# Structured AI Processing Design Document

## Overview

This design document outlines the architecture for evolving the AI assistant from HTML-based content updates to structured JSON-based data processing. The system will leverage Claude's tool use capabilities to directly update specific fields within the structured data schemas, providing more precise control, better data integrity, and seamless integration with the existing schema system.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client UI     │    │   API Gateway    │    │  AI Processing  │
│                 │    │                  │    │                 │
│ • Schema Editor │◄──►│ • JSON Updates  │◄──►│ • Claude Tools  │
│ • Field Updates │    │ • Field Merging  │    │ • Schema Aware  │
│ • Change Tracking│    │ • Validation     │    │ • Field Updates │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   State Mgmt    │    │   Schema System  │    │   Database      │
│                 │    │                  │    │                 │
│ • Field Changes │    │ • Validation     │    │ • Structured    │
│ • Undo Stack    │    │ • Type Coercion  │    │ • Data Storage  │
│ • Conflict Res. │    │ • Constraints    │    │ • Change Log    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Processing Pipeline

```
Input Data → Schema Context → AI Analysis → Field Updates → Validation → Merge → UI Updates
     │            │              │             │            │         │         │
     │            │              │             │            │         │         │
  Files/Text   Complete JSON   Claude Tools  Specific     Zod      Smart     Real-time
  Assessment   Structure +     Field Path    Field        Schema   Merging   Indicators
  Content      Schemas         Updates       Changes      Check    Logic     & Feedback
```

## Components and Interfaces

### 1. Enhanced Tool Definition

#### New update_report_data Tool
```typescript
interface UpdateReportDataTool {
  name: "update_report_data"
  description: "Updates specific structured data fields within report sections using precise field paths and merge strategies"
  input_schema: {
    type: "object"
    properties: {
      updates: {
        type: "array"
        items: {
          type: "object"
          properties: {
            section_id: { type: "string", description: "ID of the section to update" }
            field_path: { type: "string", description: "Dot notation path to the field (e.g., 'assessment_results.wisc_scores.verbal_iq')" }
            value: { type: "any", description: "New value for the field" }
            merge_strategy: { 
              enum: ["replace", "append", "merge"], 
              description: "How to handle existing data: replace (overwrite), append (add to arrays/strings), merge (combine objects)" 
            }
            confidence: { type: "number", description: "Confidence level 0-1 for this update" }
            source_reference: { type: "string", description: "Reference to source data that informed this update" }
          }
          required: ["section_id", "field_path", "value", "merge_strategy"]
        }
      }
      processing_summary: {
        type: "string"
        description: "Summary of what was processed and the rationale for these updates"
      }
    }
    required: ["updates"]
  }
}
```

#### Enhanced analyze_assessment_content Tool
```typescript
interface AnalyzeAssessmentContentTool {
  name: "analyze_assessment_content"
  description: "Analyzes assessment content and identifies specific fields that should be updated with extracted data"
  input_schema: {
    type: "object"
    properties: {
      content_analysis: {
        type: "object"
        properties: {
          identified_updates: {
            type: "array"
            items: {
              type: "object"
              properties: {
                section_id: { type: "string" }
                field_path: { type: "string" }
                extracted_value: { type: "any" }
                confidence: { type: "number" }
                data_type: { 
                  enum: ["test_score", "background_info", "observation", "recommendation", "demographic", "assessment_tool"],
                  description: "Type of data extracted"
                }
                merge_strategy: { enum: ["replace", "append", "merge"] }
                rationale: { type: "string", description: "Why this field should be updated with this value" }
              }
              required: ["section_id", "field_path", "extracted_value", "confidence", "data_type", "merge_strategy"]
            }
          }
          processing_notes: { type: "string" }
          schema_coverage: {
            type: "object"
            description: "Analysis of how well the input data covers the available schema fields"
            properties: {
              covered_sections: { type: "array", items: { type: "string" } }
              missing_data: { type: "array", items: { type: "string" } }
              data_quality: { type: "string", enum: ["excellent", "good", "fair", "poor"] }
            }
          }
        }
        required: ["identified_updates", "processing_notes"]
      }
    }
    required: ["content_analysis"]
  }
}
```

### 2. Enhanced API Endpoint

#### Extended Generate Section Route
```typescript
// Extend existing /api/ai/generate-section route
interface GenerateSectionRequest {
  reportId: string
  sectionId?: string // Optional for multi-section updates
  unstructuredInput?: string
  files?: File[]
  generation_type: 'structured_data_processing' | 'multi_modal_assessment' | 'prose' | 'points'
  target_sections?: string[] // Optional section targeting
  processing_mode?: 'analysis_only' | 'update_only' | 'full_processing' // New processing modes
}

interface StructuredProcessingResponse {
  success: boolean
  updatedFields: FieldUpdate[]
  analysisResult?: ContentAnalysis
  validationErrors?: ValidationError[]
  conflictResolutions?: ConflictResolution[]
  processedFiles?: ProcessedFileInfo[]
  message: string
}

interface FieldUpdate {
  section_id: string
  field_path: string
  previous_value: any
  new_value: any
  merge_strategy: 'replace' | 'append' | 'merge'
  confidence: number
  source_reference?: string
  timestamp: string
}
```

#### System Message Enhancement
```typescript
function buildStructuredSystemMessage(
  report: Report, 
  availableSchemas: Record<string, SectionSchema>
): string {
  const reportStructure = JSON.stringify(
    report.sections.map(section => ({
      id: section.id,
      title: section.title,
      sectionType: section.sectionType,
      structured_data: section.structured_data || {},
      schema: availableSchemas[section.sectionType]
    })), 
    null, 
    2
  );

  const schemaDefinitions = JSON.stringify(availableSchemas, null, 2);

  return `You are an expert Speech-Language Pathologist (SLP) report writer with advanced structured data processing capabilities.

TASK: Analyze the provided assessment content and update specific fields in the structured JSON data model.

CURRENT REPORT STRUCTURE:
${reportStructure}

AVAILABLE SCHEMAS:
${schemaDefinitions}

PROCESSING APPROACH:
1. First, use 'analyze_assessment_content' to identify which specific fields should be updated
2. Then, use 'update_report_data' to make precise field-level updates
3. Focus on extracting structured data points rather than generating prose
4. Maintain data types and follow schema constraints

FIELD PATH NOTATION:
- Use dot notation for nested fields: "assessment_results.standardized_tests.0.test_name"
- Array indices: "recommendations.service_recommendations.frequency"
- Object properties: "student_cooperation.cooperative"

MERGE STRATEGIES:
- "replace": Completely overwrite the existing value
- "append": Add to existing arrays or concatenate strings
- "merge": Combine objects while preserving existing properties

DATA EXTRACTION PRIORITIES:
1. Test scores and standardized assessment results
2. Demographic and background information
3. Clinical observations and findings
4. Recommendations and service needs
5. Eligibility and diagnostic information

VALIDATION REQUIREMENTS:
- Respect field types (string, number, boolean, array, object)
- Follow enum constraints where defined
- Maintain required field requirements
- Preserve data relationships and dependencies

You MUST start with 'analyze_assessment_content' to plan your updates, then proceed with 'update_report_data'.`;
}
```

### 3. Smart Field-Level Merging System

#### Merge Engine
```typescript
interface MergeEngine {
  mergeFieldUpdate(
    currentValue: any,
    newValue: any,
    strategy: MergeStrategy,
    fieldSchema: FieldSchema
  ): MergeResult
}

interface MergeResult {
  success: boolean
  mergedValue: any
  conflicts?: ConflictInfo[]
  warnings?: string[]
  metadata: {
    originalValue: any
    strategy: MergeStrategy
    timestamp: string
  }
}

class StructuredDataMerger implements MergeEngine {
  mergeFieldUpdate(
    currentValue: any,
    newValue: any,
    strategy: MergeStrategy,
    fieldSchema: FieldSchema
  ): MergeResult {
    switch (strategy) {
      case 'replace':
        return this.replaceValue(currentValue, newValue, fieldSchema);
      case 'append':
        return this.appendValue(currentValue, newValue, fieldSchema);
      case 'merge':
        return this.mergeValue(currentValue, newValue, fieldSchema);
      default:
        throw new Error(`Unknown merge strategy: ${strategy}`);
    }
  }

  private replaceValue(current: any, newVal: any, schema: FieldSchema): MergeResult {
    // Validate type compatibility
    const validationResult = this.validateFieldValue(newVal, schema);
    if (!validationResult.valid) {
      return {
        success: false,
        mergedValue: current,
        warnings: validationResult.errors,
        metadata: { originalValue: current, strategy: 'replace', timestamp: new Date().toISOString() }
      };
    }

    return {
      success: true,
      mergedValue: newVal,
      metadata: { originalValue: current, strategy: 'replace', timestamp: new Date().toISOString() }
    };
  }

  private appendValue(current: any, newVal: any, schema: FieldSchema): MergeResult {
    if (schema.type === 'array') {
      const currentArray = Array.isArray(current) ? current : [];
      const newArray = Array.isArray(newVal) ? newVal : [newVal];
      
      // Remove duplicates while preserving order
      const merged = [...currentArray];
      newArray.forEach(item => {
        if (!merged.some(existing => this.deepEqual(existing, item))) {
          merged.push(item);
        }
      });

      return {
        success: true,
        mergedValue: merged,
        metadata: { originalValue: current, strategy: 'append', timestamp: new Date().toISOString() }
      };
    } else if (schema.type === 'string') {
      const currentStr = current || '';
      const newStr = String(newVal);
      const separator = currentStr && !currentStr.endsWith('.') && !currentStr.endsWith('\n') ? '. ' : '';
      
      return {
        success: true,
        mergedValue: currentStr + separator + newStr,
        metadata: { originalValue: current, strategy: 'append', timestamp: new Date().toISOString() }
      };
    }

    // For non-appendable types, fall back to replace
    return this.replaceValue(current, newVal, schema);
  }

  private mergeValue(current: any, newVal: any, schema: FieldSchema): MergeResult {
    if (schema.type === 'object' && schema.children) {
      const currentObj = current || {};
      const newObj = newVal || {};
      const merged = { ...currentObj };

      // Merge each property according to its schema
      schema.children.forEach(childSchema => {
        if (newObj.hasOwnProperty(childSchema.key)) {
          const childResult = this.mergeFieldUpdate(
            currentObj[childSchema.key],
            newObj[childSchema.key],
            'merge',
            childSchema
          );
          if (childResult.success) {
            merged[childSchema.key] = childResult.mergedValue;
          }
        }
      });

      return {
        success: true,
        mergedValue: merged,
        metadata: { originalValue: current, strategy: 'merge', timestamp: new Date().toISOString() }
      };
    }

    // For non-mergeable types, fall back to replace
    return this.replaceValue(current, newVal, schema);
  }

  private validateFieldValue(value: any, schema: FieldSchema): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Type validation
    switch (schema.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`Expected string, got ${typeof value}`);
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`Expected number, got ${typeof value}`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`Expected boolean, got ${typeof value}`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`Expected array, got ${typeof value}`);
        }
        break;
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push(`Expected object, got ${typeof value}`);
        }
        break;
    }

    // Enum validation
    if (schema.options && !schema.options.includes(String(value))) {
      errors.push(`Value "${value}" not in allowed options: ${schema.options.join(', ')}`);
    }

    return { valid: errors.length === 0, errors };
  }

  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key) || !this.deepEqual(a[key], b[key])) {
          return false;
        }
      }
      return true;
    }
    
    return false;
  }
}
```

### 4. Field Path Utilities

#### Path Resolution System
```typescript
interface FieldPathResolver {
  getFieldValue(data: any, path: string): any
  setFieldValue(data: any, path: string, value: any): any
  validateFieldPath(path: string, schema: SectionSchema): boolean
  getFieldSchema(path: string, schema: SectionSchema): FieldSchema | null
}

class StructuredFieldPathResolver implements FieldPathResolver {
  getFieldValue(data: any, path: string): any {
    const parts = path.split('.');
    let current = data;
    
    for (const part of parts) {
      if (current == null) return undefined;
      
      // Handle array indices
      if (/^\d+$/.test(part)) {
        const index = parseInt(part, 10);
        if (Array.isArray(current) && index < current.length) {
          current = current[index];
        } else {
          return undefined;
        }
      } else {
        current = current[part];
      }
    }
    
    return current;
  }

  setFieldValue(data: any, path: string, value: any): any {
    const parts = path.split('.');
    const result = JSON.parse(JSON.stringify(data)); // Deep clone
    let current = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      
      if (/^\d+$/.test(part)) {
        const index = parseInt(part, 10);
        if (!Array.isArray(current)) {
          throw new Error(`Expected array at path segment "${parts.slice(0, i + 1).join('.')}"`);
        }
        
        // Extend array if necessary
        while (current.length <= index) {
          current.push({});
        }
        current = current[index];
      } else {
        if (current[part] == null) {
          // Determine if next part is array index
          const nextPart = parts[i + 1];
          current[part] = /^\d+$/.test(nextPart) ? [] : {};
        }
        current = current[part];
      }
    }
    
    const lastPart = parts[parts.length - 1];
    if (/^\d+$/.test(lastPart)) {
      const index = parseInt(lastPart, 10);
      if (!Array.isArray(current)) {
        throw new Error(`Expected array at final path segment`);
      }
      while (current.length <= index) {
        current.push(null);
      }
      current[index] = value;
    } else {
      current[lastPart] = value;
    }
    
    return result;
  }

  validateFieldPath(path: string, schema: SectionSchema): boolean {
    try {
      return this.getFieldSchema(path, schema) !== null;
    } catch {
      return false;
    }
  }

  getFieldSchema(path: string, schema: SectionSchema): FieldSchema | null {
    const parts = path.split('.');
    let currentFields = schema.fields;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      // Skip array indices
      if (/^\d+$/.test(part)) {
        continue;
      }
      
      const field = currentFields.find(f => f.key === part);
      if (!field) return null;
      
      // If this is the last part, return the field
      if (i === parts.length - 1) {
        return field;
      }
      
      // Navigate deeper for object types
      if (field.type === 'object' && field.children) {
        currentFields = field.children;
      } else if (field.type === 'array') {
        // For arrays, we need to look at the next non-numeric part
        continue;
      } else {
        return null; // Can't navigate deeper
      }
    }
    
    return null;
  }
}
```

### 5. Change Tracking and Visualization

#### Field-Level Change Tracking
```typescript
interface FieldChange {
  id: string
  section_id: string
  field_path: string
  previous_value: any
  new_value: any
  change_type: 'ai_update' | 'user_edit' | 'merge' | 'validation_fix'
  confidence?: number
  source_reference?: string
  timestamp: string
  acknowledged: boolean
}

interface ChangeTracker {
  trackFieldChange(change: Omit<FieldChange, 'id' | 'timestamp' | 'acknowledged'>): string
  getChangesForSection(sectionId: string): FieldChange[]
  getUnacknowledgedChanges(): FieldChange[]
  acknowledgeChange(changeId: string): void
  revertChange(changeId: string): Promise<void>
}

class StructuredChangeTracker implements ChangeTracker {
  private changes: Map<string, FieldChange> = new Map();
  private changeListeners: ((change: FieldChange) => void)[] = [];

  trackFieldChange(change: Omit<FieldChange, 'id' | 'timestamp' | 'acknowledged'>): string {
    const id = `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullChange: FieldChange = {
      ...change,
      id,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    this.changes.set(id, fullChange);
    this.notifyListeners(fullChange);
    return id;
  }

  getChangesForSection(sectionId: string): FieldChange[] {
    return Array.from(this.changes.values())
      .filter(change => change.section_id === sectionId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getUnacknowledgedChanges(): FieldChange[] {
    return Array.from(this.changes.values())
      .filter(change => !change.acknowledged)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  acknowledgeChange(changeId: string): void {
    const change = this.changes.get(changeId);
    if (change) {
      change.acknowledged = true;
      this.changes.set(changeId, change);
    }
  }

  async revertChange(changeId: string): Promise<void> {
    const change = this.changes.get(changeId);
    if (!change) throw new Error(`Change ${changeId} not found`);

    // Implementation would revert the field to its previous value
    // This would involve calling the field path resolver and updating the database
    throw new Error('Revert functionality not yet implemented');
  }

  private notifyListeners(change: FieldChange): void {
    this.changeListeners.forEach(listener => {
      try {
        listener(change);
      } catch (error) {
        console.error('Error in change listener:', error);
      }
    });
  }

  addChangeListener(listener: (change: FieldChange) => void): void {
    this.changeListeners.push(listener);
  }

  removeChangeListener(listener: (change: FieldChange) => void): void {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }
}
```

#### Visual Change Indicators
```typescript
interface FieldChangeIndicator {
  field_path: string
  change_type: 'new' | 'updated' | 'conflict'
  confidence?: number
  timestamp: string
  acknowledged: boolean
}

// React component for field-level indicators
interface FieldIndicatorProps {
  fieldPath: string
  changes: FieldChange[]
  onAcknowledge: (changeId: string) => void
  onRevert: (changeId: string) => void
}

const FieldChangeIndicator: React.FC<FieldIndicatorProps> = ({ 
  fieldPath, 
  changes, 
  onAcknowledge, 
  onRevert 
}) => {
  const unacknowledgedChanges = changes.filter(c => !c.acknowledged);
  
  if (unacknowledgedChanges.length === 0) return null;

  const latestChange = unacknowledgedChanges[0];
  const indicatorColor = latestChange.confidence && latestChange.confidence > 0.8 
    ? 'bg-green-100 border-green-300' 
    : 'bg-yellow-100 border-yellow-300';

  return (
    <div className={`absolute -top-1 -right-1 ${indicatorColor} border rounded-full p-1 animate-pulse`}>
      <div className="w-2 h-2 bg-current rounded-full" />
      
      {/* Tooltip with change details */}
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
        <div className="bg-gray-900 text-white text-xs rounded p-2 whitespace-nowrap">
          <div>Field: {fieldPath}</div>
          <div>Changed: {new Date(latestChange.timestamp).toLocaleString()}</div>
          {latestChange.confidence && (
            <div>Confidence: {Math.round(latestChange.confidence * 100)}%</div>
          )}
          <div className="flex gap-1 mt-1">
            <button 
              onClick={() => onAcknowledge(latestChange.id)}
              className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
            >
              ✓ Accept
            </button>
            <button 
              onClick={() => onRevert(latestChange.id)}
              className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
            >
              ↶ Revert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Data Models

### Enhanced Section Schema
```typescript
interface EnhancedReportSection {
  id: string
  sectionType: string
  title: string
  content: string // Legacy HTML content
  structured_data?: any // New structured JSON data
  schema?: SectionSchema // Schema definition for this section
  order: number
  isRequired: boolean
  isGenerated: boolean
  lastUpdated: string
  change_tracking?: {
    field_changes: FieldChange[]
    last_ai_update: string
    validation_status: 'valid' | 'invalid' | 'warning'
    validation_errors?: string[]
  }
}
```

### Processing State
```typescript
interface StructuredProcessingState {
  id: string
  reportId: string
  status: 'analyzing' | 'updating' | 'validating' | 'completed' | 'failed'
  progress: {
    current_step: string
    completed_steps: string[]
    total_steps: number
  }
  analysis_result?: ContentAnalysis
  field_updates: FieldUpdate[]
  validation_results: ValidationResult[]
  conflicts: ConflictResolution[]
  created_at: string
  completed_at?: string
}
```

### Validation System
```typescript
interface ValidationResult {
  field_path: string
  is_valid: boolean
  errors: string[]
  warnings: string[]
  suggested_fixes?: any[]
}

interface SchemaValidator {
  validateSection(data: any, schema: SectionSchema): ValidationResult[]
  validateField(value: any, fieldSchema: FieldSchema, path: string): ValidationResult
  suggestFixes(validationResult: ValidationResult): any[]
}
```

## Error Handling

### Field-Level Error Handling
- **Invalid Field Paths**: Validate paths against schema before processing
- **Type Mismatches**: Attempt type coercion before rejecting updates
- **Schema Violations**: Provide specific error messages with correction suggestions
- **Merge Conflicts**: Present user with resolution options and preview

### Processing Error Recovery
- **Partial Updates**: Apply successful updates even if some fail
- **Rollback Capability**: Maintain transaction-like behavior for complex updates
- **Validation Failures**: Continue processing other fields while flagging issues
- **AI Tool Errors**: Graceful degradation to HTML-based approach

## Testing Strategy

### Unit Testing
- Field path resolution and validation
- Merge strategy implementations
- Schema validation logic
- Change tracking functionality

### Integration Testing
- End-to-end structured data processing
- Claude API integration with new tools
- Database transaction handling
- UI component updates with field changes

### Performance Testing
- Large structured data processing
- Complex nested object updates
- Concurrent field modifications
- Memory usage with deep object structures

## Migration Strategy

### Backward Compatibility
1. **Dual Mode Support**: Sections can use either HTML or structured data
2. **Gradual Migration**: Convert sections one at a time
3. **Fallback Mechanisms**: HTML generation if structured processing fails
4. **Data Preservation**: Maintain existing content during migration

### Migration Tools
```typescript
interface MigrationTool {
  convertHtmlToStructuredData(html: string, schema: SectionSchema): any
  validateMigration(original: string, converted: any): MigrationResult
  previewMigration(section: ReportSection, schema: SectionSchema): MigrationPreview
}
```

### Rollout Plan
1. **Phase 1**: Implement structured processing alongside existing system
2. **Phase 2**: Add migration tools and user interface
3. **Phase 3**: Encourage adoption with new features
4. **Phase 4**: Deprecate HTML-only approach
5. **Phase 5**: Remove legacy code after full migration

## Performance Optimization

### Efficient Field Updates
- **Batch Processing**: Group related field updates
- **Lazy Validation**: Validate only changed fields
- **Incremental Updates**: Update only modified sections
- **Caching**: Cache schema validation results

### Memory Management
- **Shallow Cloning**: Minimize deep object copying
- **Streaming Updates**: Process large datasets in chunks
- **Garbage Collection**: Clean up temporary objects
- **Memory Monitoring**: Track usage during processing

### Database Optimization
- **Atomic Updates**: Use transactions for multi-field changes
- **Indexing**: Index commonly queried field paths
- **Compression**: Compress large structured data objects
- **Connection Pooling**: Manage database connections efficiently

## Security Considerations

### Data Validation
- **Input Sanitization**: Validate all field values
- **Schema Enforcement**: Prevent unauthorized schema modifications
- **Type Safety**: Ensure type consistency across updates
- **Injection Prevention**: Sanitize field paths and values

### Access Control
- **Field-Level Permissions**: Control access to sensitive fields
- **Audit Logging**: Track all field modifications
- **User Authentication**: Verify user permissions for updates
- **Data Encryption**: Encrypt sensitive structured data

This design provides a comprehensive foundation for implementing structured JSON-based AI processing while maintaining backward compatibility and ensuring data integrity throughout the system.
</content>