import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createRouteSupabase } from '@/lib/supabase/route-handler-client';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const reportId = formData.get('reportId') as string

    if (!file || !reportId) {
      return NextResponse.json({ error: 'File and reportId are required' }, { status: 400 })
    }

    const supabase = await createRouteSupabase();
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const sections = report.sections || [];

    // Fetch section types to get their AI directives
    const { data: sectionTypesData, error: sectionTypesError } = await supabase
      .from('report_section_types')
      .select('id, ai_directive');

    if (sectionTypesError) {
      console.error('Error fetching section types for AI directive:', sectionTypesError);
      // Continue without AI directives if there's an error
    }

    const sectionDirectivesMap = new Map();
    if (sectionTypesData) {
      sectionTypesData.forEach(st => {
        sectionDirectivesMap.set(st.id, st.ai_directive);
      });
    }

    const systemPrompt = `You are an expert Speech-Language Pathologist. Extract key information from the provided PDF and map it to the appropriate sections of the report. The available sections are:\n\n${sections.map((s: any) => {
      const directive = sectionDirectivesMap.get(s.id);
      return `- ${s.id}: ${s.title}${directive ? ` (AI Directive: ${directive})` : ''}`;
    }).join('\n')}`;

    // Validate file type and size
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    if (file.size > 32 * 1024 * 1024) { // 32MB limit
      return NextResponse.json({ error: 'File size exceeds 32MB limit' }, { status: 400 })
    }

    // Convert to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64Content = Buffer.from(arrayBuffer).toString('base64')

    console.log(`📄 Processing PDF: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`)

    // Use Claude's PDF support with document content block
    const reportSchemaTool = {
      name: "save_assessment_data",
      description: "Extracts and saves structured data from a speech-language assessment report.",
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
              },
              required: ["section_id", "field_path", "value", "merge_strategy"]
            }
          },
        },
        required: ["updates"]
      }
    };

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 4000,
      temperature: 0.1,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Content,
              },
              title: file.name,
            },
            {
              type: 'text',
              text: "Please extract the key information from the attached report using the save_assessment_data tool. You must provide a section_id for each update from the list in the system prompt.",
            },
          ],
        },
      ],
      tools: [reportSchemaTool],
      tool_choice: { type: 'tool', name: 'save_assessment_data' },
    });

    const toolCall = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    if (!toolCall) {
      throw new Error('No tool use found in response from Claude');
    }

    return NextResponse.json({
      success: true,
      analysis: toolCall.input,
      fileName: file.name,
      fileSize: file.size,
    });

  } catch (error) {
    console.error('PDF processing error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}