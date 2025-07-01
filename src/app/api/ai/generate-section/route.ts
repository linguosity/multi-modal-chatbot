import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ReportSchema } from '@/lib/schemas/report'
import Anthropic from '@anthropic-ai/sdk'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const supabase = createClient()

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set.");
    return new NextResponse(JSON.stringify({ error: 'Server configuration error: Anthropic API key missing.' }), { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { reportId, sectionId, unstructuredInput, files } = await request.json()

  if (!reportId || !sectionId || (!unstructuredInput && (!files || files.length === 0))) {
    return new NextResponse(JSON.stringify({ error: 'Missing required fields: reportId, sectionId, and either unstructuredInput or files' }), { status: 400 })
  }

  // Fetch the full report from Supabase
  const { data: report, error: fetchError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !report) {
    console.error('Error fetching report:', fetchError)
    return new NextResponse(JSON.stringify({ error: 'Report not found or unauthorized' }), { status: 404 })
  }

  // Define the tool Claude can use
  const tools = [
    {
      name: "update_report_section",
      description: "Updates the content of a specific section within the report. Can be called multiple times for different sections.",
      input_schema: {
        type: "object",
        properties: {
          section_id: {
            type: "string",
            description: "The ID of the report section to update (e.g., 'reason_for_referral')."
          },
          content: {
            type: "string",
            description: "The new, AI-generated content for the specified report section."
          }
        },
        required: ["section_id", "content"]
      }
    }
  ];

  // Construct the Claude prompt
  const systemMessage = `You are an expert Speech-Language Pathologist (SLP) report writer. Your task is to generate and refine sections of a comprehensive SLP report based on provided unstructured notes and the existing report context.

Based on the unstructured notes and the current report state, you are expected to generate content for *all* relevant sections. You MUST call the 'update_report_section' tool for *each and every* section that you determine needs an update.

Use the 'update_report_section' tool to provide the generated content for each relevant section. You MUST call this tool for every section that needs to be updated.

Here is the current state of the entire report in JSON format:
<current_report_state>
${JSON.stringify(report, null, 2)}
</current_report_state>

Here are the unstructured notes provided by the SLP:
<unstructured_notes>
${unstructuredInput}
</unstructured_notes>

Ensure the content is professional, concise, and directly addresses the purpose of each section. If the unstructured notes are brief, expand upon them appropriately while maintaining accuracy.

<examples>
<example>
<unstructured_notes>
Parent concerned about child's speech. Mumbling, hard to understand. Teacher also noted difficulty.
</unstructured_notes>
<tool_code>
<tool_use>
<update_report_section section_id="reason_for_referral" content="[Student Name] was referred for a speech and language evaluation by [Referral Source] due to concerns regarding speech intelligibility. Parents report that [Student] often mumbles and is difficult to understand, particularly by unfamiliar listeners. The classroom teacher has also noted difficulties with [Student]'s verbal communication in academic settings." />
<update_report_section section_id="parent_concern" content="According to [Parent/Guardian], their primary concerns include [Student]'s speech intelligibility, noting that [Student] is often difficult to understand, especially by unfamiliar listeners. They report that these difficulties impact [Student]'s communication at home and in community settings." />
</tool_use>
</tool_code>
</example>
<example>
<unstructured_notes>
Referral from pediatrician for language delay. Not talking much for age (3 years). Limited vocabulary. Also, child had frequent ear infections as a baby.
</unstructured_notes>
<tool_code>
<tool_use>
<update_report_section section_id="reason_for_referral" content="[Student Name] was referred for a speech and language evaluation by their pediatrician due to concerns regarding a suspected language delay. Parents report that [Student], who is 3 years old, uses a limited vocabulary and is not combining words into phrases or sentences typical for their age. This evaluation was conducted to determine if [Student] demonstrates a speech or language disorder that adversely affects developmental progress and requires intervention." />
<update_report_section section_id="health_developmental_history" content="According to information provided by [Source], [Student]'s health and developmental history includes a history of frequent ear infections during infancy, which may have impacted early speech and language development. [Include relevant hearing and vision screening results if available]." />
</tool_use>
</tool_code>
</example>
<example>
<unstructured_notes>
Scores on CASL: Pragmatic Language SS 89. PLS-5: Total Language 7th percentile.
</unstructured_notes>
<tool_code>
<tool_use>
<update_report_section section_id="assessment_tools" content="The following assessment tools were used in this evaluation:\n\n1. Comprehensive Assessment of Spoken Language (CASL)\n2. Preschool Language Scales, Fifth Edition (PLS-5)" />
<update_report_section section_id="assessment_results" content="### Standardized Test Results\n\n1. Comprehensive Assessment of Spoken Language (CASL):\n   - Pragmatic Language subtest: Standard Score (SS) of 89\n   - Interpretation: This score falls within the low average range, indicating some difficulties with pragmatic language skills.\n\n2. Preschool Language Scales, Fifth Edition (PLS-5):\n   - Total Language Score: 7th percentile\n   - Interpretation: This score falls significantly below average, indicating a notable delay in overall language skills.\n\n### Language\n\nBased on the standardized test results, [Student] demonstrates challenges in both pragmatic language and overall language abilities:\n\n1. Pragmatic Language: The CASL pragmatic language subtest score (SS 89) suggests that [Student] has some difficulties with social language use. This may include challenges with understanding and using language appropriately in social situations, interpreting non-literal language, or adapting communication style to different contexts.\n\n2. Overall Language Skills: The PLS-5 total language score (7th percentile) indicates significant difficulties in overall language development. This suggests that [Student] is struggling with both receptive (understanding) and expressive (production) language skills compared to same-age peers. Areas of difficulty may include vocabulary, sentence structure, following directions, and expressing ideas clearly.\n\nThese results suggest that [Student] may benefit from targeted intervention to address both pragmatic and overall language skills to support their academic and social communication needs.\n\n[Note: Further assessment details in other language domains (e.g., articulation, fluency, voice) should be added if available]." />
</tool_use>
</tool_code>
</example>
</examples>

Remember to call the 'update_report_section' tool with the generated content for ALL relevant sections.`

  try {
    console.log("Calling Anthropic API...");
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514", // Upgraded to Claude Sonnet 4
      max_tokens: 2000,
      system: systemMessage,
      tools: tools,
      messages: [
        {
          role: "user",
          content: [
            ...(unstructuredInput ? [{ type: "text", text: unstructuredInput }] : []),
            ...(files ? files.map((file: any) => {
              const [mimeTypeFull, base64Data] = file.data.split(';base64,');
              const mediaType = mimeTypeFull.replace("data:", "");
              if (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mediaType)) {
                return { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } };
              } else {
                // For now, skip non-image files. Future: handle PDFs by extracting text.
                return null;
              }
            }).filter(Boolean) : []),
            { type: "text", text: `Generate content for section ID "${sectionId}" and any other relevant sections using the provided unstructured notes and report context.` },
          ],
        },
      ],
    });
    console.log("Anthropic API call completed.");

    const toolCalls = response.content.filter(block => block.type === 'tool_use' && block.name === 'update_report_section');

    if (toolCalls.length > 0) {
      let updatedSections = [...report.sections];
      const updatedSectionIds: string[] = [];

      for (const toolCall of toolCalls) {
        if (toolCall.type === 'tool_use' && toolCall.name === 'update_report_section') {
          const { section_id, content } = toolCall.input;
          const existingSection = updatedSections.find(sec => sec.id === section_id);
          if (existingSection) {
            // Only update content and mark as generated, don't set lastUpdated here
            existingSection.content = content;
            existingSection.isGenerated = true;
            updatedSectionIds.push(section_id);
          }
        }
      }

      // Filter to only return the sections that were actually updated by the AI
      const aiGeneratedSections = updatedSections.filter(sec => updatedSectionIds.includes(sec.id));

      return NextResponse.json({ updatedSections: aiGeneratedSections });
    } else {
      console.error('Claude did not call the expected tool(s):', response.content);
      return new NextResponse(JSON.stringify({ error: 'AI did not generate content as expected.' }), { status: 500 });
    }
  } catch (aiError) {
    console.error('Error calling Anthropic API:', aiError);
    return new NextResponse(JSON.stringify({ error: 'Failed to generate content with AI.' }), { status: 500 });
  }
}