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
      description: "Updates the final prose content of a specific section within the report.",
      input_schema: {
        type: "object" as const,
        properties: {
          section_id: { type: "string", description: "The ID of the report section to update." },
          content: { type: "string", description: "The new, AI-generated prose for the specified report section." }
        },
        required: ["section_id", "content"]
      },
    },
    {
      name: "update_report_section_points",
      description: "Updates the key-points tree for a section",
      input_schema: {
        type: "object" as const,
        properties: {
          section_id: { type: "string", description: "The ID of the report section to update." },
          points: {
            type: "array",
            items: {
              oneOf: [
                { type: "string" },
                {
                  type: "object",
                  properties: {
                    heading: { type: "string" },
                    prose_template: { type: "string" }, // New field for the mini-template paragraph
                    points: { type: "array", items: { type: "object" } } // This needs to be recursive, but OpenAPI doesn't support direct recursion like Zod.
                  },
                  required: ["heading", "points"]
                }
              ]
            },
            description: "An array of key points and optional nested heading objects."
          }
        },
        required: ["section_id", "points"]
      },
    }
  ];

  let systemMessageContent = "";
  let targetTool = "";

  if (generation_type === 'points') {
    const targetSection = report.sections.find((s) => s.id === sectionId);
    const directive = targetSection?.ai_directive || "Generate a list of key points based on the provided context.";
    systemMessageContent = `You are an expert Speech-Language Pathologist (SLP) report writer. Your task is to generate a structured list of key points for a report section based on provided notes and data. You MUST call the 'update_report_section_points' tool. ${directive}`;
    targetTool = 'update_report_section_points';
  } else if (generation_type === 'prose') {
    const targetSection = report.sections.find((s) => s.id === sectionId);
    if (!targetSection || !targetSection.points) {
      return new NextResponse(JSON.stringify({ error: 'Target section or points not found for prose generation.' }), { status: 400 });
    }
    systemMessageContent = `You are an expert Speech-Language Pathologist (SLP) report writer. Your task is to write a formal, well-written paragraph for a report section based on the provided list of key points. You MUST call the 'update_report_section' tool. The points are: ${JSON.stringify(targetSection.points, null, 2)}`;
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
      const { section_id, content, points } = toolCall.input;
      const sectionIndex = report.sections.findIndex((sec) => sec.id === section_id);

      if (sectionIndex !== -1) {
        if (generation_type === 'points') {
          report.sections[sectionIndex].points = points;
        } else {
          report.sections[sectionIndex].content = content;
        }
        report.sections[sectionIndex].isGenerated = true;

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