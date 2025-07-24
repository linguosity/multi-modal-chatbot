# AI Assessment Processing Design Document

## Overview

This design document outlines the architecture for enhancing the existing AI assistant with multi-modal assessment processing capabilities. The system will leverage Claude's tool use functionality to intelligently process various input types (text, images, PDFs, audio) and automatically populate report sections with structured data, while providing visual feedback through animated TOC indicators.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client UI     │    │   API Gateway    │    │  AI Processing  │
│                 │    │                  │    │                 │
│ • Upload Modal  │◄──►│ • File Upload    │◄──►│ • Claude Tools  │
│ • Progress UI   │    │ • Processing     │    │ • OpenAI Whisper│
│ • TOC Indicators│    │ • Status Updates │    │ • OCR Service   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   State Mgmt    │    │   File Storage   │    │   Database      │
│                 │    │                  │    │                 │
│ • Update Queue  │    │ • Supabase       │    │ • Reports       │
│ • Change Tracking│    │ • Temp Files     │    │ • Audit Trail   │
│ • Undo Stack    │    │ • Processing     │    │ • Change Log    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Processing Pipeline

```
Input Files/Text → Content Extraction → AI Analysis → Section Mapping → Content Integration → UI Updates
      │                    │               │             │                 │              │
      │                    │               │             │                 │              │
   File Type            OCR/Parse      Claude Tools   Smart Routing    Conflict Res.   Animations
   Detection            Text Extract    Data Extract   Section Match    Content Merge   Indicators
```

## Components and Interfaces

### 1. Enhanced Upload System

#### MultiModalUploadModal Component
```typescript
interface MultiModalUploadModalProps {
  reportId: string
  availableSections: ReportSection[]
  onProcessingComplete: (results: ProcessingResults) => void
  onClose: () => void
}

interface ProcessingResults {
  updatedSections: string[]
  extractedData: ExtractedData
  conflicts: ContentConflict[]
  auditTrail: ChangeRecord[]
}
```

#### File Processing Service
```typescript
// Extend the existing generate-section API to handle files
interface FileProcessor {
  processFile(file: File): Promise<ProcessedContent>
  extractTextFromPDF(file: File): Promise<string>
  transcribeAudio(file: File): Promise<string> // OpenAI Whisper
  extractTextFromImage(file: File): Promise<string> // Claude Vision or OCR
}

// Enhanced API endpoint structure
interface GenerateSectionRequest {
  reportId: string
  sectionId?: string // Optional - let AI determine if not provided
  unstructuredInput?: string
  files?: File[] // New: support multiple files
  generation_type: 'multi_modal_assessment' | 'prose' | 'points'
  target_sections?: string[] // Optional section targeting
}

// File processing utilities
async function processUploadedFiles(files: File[]): Promise<Anthropic.MessageParam["content"]> {
  const fileContent: Anthropic.MessageParam["content"] = [];
  
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      const base64 = await fileToBase64(file);
      fileContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: file.type as any,
          data: base64
        }
      });
    } else if (file.type === 'application/pdf') {
      const pdfText = await extractPDFText(file);
      fileContent.push({ 
        type: "text", 
        text: `PDF Content from ${file.name}:\n${pdfText}` 
      });
    } else if (file.type.startsWith('audio/')) {
      const transcript = await transcribeAudio(file);
      fileContent.push({ 
        type: "text", 
        text: `Audio Transcript from ${file.name}:\n${transcript}` 
      });
    }
  }
  
  return fileContent;
}
```

### 2. AI Processing Engine

#### Enhanced Claude Integration

Building on the existing single-tool architecture, we'll extend the current `/api/ai/generate-section` endpoint to support multi-modal input and intelligent section mapping.

#### Current Tool Structure (Extended)
```typescript
// Extend the existing update_report_section tool
const tools = [
  {
    name: "update_report_section",
    description: "Updates the rich text content of a specific section within the report.",
    input_schema: {
      type: "object" as const,
      properties: {
        section_id: { type: "string", description: "The ID of the report section to update." },
        content: { 
          type: "string", 
          description: "The new, AI-generated rich text content for the specified report section. Should be properly formatted HTML with appropriate structure (paragraphs, headings, lists, etc.)." 
        },
        confidence: { 
          type: "number", 
          description: "Confidence level (0-1) in the extracted/generated content" 
        },
        source_data: {
          type: "array",
          description: "Array of source data references that informed this content",
          items: { type: "string" }
        }
      },
      required: ["section_id", "content"]
    }
  },
  {
    name: "analyze_assessment_content",
    description: "Analyze multi-modal assessment content and determine which sections should be updated",
    input_schema: {
      type: "object",
      properties: {
        content_analysis: {
          type: "object",
          properties: {
            identified_sections: {
              type: "array",
              items: {
                type: "object", 
                properties: {
                  section_id: { type: "string" },
                  relevance_score: { type: "number" },
                  extracted_data: { type: "string" },
                  data_type: { type: "string", enum: ["test_scores", "background", "observations", "recommendations"] }
                }
              }
            },
            processing_notes: { type: "string" }
          }
        }
      }
    }
  }
]
```

#### Enhanced System Prompting
```typescript
// Multi-modal assessment processing prompt
const systemMessageContent = `You are an expert Speech-Language Pathologist (SLP) report writer with advanced assessment analysis capabilities.

TASK: Analyze the provided multi-modal assessment content (text, images, PDFs, audio transcripts) and intelligently populate relevant report sections.

AVAILABLE SECTIONS:
${availableSections.map(s => `- ${s.id}: ${s.title} (${s.ai_directive || 'Standard section'})`).join('\n')}

PROCESSING APPROACH:
1. First, analyze all provided content using the 'analyze_assessment_content' tool to identify relevant sections
2. Then, for each identified section, use 'update_report_section' to generate appropriate content
3. Prioritize sections based on the richness and relevance of available data
4. Maintain professional clinical tone and proper formatting

CONTENT INTEGRATION RULES:
- Preserve existing content when possible, merging new information appropriately
- Use structured formatting (lists, headings) for complex information
- Include confidence indicators for extracted data
- Reference source materials when generating content

You MUST start by calling 'analyze_assessment_content' to plan your approach, then proceed with section updates.`;
```

#### Multi-Tool Processing Loop
```typescript
// Implement the conversation continuation pattern mentioned in development log
async function processWithMultipleTools(
  anthropic: Anthropic,
  messages: Anthropic.MessageParam[],
  tools: any[],
  systemMessage: string
): Promise<ProcessingResult> {
  let conversationMessages = [...messages];
  let updatedSections: string[] = [];
  let analysisResult: any = null;
  
  while (true) {
    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 4096,
      system: systemMessage,
      tools: tools,
      messages: conversationMessages
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    if (!toolUse) break; // No more tools to use

    // Process the tool call
    let toolResult: any;
    if (toolUse.name === 'analyze_assessment_content') {
      analysisResult = toolUse.input;
      toolResult = { success: true, message: "Analysis complete" };
    } else if (toolUse.name === 'update_report_section') {
      // Update the section in database
      toolResult = await updateReportSection(toolUse.input, report, supabase);
      if (toolResult.success) {
        updatedSections.push(toolUse.input.section_id);
      }
    }

    // Continue conversation with tool result
    conversationMessages.push({
      role: "assistant",
      content: response.content
    });
    
    conversationMessages.push({
      role: "user", 
      content: [{
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: JSON.stringify(toolResult),
        is_error: !toolResult.success
      }]
    });

    // Check if Claude wants to continue
    if (response.stop_reason !== 'tool_use') break;
  }

  return { updatedSections, analysisResult };
}
```

### 3. Visual Feedback System

#### TOC Update Indicators
```typescript
interface TOCIndicator {
  sectionId: string
  indicatorType: 'new' | 'updated' | 'conflict'
  timestamp: Date
  fieldUpdates?: FieldUpdate[]
  acknowledged: boolean
}

interface FieldUpdate {
  fieldPath: string
  changeType: 'added' | 'modified' | 'merged'
  previousValue?: any
  newValue: any
}
```

#### Animation Component
```typescript
interface UpdateIndicatorProps {
  indicators: TOCIndicator[]
  onAcknowledge: (sectionId: string) => void
  animationDuration: number
}
```

### 4. Content Integration Engine

#### Conflict Resolution System
```typescript
interface ConflictResolver {
  detectConflicts(existing: any, incoming: any): ContentConflict[]
  suggestResolution(conflict: ContentConflict): ResolutionSuggestion[]
  applyResolution(conflict: ContentConflict, resolution: Resolution): MergeResult
}

interface ContentConflict {
  sectionId: string
  fieldPath: string
  existingValue: any
  incomingValue: any
  conflictType: 'duplicate' | 'contradiction' | 'format_mismatch'
  confidence: number
}
```

#### Smart Merging
```typescript
interface ContentMerger {
  mergeStructuredData(existing: any, incoming: any): MergeResult
  preserveUserEdits(content: any, userModifications: any): any
  maintainFormatting(content: string, targetFormat: string): string
}
```

## Data Models

### Processing State
```typescript
interface ProcessingState {
  id: string
  reportId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  currentStep: string
  inputFiles: ProcessedFile[]
  results?: ProcessingResults
  errors?: ProcessingError[]
  createdAt: Date
  completedAt?: Date
}
```

### Audit Trail
```typescript
interface ChangeRecord {
  id: string
  reportId: string
  sectionId: string
  changeType: 'ai_update' | 'user_edit' | 'merge' | 'undo'
  beforeState: any
  afterState: any
  metadata: {
    sourceFiles?: string[]
    aiModel: string
    confidence?: number
    userApproved?: boolean
  }
  timestamp: Date
}
```

### Extracted Data Schema
```typescript
interface ExtractedData {
  testScores: TestScore[]
  backgroundInfo: BackgroundInfo
  observations: Observation[]
  recommendations: Recommendation[]
  parentConcerns: string[]
  metadata: {
    extractionConfidence: number
    sourceFiles: string[]
    processingTime: number
  }
}
```

## Error Handling

### File Processing Errors
- **Unsupported Format**: Clear error message with supported formats list
- **File Size Limits**: Progressive upload with compression options
- **OCR Failures**: Fallback to manual text input with partial results
- **Audio Transcription Errors**: Retry mechanism with quality adjustment

### AI Processing Errors
- **API Rate Limits**: Queue system with retry backoff
- **Content Extraction Failures**: Graceful degradation to text processing
- **Tool Use Errors**: Fallback to standard generation with manual mapping
- **Timeout Handling**: Partial results with continuation options

### Data Integration Errors
- **Schema Validation**: Field-level error reporting with correction suggestions
- **Conflict Resolution**: User intervention prompts with preview options
- **Database Errors**: Transaction rollback with state recovery
- **Concurrent Modifications**: Optimistic locking with merge conflict resolution

## Testing Strategy

### Unit Testing
- File processing utilities (PDF, image, audio extraction)
- AI tool use functions and response parsing
- Content merging and conflict resolution algorithms
- Animation and indicator state management

### Integration Testing
- End-to-end file upload and processing pipeline
- Claude API integration with tool use scenarios
- Database transaction handling for complex updates
- Real-time UI updates and state synchronization

### User Acceptance Testing
- Multi-modal input scenarios with various file types
- Complex assessment document processing
- Conflict resolution user workflows
- Performance testing with large files and reports

### Performance Testing
- File upload and processing speed benchmarks
- AI processing time optimization
- Memory usage during large file processing
- Concurrent user processing load testing

## Security Considerations

### File Upload Security
- File type validation and sanitization
- Virus scanning for uploaded documents
- Size limits and rate limiting per user
- Temporary file cleanup and secure deletion

### Data Privacy
- Encrypted file storage during processing
- Audit trail access controls
- User data isolation and access logging
- HIPAA compliance for medical information

### AI Processing Security
- Input sanitization for AI prompts
- Output validation and content filtering
- API key rotation and secure storage
- Rate limiting and abuse prevention

## Performance Optimization

### File Processing
- Parallel processing for multiple files
- Progressive upload with chunking
- Client-side compression before upload
- Caching of processed content

### AI Processing
- Batch processing for multiple sections
- Response streaming for large content
- Intelligent prompt optimization
- Result caching for similar inputs

### UI Responsiveness
- Optimistic UI updates during processing
- Progressive loading of results
- Background processing with notifications
- Efficient state management and re-rendering