import { NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/route-handler-client';
import Anthropic from '@anthropic-ai/sdk'
import { processMultipleFiles, filesToClaudeContent, ProcessedFile } from '@/lib/file-processing';

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
    const { error: updateError } = await supabase
      .from('reports')
      .update({ sections: report.sections })
      .eq('id', reportId);

    if (updateError) {
      throw new Error(`Failed to update report in database: ${updateError.message}`);
    }
  }

  return NextResponse.json({
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
  });
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
      },
    },
    {
      name: "analyze_assessment_content",
      description: "Analyze multi-modal assessment content and determine which sections should be updated",
      input_schema: {
        type: "object" as const,
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

  if (generation_type === 'multi_modal_assessment') {
    // New multi-modal assessment processing
    const availableSections = (report.sections as Section[]).map(s => 
      `- ${s.id}: ${s.title} (${s.ai_directive || 'Standard section'})`
    ).join('\n');

    systemMessageContent = `You are an expert Speech-Language Pathologist (SLP) report writer with advanced assessment analysis capabilities.

TASK: Analyze the provided multi-modal assessment content (text, images, PDFs, audio transcripts) and intelligently populate relevant report sections.

AVAILABLE SECTIONS:
${availableSections}

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
    targetTool = 'analyze_assessment_content';
  } else if (generation_type === 'prose') {
    if (!targetSection) {
      return new NextResponse(JSON.stringify({ error: 'Target section required for prose generation' }), { status: 400 });
    }
    
    const directive = targetSection.ai_directive || `Generate professional content for the ${targetSection.title || targetSection.sectionType} section of a speech-language evaluation report.`;
    
    systemMessageContent = `You are an expert Speech-Language Pathologist (SLP) report writer. Your task is to generate professional, well-written content for a report section based on provided notes and context. 

Section Type: ${targetSection.sectionType}
Section Title: ${targetSection.title}
Directive: ${directive}

Generate rich text content that is:
- Professional and clinical in tone
- Appropriate for the specific section type
- Based on the provided unstructured input
- Formatted with proper HTML structure (paragraphs, headings, lists as needed)
- Complete and ready for inclusion in a formal evaluation report

You MUST call the 'update_report_section' tool with the generated content.`;
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
Directive: ${directive}

Generate rich text content based on the provided context. You MUST call the 'update_report_section' tool.`;
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

    if (generation_type === 'multi_modal_assessment') {
      // Multi-tool conversation loop for assessment processing
      return await handleMultiModalAssessment(messages, systemMessageContent, tools, report, supabase, reportId, processedFiles);
    } else {
      // Single tool call for traditional generation
      const response = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 4096,
        system: systemMessageContent,
        tools: tools,
        messages: messages,
        tool_choice: { type: "tool", name: targetTool }
      });

      const toolCall = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use' && typeof block.input === 'object'
      );

      if (toolCall) {
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
        return new NextResponse(JSON.stringify({ error: 'AI did not generate content as expected.' }), { status: 500 });
      }
    }

  } catch (aiError) {
    if (aiError instanceof Error) {
      return new NextResponse(JSON.stringify({ error: 'Failed to generate content with AI.', details: aiError.message }), { status: 500 });
    }
    return new NextResponse(JSON.stringify({ error: 'Failed to generate content with AI.' }), { status: 500 });
  }
}