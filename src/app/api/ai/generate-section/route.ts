import { NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/route-handler-client';
import { ReportSchema } from '@/lib/schemas/report'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const supabase = await createRouteSupabase();

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set.");
    return new NextResponse(JSON.stringify({ error: 'Server configuration error: Anthropic API key missing.' }), { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { reportId, unstructuredInput, files, audio } = await request.json()

  if (!reportId || (!unstructuredInput && (!files || files.length === 0) && !audio)) {
    console.warn('Missing required fields for AI generation.', { reportId, hasUnstructuredInput: !!unstructuredInput, numFiles: files?.length || 0, hasAudio: !!audio });
    return new NextResponse(JSON.stringify({ error: 'Missing required fields: reportId, and either unstructuredInput or files or audio' }), { status: 400 })
  }

  // Fetch the full report from Supabase
  const { data: report, error: fetchError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !report) {
    console.error({ fetchError }, 'Error fetching report for AI generation.');
    return new NextResponse(JSON.stringify({ error: 'Report not found or unauthorized' }), { status: 404 })
  }

  // Define the tool Claude can use
  const tools = [
    {
      name: "update_report_section",
      description: "Updates the content of a specific section within the report. Can be called multiple times for different sections.",
      input_schema: {
        type: "object" as const,
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
      },
      cache_control: { type: "ephemeral" as const } // Cache tool definition
    }
  ];

  // Construct the Claude prompt
  const systemMessageContent = `You are an expert Speech-Language Pathologist (SLP) report writer. Your task is to generate and refine sections of a comprehensive SLP report based on provided unstructured notes, images, and the existing report context.

Based on the unstructured notes, images, and the current report state, you are expected to generate content for *all* relevant sections. You MUST call the 'update_report_section' tool for *each and every* section that you determine needs an update. If the provided information is not sufficient for a section, you MUST indicate that more information is needed within the 'content' of that section update. Do not leave any section blank if it can be updated.

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
    const messagesContent: any[] = [];

    if (unstructuredInput) {
      messagesContent.push({ type: "text", text: unstructuredInput });
    }

    if (files && files.length > 0) {
      for (const file of files) {
        const [mimeTypeFull, base64Data] = file.data.split(';base64,');
        const mediaType = mimeTypeFull.replace("data:", "");
        
        if (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mediaType)) {
          messagesContent.push({ type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } });
        } else if (mediaType === 'application/pdf') {
          messagesContent.push({ type: "document", source: { type: "base64", media_type: mediaType, data: base64Data } });
        } else {
          console.warn(`Skipping unsupported file type: ${mediaType} (${file.name}).`);
        }
      }
    }

    if (audio) {
      console.log("Audio data received. Processing for API request...");
      const [mimeTypeFull, base64Data] = audio.data.split(';base64,');
      const mediaType = mimeTypeFull.replace("data:", "");
      console.log(`Audio details: MediaType: ${mediaType}`);
      messagesContent.push({ type: "media", source: { type: "base64", media_type: mediaType, data: base64Data } });
      console.log("Successfully processed and added audio data to the request payload being sent to Anthropic.");
    }

    messagesContent.push({ type: "text", text: `Generate content for any relevant sections using the provided unstructured notes and report context.` });

    const sectionIdMap = new Map<string, string>();
    report.sections.forEach((section: any) => {
        sectionIdMap.set(section.sectionType, section.id);
    });

    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: messagesContent,
      },
    ];

    let updatedSections = [...report.sections]; // Keep track of updated sections in memory
    const updatedSectionIds = new Set<string>();

    console.log("Starting multi-tool use loop with Claude.");

    while (true) { // Loop until Claude is done
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemMessageContent,
        tools: tools,
        messages: messages,
      });

      console.log(`Anthropic response received with stop_reason: ${response.stop_reason}`);
      
      messages.push({
        role: response.role,
        content: response.content,
      });

      if (response.stop_reason !== 'tool_use') {
        console.log(`Stop reason is '${response.stop_reason}'. Exiting loop.`);
        break;
      }

      const toolCalls = response.content.filter((block: any) => block.type === 'tool_use');

      if (toolCalls.length === 0) {
        console.log("Stop reason was 'tool_use' but no tool calls were found. Exiting loop.");
        break;
      }

      const toolResults = toolCalls.map((toolCall: any) => {
        const { section_id: idFromClaude, content } = toolCall.input;
        
        // The AI might return a slug or a UUID. We need to handle both.
        let sectionId = sectionIdMap.get(idFromClaude);
        if (!sectionId) {
            // If it's not in the slug map, check if it's a valid UUID itself
            const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idFromClaude);
            if (isUuid && report.sections.some((s: any) => s.id === idFromClaude)) {
                sectionId = idFromClaude;
            }
        }

        if (sectionId) {
          const existingSection = updatedSections.find(sec => sec.id === sectionId);
          if (existingSection) {
            existingSection.content = content;
            existingSection.isGenerated = true;
            updatedSectionIds.add(sectionId);
            console.log(`Updated section in memory: ${existingSection.sectionType} (${sectionId})`);
            return {
              type: "tool_result" as const,
              tool_use_id: toolCall.id,
              content: `Successfully updated section ${existingSection.sectionType}.`,
            };
          }
        }
        
        console.warn(`Tool call for non-existent section_id: ${idFromClaude}`);
        return {
          type: "tool_result" as const,
          tool_use_id: toolCall.id,
          content: `Error: Section with id ${idFromClaude} not found.`, 
          is_error: true,
        };
      });

      messages.push({
        role: "user",
        content: toolResults,
      });
    }

    // Filter to only return the sections that were actually updated by the AI
    // This now uses the finalReport from the DB to ensure consistency
    const aiGeneratedSections = updatedSections.filter((sec: any) => updatedSectionIds.has(sec.id));

    if (aiGeneratedSections.length > 0) {
      return NextResponse.json({ updatedSections: aiGeneratedSections });
    } else {
      console.error({ messages }, 'Claude did not call the expected tool(s) after looping.');
      return new NextResponse(JSON.stringify({ error: 'AI did not generate content as expected.' }), { status: 500 });
    }

  } catch (aiError: any) {
    console.error('Error in AI generation process:', aiError.message);
    return new NextResponse(JSON.stringify({ error: 'Failed to generate content with AI.', details: aiError.message }), { status: 500 });
  }
}