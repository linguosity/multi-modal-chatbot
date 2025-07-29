import { NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/route-handler-client';
import Anthropic from '@anthropic-ai/sdk'
import { processMultipleFiles, filesToClaudeContent, ProcessedFile } from '@/lib/file-processing';
import { StructuredFieldPathResolver } from '@/lib/field-path-resolver';
import { getSectionSchemaForType } from '@/lib/structured-schemas';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Define section type for consistency
type Section = {
  id: string;
  sectionType?: string;
  title?: string;
  ai_directive?: string;
  content?: string;
  structured_data?: any; // New field for structured JSON data
  isGenerated?: boolean;
  lastUpdated?: string;
};

/**
 * Handles multi-modal assessment processing with conversation loop
 */
async function handleMultiModalAssessment(
  messages: Anthropic.MessageParam[],
  systemMessage: string,
  tools: Anthropic.Tool[],
  report: { sections: Section[] },
  supabase: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  reportId: string,
  processedFiles: ProcessedFile[]
): Promise<NextResponse> {
  const conversationMessages = [...messages];
  const updatedSections: string[] = [];
  let analysisResult: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  const maxIterations = 10; // Prevent infinite loops
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;
    
    console.log(`🔄 Iteration ${iteration}: ${iteration === 1 ? 'Forcing analyze_assessment_content tool' : 'Auto tool selection'}`);
    
    let response: Anthropic.Message;
    let toolUse: Anthropic.ToolUseBlock | undefined;
    let toolResult: { success: boolean; message: string; data?: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
    
    try {
      console.log('⏱️ Starting Anthropic API call...');
      const startTime = Date.now();
      
      // Retry logic for overloaded errors
      let retryCount = 0;
      const maxRetries = 3;
      const baseDelay = 2000; // 2 seconds
      
      while (retryCount <= maxRetries) {
        try {
          response = await anthropic.messages.create({
            model: "claude-3-7-sonnet-20250219", // Claude 3.7 Sonnet with PDF support
            max_tokens: 16384, // Increased for PDF analysis (doubled from 8192)
            system: systemMessage,
            tools: tools,
            messages: conversationMessages,
            // Force Claude to use analyze_assessment_content on first iteration
            ...(iteration === 1 ? { tool_choice: { type: "tool", name: "analyze_assessment_content" } } : {})
          });
          
          // Success - break out of retry loop
          break;
          
        } catch (apiError: any) {
          const isOverloaded = apiError?.status === 529 || 
                              apiError?.error?.type === 'overloaded_error' ||
                              apiError?.message?.includes('Overloaded');
          
          if (isOverloaded && retryCount < maxRetries) {
            retryCount++;
            const delay = baseDelay * Math.pow(2, retryCount - 1); // Exponential backoff
            console.log(`⚠️ Anthropic API overloaded (attempt ${retryCount}/${maxRetries + 1}), retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          // If not overloaded or max retries reached, re-throw the error
          throw apiError;
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`⏱️ API call completed in ${duration}ms${retryCount > 0 ? ` (after ${retryCount} retries)` : ''}`);

      console.log(`📊 Response stop_reason: ${response.stop_reason}`);
      console.log(`🔧 Response content blocks: ${response.content.map(c => c.type).join(', ')}`);

      // Check for max_tokens issue
      if (response.stop_reason === 'max_tokens') {
        console.log('⚠️ Response was truncated due to max_tokens limit');
      }

      toolUse = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      if (!toolUse) {
        console.log('❌ No tool use found, breaking loop');
        break; // No more tools to use
      }

      // Check if tool input is empty due to truncation
      if (!toolUse.input || Object.keys(toolUse.input).length === 0) {
        console.log('❌ Tool input is empty, likely due to max_tokens truncation');
        break;
      }
      
      console.log(`🛠️ Tool used: ${toolUse.name}`);
      console.log(`📝 Tool input preview: ${JSON.stringify(toolUse.input).substring(0, 200)}...`);

      // Process the tool call
      if (toolUse.name === 'analyze_assessment_content') {
        console.log('🔍 Processing analyze_assessment_content tool...');
        analysisResult = toolUse.input;
        console.log(`📊 Analysis result keys: ${Object.keys(analysisResult || {}).join(', ')}`);
        toolResult = { success: true, message: "Analysis complete", data: analysisResult };
      } else if (toolUse.name === 'update_report_section') {
      const { section_id, content } = toolUse.input as { 
        section_id: string; 
        content: string; 
        confidence?: number;
        source_data?: string[];
      };
      
      const sectionIndex = (report.sections as Section[]).findIndex((sec: Section) => sec.id === section_id);
      
      if (sectionIndex !== -1) {
        // Update the section content
        report.sections[sectionIndex].content = content;
        report.sections[sectionIndex].isGenerated = true;
        report.sections[sectionIndex].lastUpdated = new Date().toISOString();
        
        updatedSections.push(section_id);
        toolResult = { success: true, message: `Updated section ${section_id}` };
      } else {
        toolResult = { success: false, message: `Section ${section_id} not found` };
      }
    } else if (toolUse.name === 'update_report_data') {
      // New structured data processing
      console.log('🔍 Raw tool input:', JSON.stringify(toolUse.input, null, 2));
      
      let updates: Array<{
        section_id: string;
        field_path: string;
        value: any;
        merge_strategy: 'replace' | 'append' | 'merge';
        confidence?: number;
        source_reference?: string;
      }> = [];
      
      let processing_summary: string | undefined;
      
      try {
        // Handle case where Claude returns updates as a JSON string
        const rawInput = toolUse.input as any;
        
        if (typeof rawInput.updates === 'string') {
          console.log('🔧 Parsing updates from JSON string...');
          // The model sometimes returns a string that is not perfectly formatted JSON.
          // This regex will find the array within the string.
          const jsonMatch = rawInput.updates.match(/(\[[\s\S]*\])/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              updates = JSON.parse(jsonMatch[1]);
            } catch (e) {
              console.error('❌ Failed to parse extracted JSON array:', e);
              throw new Error('Failed to parse the "updates" array from the model response.');
            }
          } else {
            throw new Error('Could not find a valid JSON array within the "updates" string.');
          }
        } else if (Array.isArray(rawInput.updates)) {
          console.log('🔧 Using updates array directly...');
          updates = rawInput.updates;
        } else {
          console.error('❌ Invalid updates format:', typeof rawInput.updates);
          toolResult = { success: false, message: 'Invalid updates format - expected array or JSON string' };
          continue;
        }
        
        processing_summary = rawInput.processing_summary;
        
        // Validate updates structure
        if (!Array.isArray(updates)) {
          console.error('❌ Updates is not an array after parsing:', typeof updates);
          toolResult = { success: false, message: 'Updates must be an array' };
          continue;
        }
        
        console.log('✅ Successfully parsed updates:', updates.length, 'items');
        
      } catch (parseError) {
        console.error('❌ Failed to parse tool input:', parseError);
        toolResult = { success: false, message: `Failed to parse tool input: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` };
        continue;
      }

      const fieldResolver = new StructuredFieldPathResolver();
      const processedUpdates: string[] = [];
      const errors: string[] = [];

      console.log('🔄 Processing structured data updates:', updates.length, 'updates');
      
      for (const update of updates) {
        try {
          // Validate update structure
          if (!update || typeof update !== 'object') {
            console.error('❌ Invalid update object:', update);
            errors.push('Invalid update object structure');
            continue;
          }
          
          if (!update.section_id || !update.field_path || !update.merge_strategy) {
            console.error('❌ Missing required fields in update:', {
              section_id: update.section_id,
              field_path: update.field_path,
              merge_strategy: update.merge_strategy,
              value: typeof update.value
            });
            errors.push(`Missing required fields: section_id=${update.section_id}, field_path=${update.field_path}, merge_strategy=${update.merge_strategy}`);
            continue;
          }
          
          console.log(`📝 Processing update: ${update.section_id}.${update.field_path} = ${JSON.stringify(update.value)} (${update.merge_strategy})`);
          
          const sectionIndex = (report.sections as Section[]).findIndex((sec: Section) => sec.id === update.section_id);
          
          if (sectionIndex === -1) {
            console.error(`❌ Section ${update.section_id} not found`);
            errors.push(`Section ${update.section_id} not found`);
            continue;
          }

          const section = report.sections[sectionIndex];
          console.log(`📋 Found section: ${section.title} (${section.sectionType})`);
          
          // Initialize structured_data if it doesn't exist
          if (!section.structured_data) {
            section.structured_data = {};
            console.log('🆕 Initialized empty structured_data');
          }

          // Get the schema for validation (optional for now)
          const schema = getSectionSchemaForType(section.sectionType || '');
          console.log(`📊 Schema available: ${schema ? 'Yes' : 'No'}`);
          
          // Apply the field update based on merge strategy
          let updatedData;
          const currentValue = fieldResolver.getFieldValue(section.structured_data, update.field_path);
          console.log(`🔍 Current value at ${update.field_path}:`, JSON.stringify(currentValue));
          
          switch (update.merge_strategy) {
            case 'replace':
              updatedData = fieldResolver.setFieldValue(section.structured_data, update.field_path, update.value);
              console.log(`🔄 REPLACE: Set ${update.field_path} to ${JSON.stringify(update.value)}`);
              break;
            case 'append':
              if (Array.isArray(currentValue)) {
                const newArray = Array.isArray(update.value) ? [...currentValue, ...update.value] : [...currentValue, update.value];
                updatedData = fieldResolver.setFieldValue(section.structured_data, update.field_path, newArray);
                console.log(`➕ APPEND (array): Added to ${update.field_path}, new length: ${newArray.length}`);
              } else if (typeof currentValue === 'string') {
                const separator = currentValue && !currentValue.endsWith('.') ? '. ' : '';
                const newValue = currentValue + separator + update.value;
                updatedData = fieldResolver.setFieldValue(section.structured_data, update.field_path, newValue);
                console.log(`➕ APPEND (string): Concatenated to ${update.field_path}`);
              } else {
                // Fall back to replace for non-appendable types
                updatedData = fieldResolver.setFieldValue(section.structured_data, update.field_path, update.value);
                console.log(`🔄 APPEND→REPLACE: Non-appendable type, replaced ${update.field_path}`);
              }
              break;
            case 'merge':
              if (typeof currentValue === 'object' && typeof update.value === 'object' && !Array.isArray(currentValue) && !Array.isArray(update.value)) {
                const mergedValue = { ...currentValue, ...update.value };
                updatedData = fieldResolver.setFieldValue(section.structured_data, update.field_path, mergedValue);
                console.log(`🔀 MERGE: Merged objects at ${update.field_path}`);
              } else {
                // Fall back to replace for non-mergeable types
                updatedData = fieldResolver.setFieldValue(section.structured_data, update.field_path, update.value);
                console.log(`🔄 MERGE→REPLACE: Non-mergeable type, replaced ${update.field_path}`);
              }
              break;
            default:
              throw new Error(`Unknown merge strategy: ${update.merge_strategy}`);
          }

          // Log the change
          const newValue = fieldResolver.getFieldValue(updatedData, update.field_path);
          console.log(`✅ Updated ${update.field_path}: ${JSON.stringify(currentValue)} → ${JSON.stringify(newValue)}`);

          // Update the section
          report.sections[sectionIndex].structured_data = updatedData;
          report.sections[sectionIndex].isGenerated = true;
          report.sections[sectionIndex].lastUpdated = new Date().toISOString();
          
          console.log(`💾 Section ${update.section_id} updated with new structured_data:`, JSON.stringify(updatedData, null, 2));
          
          processedUpdates.push(`${update.section_id}.${update.field_path}`);
          
          // Track which sections were updated
          if (!updatedSections.includes(update.section_id)) {
            updatedSections.push(update.section_id);
          }
        } catch (error) {
          console.error(`❌ Failed to update ${update.section_id}.${update.field_path}:`, error);
          errors.push(`Failed to update ${update.section_id}.${update.field_path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      console.log(`🎯 Structured data processing complete:`, {
        processedUpdates,
        updatedSections,
        errors,
        processing_summary
      });

      if (errors.length > 0) {
        toolResult = { 
          success: processedUpdates.length > 0, 
          message: `Processed ${processedUpdates.length} updates with ${errors.length} errors: ${errors.join(', ')}`,
          data: { processedUpdates, errors, processing_summary }
        };
      } else {
        toolResult = { 
          success: true, 
          message: `Successfully processed ${processedUpdates.length} field updates`,
          data: { processedUpdates, processing_summary }
        };
      }
    } else {
      toolResult = { success: false, message: `Unknown tool: ${toolUse.name}` };
    }
    } catch (error: any) {
      console.error(`❌ Anthropic API error on iteration ${iteration}:`, error);
      
      // Check if it's an overloaded error that exhausted retries
      const isOverloaded = error?.status === 529 || 
                          error?.error?.type === 'overloaded_error' ||
                          error?.message?.includes('Overloaded');
      
      if (isOverloaded) {
        console.log('🔄 Anthropic API is currently overloaded. The system will continue processing with available data.');
        // Don't break the loop immediately for overloaded errors - we might have partial results
      } else {
        console.log('💥 Non-recoverable API error, stopping processing.');
        break; // Exit the loop on non-recoverable API errors
      }
      
      break; // Exit the loop on any API error for now
    }

    // Only continue if we have valid response and tool use
    if (!response || !toolUse || !toolResult) {
      console.log('❌ Missing response, toolUse, or toolResult, breaking loop');
      break;
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

  // Update the report in the database if any sections were modified
  if (updatedSections.length > 0) {
    console.log(`💾 Updating database for report ${reportId} with ${updatedSections.length} modified sections:`, updatedSections);
    
    const { error: updateError } = await supabase
      .from('reports')
      .update({ sections: report.sections })
      .eq('id', reportId);

    if (updateError) {
      console.error('❌ Database update failed:', updateError);
      throw new Error(`Failed to update report in database: ${updateError.message}`);
    }
    
    console.log('✅ Database update successful');
  } else {
    console.log('ℹ️ No sections were modified, skipping database update');
  }

  // Determine if processing was limited by API issues
  const hadApiIssues = !analysisResult && processedFiles.length > 0;
  const baseMessage = `Successfully processed ${processedFiles.length} files and updated ${updatedSections.length} sections`;
  const apiIssueMessage = hadApiIssues ? ' (Note: AI analysis was limited due to temporary API overload - please try again in a few minutes for full processing)' : '';
  
  const response = {
    success: true,
    updatedSections,
    analysisResult,
    processedFiles: processedFiles.map(f => ({
      name: f.name,
      type: f.type,
      size: f.size,
      processingMethod: f.processingMethod
    })),
    message: baseMessage + apiIssueMessage,
    apiIssues: hadApiIssues
  };
  
  console.log('🚀 Sending response to client:', JSON.stringify(response, null, 2));
  
  return NextResponse.json(response);
}

export async function POST(request: Request) {
  const supabase = await createRouteSupabase();

  if (!process.env.ANTHROPIC_API_KEY) {
    return new NextResponse(JSON.stringify({ error: 'Server configuration error: Anthropic API key missing.' }), { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Handle both JSON and FormData requests
  let reportId: string;
  let sectionId: string | undefined;
  let unstructuredInput: string | undefined;
  let generation_type: string;
  const files: File[] = [];

  const contentType = request.headers.get('content-type');
  
  if (contentType?.includes('multipart/form-data')) {
    // Handle FormData (with files)
    const formData = await request.formData();
    reportId = formData.get('reportId') as string;
    sectionId = formData.get('sectionId') as string | undefined;
    unstructuredInput = formData.get('unstructuredInput') as string | undefined;
    generation_type = formData.get('generation_type') as string;
    
    // Extract files from FormData
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        files.push(value);
      }
    }
  } else {
    // Handle JSON request (existing functionality)
    const body = await request.json();
    reportId = body.reportId;
    sectionId = body.sectionId;
    unstructuredInput = body.unstructuredInput;
    generation_type = body.generation_type;
  }

  if (!reportId || !generation_type) {
    return new NextResponse(JSON.stringify({ error: 'Missing required fields: reportId and generation_type' }), { status: 400 })
  }

  // Fetch the full report from Supabase
  const { data: report, error: fetchError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !report) {
    return new NextResponse(JSON.stringify({ error: 'Report not found or unauthorized' }), { status: 404 })
  }

  const tools = [
    {
      name: "update_report_section",
      description: "Updates the rich text content of a specific section within a speech-language evaluation report. This tool should be used when you have identified relevant information from assessment documents, notes, or other inputs that belongs in a particular report section. The content should be professionally written, clinically appropriate, and properly formatted with HTML structure. Use this tool after analyzing the input content and determining which specific section needs to be updated with extracted or synthesized information.",
      input_schema: {
        type: "object" as const,
        properties: {
          section_id: { 
            type: "string", 
            description: "The unique identifier of the report section to update. Must match one of the available section IDs provided in the system message." 
          },
          content: { 
            type: "string", 
            description: "The new, AI-generated rich text content for the specified report section. Should be properly formatted HTML with appropriate structure (paragraphs, headings, lists, etc.). Content should be professional, clinical in tone, and ready for inclusion in a formal evaluation report." 
          },
          confidence: { 
            type: "number", 
            description: "Confidence level (0-1) indicating how certain you are about the accuracy and relevance of the extracted/generated content. Use 0.9+ for direct quotes or clear data, 0.7-0.9 for interpreted information, 0.5-0.7 for inferred content." 
          },
          source_data: {
            type: "array",
            description: "Array of specific source references that informed this content, such as test names, document sections, or page numbers. Helps with traceability and audit trails.",
            items: { type: "string" }
          }
        },
        required: ["section_id", "content"]
      },
    },
    {
      name: "update_report_data",
      description: "Updates specific structured data fields within report sections using precise field paths and merge strategies. This tool enables granular updates to structured data rather than replacing entire HTML content. Use this for sections that have structured schemas and when you want to update specific fields like test scores, demographic information, or assessment results.",
      input_schema: {
        type: "object" as const,
        properties: {
          updates: {
            type: "array",
            description: "Array of field updates to apply to the report sections",
            items: {
              type: "object",
              properties: {
                section_id: { 
                  type: "string", 
                  description: "ID of the section to update" 
                },
                field_path: { 
                  type: "string", 
                  description: "Dot notation path to the field (e.g., 'assessment_results.wisc_scores.verbal_iq' or 'simple_array.0')" 
                },
                value: { 
                  description: "New value for the field - can be string, number, boolean, array, or object"
                },
                merge_strategy: { 
                  type: "string",
                  enum: ["replace", "append", "merge"], 
                  description: "How to handle existing data: replace (overwrite), append (add to arrays/strings), merge (combine objects)" 
                },
                confidence: { 
                  type: "number", 
                  description: "Confidence level 0-1 for this update" 
                },
                source_reference: { 
                  type: "string", 
                  description: "Reference to source data that informed this update" 
                }
              },
              required: ["section_id", "field_path", "value", "merge_strategy"]
            }
          },
          processing_summary: {
            type: "string",
            description: "Summary of what was processed and the rationale for these updates"
          }
        },
        required: ["updates"]
      }
    },
    {
      name: "analyze_assessment_content",
      description: "Analyzes multi-modal assessment content (PDFs, images, audio transcripts, text notes) to identify which report sections should be updated and what type of information is available. This tool should be called first when processing assessment materials to create a strategic plan for populating the report. It examines all provided content holistically and determines the most relevant sections to update based on the available data. Use this tool to avoid missing important information and to ensure comprehensive coverage of the assessment materials.",
      input_schema: {
        type: "object" as const,
        properties: {
          content_analysis: {
            type: "object",
            properties: {
              identified_updates: {
                type: "array",
                description: "List of specific field updates that should be made based on the available content",
                items: {
                  type: "object", 
                  properties: {
                    section_id: { 
                      type: "string", 
                      description: "The ID of the section that should be updated" 
                    },
                    field_path: { 
                      type: "string", 
                      description: "Dot notation path to the specific field that should be updated" 
                    },
                    extracted_value: { 
                      description: "The specific value extracted from the content for this field" 
                    },
                    confidence: { 
                      type: "number", 
                      description: "Confidence level 0-1 for this extracted data" 
                    },
                    data_type: { 
                      type: "string", 
                      enum: ["test_score", "background_info", "observation", "recommendation", "demographic", "assessment_tool"],
                      description: "Type of data extracted"
                    },
                    merge_strategy: { 
                      type: "string",
                      enum: ["replace", "append", "merge"],
                      description: "Recommended merge strategy for this update"
                    },
                    rationale: { 
                      type: "string", 
                      description: "Why this field should be updated with this value" 
                    }
                  },
                  required: ["section_id", "field_path", "extracted_value", "confidence", "data_type", "merge_strategy"]
                }
              },
              processing_notes: { 
                type: "string", 
                description: "Overall notes about the content analysis, including any challenges, missing information, or processing decisions made." 
              },
              schema_coverage: {
                type: "object",
                description: "Analysis of how well the input data covers the available schema fields",
                properties: {
                  covered_sections: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Section IDs that have data available"
                  },
                  missing_data: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Important fields or sections where no data was found"
                  },
                  data_quality: { 
                    type: "string", 
                    enum: ["excellent", "good", "fair", "poor"],
                    description: "Overall assessment of data quality and completeness"
                  }
                }
              }
            },
            required: ["identified_updates", "processing_notes"]
          }
        },
        required: ["content_analysis"]
      },
    }
  ];



  // For multi-modal assessment, we don't need a specific target section
  let targetSection: Section | undefined;
  if (sectionId) {
    targetSection = (report.sections as Section[]).find((s: Section) => s.id === sectionId);
    if (!targetSection) {
      return new NextResponse(JSON.stringify({ error: 'Target section not found.' }), { status: 400 });
    }
  }

  let systemMessageContent = "";
  let targetTool = "";

  if (generation_type === 'structured_data_processing') {
    // New structured data processing approach
    const reportStructure = JSON.stringify(
      (report.sections as Section[]).map(section => ({
        id: section.id,
        title: section.title,
        sectionType: section.sectionType,
        structured_data: section.structured_data || {},
        schema: getSectionSchemaForType(section.sectionType || '')
      })), 
      null, 
      2
    );

    systemMessageContent = `You are an expert Speech-Language Pathologist conducting comprehensive assessment analysis with clinical expertise.

CLINICAL ANALYSIS FRAMEWORK:
As an SLP, you follow this natural assessment reasoning process:

1. QUANTITATIVE DATA EXTRACTION (Priority 1):
   - Standard scores, percentiles, age equivalents from formal tests
   - Raw scores and scaled scores where available
   - Confidence intervals and standard error measurements
   - Subtest breakdowns for comprehensive assessments

2. QUALITATIVE BEHAVIORAL OBSERVATIONS (Priority 2):
   - Student cooperation and attention during testing
   - Response strategies (self-correction, requesting repetition)
   - Error patterns and consistency across tasks
   - Fatigue effects and optimal performance conditions

3. DOMAIN-SPECIFIC CLINICAL PATTERNS (Priority 3):
   - Receptive vs. Expressive language discrepancies
   - Phonological vs. Articulation error patterns
   - Pragmatic strengths in structured vs. unstructured contexts
   - Voice quality, fluency, and prosodic features

4. FUNCTIONAL IMPACT ASSESSMENT (Priority 4):
   - Academic performance implications
   - Social communication effectiveness
   - Home vs. school performance differences
   - Compensatory strategies already in use

CURRENT REPORT STRUCTURE:
${reportStructure}

CLINICAL EXTRACTION STRATEGY:
- STANDARDIZED TESTS → Extract all scores + clinical interpretation + error analysis
- INFORMAL ASSESSMENTS → Focus on functional patterns + contextual performance
- OBSERVATIONS → Document behaviors + environmental factors + social interactions
- INTERVIEWS → Capture concerns + developmental history + current impact
- WORK SAMPLES → Analyze error patterns + strategy use + progress indicators

STRUCTURED DATA PROCESSING:
1. Start with 'analyze_assessment_content' to identify clinical priorities
2. Use 'update_report_data' for comprehensive field updates following clinical reasoning
3. Populate assessment_items with complete test data (scores, dates, interpretations)
4. Generate domain-specific clinical summaries (not just data dumps)
5. Create assessment_tools_list from populated assessment_items

FIELD NOTATION & MERGE STRATEGIES:
- Dot notation: "assessment_results.assessment_items.0.standard_score"
- Replace: Complete overwrite (for scores, dates, definitive data)
- Append: Add to arrays or extend text (for observations, recommendations)
- Merge: Combine objects preserving existing data (for complex structures)

CLINICAL VALIDATION:
- Ensure score ranges are realistic (SS: 40-160, %ile: 1-99)
- Verify age-appropriate test selections
- Check for logical consistency across domains
- Maintain professional terminology and objectivity

Begin with clinical analysis, then proceed with structured data updates.`;
    targetTool = 'analyze_assessment_content';
  } else if (generation_type === 'multi_modal_assessment') {
    // Legacy multi-modal assessment processing (HTML-based)
    const availableSections = (report.sections as Section[]).map(s => 
      `- ${s.id}: ${s.title} (${s.ai_directive || 'Standard section'})`
    ).join('\n');

    systemMessageContent = `You are an expert Speech-Language Pathologist analyzing comprehensive assessment materials with clinical expertise.

CLINICAL DOCUMENT ANALYSIS FRAMEWORK:
You're reviewing assessment materials as an experienced SLP would - looking for specific clinical indicators and following established evaluation protocols.

DOCUMENT TYPE RECOGNITION & PRIORITIES:
- FORMAL ASSESSMENT REPORTS → Extract scores, interpretations, recommendations (HIGH PRIORITY)
- TEST PROTOCOLS/FORMS → Raw data, observations, error patterns (HIGH PRIORITY)  
- IEP DOCUMENTS → Current services, goals, progress data (MEDIUM PRIORITY)
- PARENT/TEACHER INTERVIEWS → Functional concerns, developmental history (MEDIUM PRIORITY)
- WORK SAMPLES → Error analysis, strategy use, progress indicators (LOW PRIORITY)

AVAILABLE REPORT SECTIONS:
${availableSections}

CLINICAL CONTENT ANALYSIS STRATEGY:
1. IDENTIFY ASSESSMENT TOOLS: Look for test names, forms, protocols
2. EXTRACT QUANTITATIVE DATA: Scores, percentiles, age equivalents, dates
3. CAPTURE QUALITATIVE OBSERVATIONS: Behaviors, cooperation, error patterns
4. NOTE CLINICAL INTERPRETATIONS: Professional judgments, diagnostic impressions
5. IDENTIFY RECOMMENDATIONS: Service needs, goals, accommodations
6. GATHER BACKGROUND INFO: Developmental history, previous services, concerns

SECTION POPULATION LOGIC:
- reason_for_referral → Referral source, presenting concerns, initial observations
- parent_concern → Family reports, home observations, developmental concerns
- health_developmental_history → Medical history, milestones, previous services
- assessment_results → All test data, scores, clinical findings, interpretations
- validity_statement → Test conditions, cooperation, reliability factors
- conclusion → Summary of findings, diagnostic impressions, severity levels
- recommendations → Service recommendations, goals, accommodations, follow-up

PROCESSING APPROACH:
1. Analyze content using 'analyze_assessment_content' to map clinical findings to sections
2. Use 'update_report_section' to populate each relevant section with professional content
   - Text notes (clinical observations, informal assessments)

2. Then, for each identified section, use 'update_report_section' to generate appropriate content based on the analyzed information.

3. Prioritize sections based on the richness and relevance of available data.

4. Maintain professional clinical tone and proper formatting throughout.

CONTENT INTEGRATION RULES:
- Preserve existing content when possible, merging new information appropriately
- Use structured formatting (lists, headings, tables) for complex information like test scores
- Extract specific data points (test names, scores, percentiles, dates) accurately
- Include confidence indicators for extracted data
- Reference source materials when generating content
- Maintain clinical terminology and professional language
- Organize information logically within each section

QUALITY STANDARDS:
- Ensure all extracted test scores include test names, standard scores, percentiles, and interpretive ranges
- Separate different types of information (background vs. current performance)
- Use appropriate clinical language and avoid overgeneralization
- Maintain consistency in formatting and terminology across sections

You MUST start by calling 'analyze_assessment_content' to plan your approach, then proceed with section updates.`;
    targetTool = 'analyze_assessment_content';
  } else if (generation_type === 'prose') {
    if (!targetSection) {
      return new NextResponse(JSON.stringify({ error: 'Target section required for prose generation' }), { status: 400 });
    }
    
    const directive = targetSection.ai_directive || `Generate professional content for the ${targetSection.title || targetSection.sectionType} section of a speech-language evaluation report.`;
    
    systemMessageContent = `You are an expert Speech-Language Pathologist (SLP) report writer. Your task is to generate professional, well-written content for a report section based on provided notes and context. 

Section Type: ${targetSection.sectionType}
Section Title: ${targetSection.title}
Section ID: ${targetSection.id}
Directive: ${directive}

Generate rich text content that is:
- Professional and clinical in tone
- Appropriate for the specific section type
- Based on the provided unstructured input
- Formatted with proper HTML structure (paragraphs, headings, lists as needed)
- Complete and ready for inclusion in a formal evaluation report

You MUST call the 'update_report_section' tool with the section_id "${targetSection.id}" and the generated content.`;
    targetTool = 'update_report_section';
  } else if (generation_type === 'points') {
    if (!targetSection) {
      return new NextResponse(JSON.stringify({ error: 'Target section required for points generation' }), { status: 400 });
    }
    
    // Legacy support - convert to prose generation
    const directive = targetSection.ai_directive || `Generate professional content for the ${targetSection.title || targetSection.sectionType} section of a speech-language evaluation report.`;
    
    systemMessageContent = `You are an expert Speech-Language Pathologist (SLP) report writer. Your task is to generate professional content for a report section. 

Section Type: ${targetSection.sectionType}
Section Title: ${targetSection.title}
Section ID: ${targetSection.id}
Directive: ${directive}

Generate rich text content based on the provided context. You MUST call the 'update_report_section' tool with the section_id "${targetSection.id}".`;
    targetTool = 'update_report_section';
  } else {
    return new NextResponse(JSON.stringify({ error: 'Invalid generation_type' }), { status: 400 });
  }

  try {
    // Process files if any
    let processedFiles: ProcessedFile[] = [];
    if (files.length > 0) {
      try {
        processedFiles = await processMultipleFiles(files);
      } catch (fileError) {
        return new NextResponse(JSON.stringify({ 
          error: 'File processing failed', 
          details: fileError instanceof Error ? fileError.message : 'Unknown file processing error' 
        }), { status: 400 });
      }
    }

    // Build message content
    const messagesContent: Anthropic.MessageParam["content"] = [];
    
    // Add text input if provided
    if (unstructuredInput) {
      messagesContent.push({ type: "text", text: unstructuredInput });
    }
    
    // Add processed file content
    if (processedFiles.length > 0) {
      const fileContent = filesToClaudeContent(processedFiles);
      console.log(`📁 Processing ${processedFiles.length} files:`, processedFiles.map(f => ({ name: f.name, type: f.type, method: f.processingMethod, contentLength: f.content.length })));
      console.log(`📋 Generated ${fileContent.length} content blocks:`, fileContent.map(c => ({ type: c.type, hasSource: !!c.source, title: c.title })));
      messagesContent.push(...fileContent);
    }

    if (messagesContent.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'No input provided (text or files)' }), { status: 400 });
    }

    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: messagesContent,
      },
    ];

    console.log("📤 Sending messages to Anthropic:");
    console.log("📄 File content blocks:", messagesContent.filter(c => c.type === 'document').map(c => ({ type: c.type, title: c.title || 'untitled', size: c.source?.data?.length || 0 })));
    console.log("💬 System message length:", systemMessageContent.length);
    console.log("🔧 Tools count:", tools.length);

    if (generation_type === 'structured_data_processing' || generation_type === 'multi_modal_assessment') {
      // Multi-tool conversation loop for assessment processing
      return await handleMultiModalAssessment(messages, systemMessageContent, tools, report, supabase, reportId, processedFiles);
    } else {
      // Single tool call for traditional generation
      console.log('Creating Anthropic message with the following parameters:', { model: "claude-3-5-sonnet-20241022", max_tokens: 8192, system: systemMessageContent, tools, messages, tool_choice: { type: "tool", name: targetTool } });
      const response = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219", // Claude 3.7 Sonnet with PDF support
        max_tokens: 8192, // Increased for longer content
        system: systemMessageContent,
        tools: tools,
        messages: messages,
        tool_choice: { type: "tool", name: targetTool }
      });
      console.log('Received response from Anthropic:', JSON.stringify(response, null, 2));

      const toolCall = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use' && typeof block.input === 'object'
      );

      if (toolCall && toolCall.input) {
        const { section_id, content } = toolCall.input as { section_id: string; content: string };
        const sectionIndex = (report.sections as Section[]).findIndex((sec: Section) => sec.id === section_id);

        if (sectionIndex !== -1) {
          // Update the section content with AI-generated rich text
          report.sections[sectionIndex].content = content;
          report.sections[sectionIndex].isGenerated = true;
          report.sections[sectionIndex].lastUpdated = new Date().toISOString();

          const { error: updateError } = await supabase
            .from('reports')
            .update({ sections: report.sections })
            .eq('id', reportId);

          if (updateError) {
            throw new Error(`Failed to update report in database: ${updateError.message}`);
          }
          return NextResponse.json({ updatedSection: report.sections[sectionIndex] });
        } else {
          return new NextResponse(JSON.stringify({ error: `Section with id ${section_id} not found.` }), { status: 404 });
        }
      } else {
        console.error("AI response did not include a valid tool call:", response);
        return new NextResponse(JSON.stringify({ error: 'AI did not generate content as expected.', details: response.content }), { status: 500 });
      }
    }

  } catch (aiError) {
    console.error("Anthropic API call failed:", aiError);
    if (aiError instanceof Error) {
      return new NextResponse(JSON.stringify({ error: 'Failed to generate content with AI.', details: aiError.message }), { status: 500 });
    }
    return new NextResponse(JSON.stringify({ error: 'Failed to generate content with AI.' }), { status: 500 });
  }
}