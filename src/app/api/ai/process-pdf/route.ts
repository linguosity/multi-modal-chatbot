import { NextRequest, NextResponse } from 'next/server'
import { getGeminiClient, resolveModel } from '@/lib/ai/gemini-client'
import { FunctionCallingConfigMode } from '@google/genai'
import { createRouteSupabase } from '@/lib/supabase/route-handler-client'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const reportId = formData.get('reportId') as string

    if (!file || !reportId) {
      return NextResponse.json({ error: 'File and reportId are required' }, { status: 400 })
    }

    const supabase = await createRouteSupabase()
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const sections = report.sections || []

    // Fetch section types to get their AI directives
    const { data: sectionTypesData } = await supabase
      .from('report_section_types')
      .select('id, ai_directive')

    const sectionDirectivesMap = new Map()
    if (sectionTypesData) {
      sectionTypesData.forEach((st: any) => {
        sectionDirectivesMap.set(st.id, st.ai_directive)
      })
    }

    const systemPrompt = `You are an expert Speech-Language Pathologist. Extract key information from the provided PDF and map it to the appropriate sections of the report. The available sections are:\n\n${sections.map((s: any) => {
      const directive = sectionDirectivesMap.get(s.id)
      return `- ${s.id}: ${s.title}${directive ? ` (AI Directive: ${directive})` : ''}`
    }).join('\n')}`

    // Validate file type and size
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit for Gemini
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 })
    }

    // Convert PDF to base64 for inline Gemini processing
    console.log(`📄 Processing PDF via Gemini: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`)
    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')

    // Define tool for structured updates (Gemini function declaration format)
    const reportSchemaTool = {
      name: 'save_assessment_data',
      description: 'Extracts and saves structured data from a speech-language assessment report.',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          updates: {
            type: 'array',
            description: 'Array of field updates to apply to the report sections',
            items: {
              type: 'object',
              properties: {
                section_id: {
                  type: 'string',
                  description: 'ID of the section to update',
                },
                field_path: {
                  type: 'string',
                  description: "Dot notation path to the field (e.g., 'assessment_results.wisc_scores.verbal_iq')",
                },
                value: {
                  description: 'New value for the field - can be string, number, boolean, array, or object',
                },
                merge_strategy: {
                  type: 'string',
                  enum: ['replace', 'append', 'merge'],
                  description: 'How to handle existing data',
                },
              },
              required: ['section_id', 'field_path', 'value', 'merge_strategy'],
            },
          },
        },
        required: ['updates'],
      },
    }

    const ai = getGeminiClient()
    const model = resolveModel()

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Data,
              },
            },
            {
              text: 'Please extract key information and return updates via save_assessment_data only.',
            },
          ],
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1,
        maxOutputTokens: 4000,
        tools: [{ functionDeclarations: [reportSchemaTool] }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY,
            allowedFunctionNames: ['save_assessment_data'],
          },
        },
      },
    })

    // Extract function call from response
    const candidate = (response as any).candidates?.[0]
    const parts = candidate?.content?.parts || []
    const fcPart = parts.find((p: any) => p.functionCall)

    if (!fcPart?.functionCall?.args) {
      throw new Error('No tool use found in response from model')
    }

    return NextResponse.json({
      success: true,
      analysis: fcPart.functionCall.args,
      fileName: file.name,
      fileSize: file.size,
    })
  } catch (error) {
    console.error('PDF processing error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
