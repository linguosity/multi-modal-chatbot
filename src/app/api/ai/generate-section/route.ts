import { NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/route-handler-client';
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const supabase = await createRouteSupabase();

  if (!process.env.ANTHROPIC_API_KEY) {
    return new NextResponse(JSON.stringify({ error: 'Server configuration error: Anthropic API key missing.' }), { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { reportId, sectionId, unstructuredInput, generation_type } = await request.json()

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
          }
        },
        required: ["section_id", "content"]
      },
    }
  ];

  // Define a type for a section if not already defined
  type Section = {
    id: string;
    sectionType?: string;
    title?: string;
    ai_directive?: string;
    content?: string;
    isGenerated?: boolean;
    // add other fields as needed
  };

  const targetSection = (report.sections as Section[]).find((s: Section) => s.id === sectionId);
  if (!targetSection) {
    return new NextResponse(JSON.stringify({ error: 'Target section not found.' }), { status: 400 });
  }

  // Get AI directive from section type or use default
  const directive = targetSection.ai_directive || `Generate professional content for the ${targetSection.title || targetSection.sectionType} section of a speech-language evaluation report.`;
  
  let systemMessageContent = "";
  let targetTool = "";

  if (generation_type === 'prose') {
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
    // Legacy support - convert to prose generation
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
    const messagesContent: Anthropic.MessageParam["content"] = [];
    if (unstructuredInput) messagesContent.push({ type: "text", text: unstructuredInput });
    // ... (rest of the file/audio processing logic remains the same)

    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: messagesContent,
      },
    ];

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

  } catch (aiError) {
    if (aiError instanceof Error) {
      return new NextResponse(JSON.stringify({ error: 'Failed to generate content with AI.', details: aiError.message }), { status: 500 });
    }
    return new NextResponse(JSON.stringify({ error: 'Failed to generate content with AI.' }), { status: 500 });
  }
}