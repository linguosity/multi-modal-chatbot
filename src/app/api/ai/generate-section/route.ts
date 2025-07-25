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
    
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022", // Latest Claude 3.5 Sonnet
      max_tokens: 8192, // Increased for longer content
      system: systemMessage,
      tools: tools,
      messages: conversationMessages
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    if (!toolUse) break; // No more tools to use

    // Process the tool call
    let toolResult: { success: boolean; message: string; data?: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (toolUse.name === 'analyze_assessment_content') {
      analysisResult = toolUse.input;
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
      const { updates, processing_summary } = toolUse.input as {
        updates: Array<{
          section_id: string;
          field_path: string;
          value: any;
          merge_strategy: 'replace' | 'append' | 'merge';
          confidence?: number;
          source_reference?: string;
        }>;
        processing_summary?: string;
      };

      const fieldResolver = new StructuredFieldPathResolver();
      const processedUpdates: string[] = [];
      const errors: string[] = [];

      console.log('🔄 Processing structured data updates:', updates.length, 'updates');
      
      for (const update of updates) {
        try {
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
    message: `Successfully processed ${processedFiles.length} files and updated ${updatedSections.length} sections`
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

    systemMessageContent = `You are an expert Speech-Language Pathologist (SLP) report writer with advanced structured data processing capabilities.

TASK: Analyze the provided assessment content and update specific fields in the structured JSON data model.

CURRENT REPORT STRUCTURE:
${reportStructure}

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
    targetTool = 'analyze_assessment_content';
  } else if (generation_type === 'multi_modal_assessment') {
    // Legacy multi-modal assessment processing (HTML-based)
    const availableSections = (report.sections as Section[]).map(s => 
      `- ${s.id}: ${s.title} (${s.ai_directive || 'Standard section'})`
    ).join('\n');

    systemMessageContent = `You are an expert Speech-Language Pathologist (SLP) report writer with advanced assessment analysis capabilities.

TASK: Analyze the provided multi-modal assessment content (text, PDF documents, images, and audio transcripts) and intelligently populate relevant report sections.

AVAILABLE SECTIONS:
${availableSections}

PROCESSING APPROACH:
1. First, analyze all provided content using the 'analyze_assessment_content' tool to identify relevant sections. The content may include:
   - PDF documents (assessment forms, IEPs, previous reports, test protocols)
   - Images (assessment forms, handwritten notes, test results)
   - Audio transcripts (parent interviews, student sessions)
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

    console.log("Sending messages to Anthropic:", JSON.stringify(messages, null, 2));
    console.log("System message:", systemMessageContent);
    console.log("Tools:", JSON.stringify(tools, null, 2));

    if (generation_type === 'structured_data_processing' || generation_type === 'multi_modal_assessment') {
      // Multi-tool conversation loop for assessment processing
      return await handleMultiModalAssessment(messages, systemMessageContent, tools, report, supabase, reportId, processedFiles);
    } else {
      // Single tool call for traditional generation
      console.log('Creating Anthropic message with the following parameters:', { model: "claude-3-5-sonnet-20241022", max_tokens: 8192, system: systemMessageContent, tools, messages, tool_choice: { type: "tool", name: targetTool } });
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022", // Latest Claude 3.5 Sonnet
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