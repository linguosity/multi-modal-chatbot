import { NextRequest, NextResponse } from 'next/server'
import { getGeminiClient, resolveModel } from '@/lib/ai/gemini-client'
import { FunctionCallingConfigMode } from '@google/genai'
import { getSectionSchemaForType, SectionSchema } from '@/lib/structured-schemas'

export const runtime = 'nodejs'

type AnalyzeBody = {
  sectionKey: string
  fields?: string[]
  sources: Array<
    | { type: 'text'; artifactId: string; text: string }
    | { type: 'pdf'; artifactId: string; page: number; text: string }
    | { type: 'audio'; artifactId: string; startSec: number; endSec: number; text: string }
  >
}

function getSectionSchema(sectionKey: string): SectionSchema | null {
  return getSectionSchemaForType(sectionKey)
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzeBody
    const { sectionKey, fields, sources } = body

    if (!sectionKey || !Array.isArray(sources) || sources.length === 0) {
      return NextResponse.json({ error: 'Missing sectionKey or sources[]' }, { status: 400 })
    }

    const schema = getSectionSchema(sectionKey)
    if (!schema) {
      return NextResponse.json({ error: `Unknown sectionKey: ${sectionKey}` }, { status: 400 })
    }

    // Determine which fields to request
    const targetFields = (fields && fields.length ? fields : schema.fields.map(f => f.key)).filter(Boolean)

    // Build a compact schema contract for the model
    const fieldContracts = schema.fields
      .filter(f => targetFields.includes(f.key))
      .map(f => ({ key: f.key, label: f.label, type: f.type, required: !!f.required }))

    // Prepare source text with provenance markers
    const bundledText = sources
      .map(s => {
        if (s.type === 'pdf') return `[pdf:${s.artifactId}#p${(s as any).page}]\n${s.text}`
        if (s.type === 'audio') return `[audio:${s.artifactId}@${(s as any).startSec}-${(s as any).endSec}]\n${s.text}`
        return `[text:${s.artifactId}]\n${s.text}`
      })
      .join('\n\n---\n\n')

    // Gemini function declaration for field extraction
    const functionDeclaration = {
      name: 'return_field_values',
      description: 'Return only the requested fields with validated values and provenance.',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          values: {
            type: 'object',
            additionalProperties: true,
            description: 'Map of field key to value (string | number | boolean | object | array)',
          },
          provenance: {
            type: 'object',
            additionalProperties: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  artifactId: { type: 'string' },
                  page: { type: 'number' },
                  startSec: { type: 'number' },
                  endSec: { type: 'number' },
                  confidence: { type: 'number' },
                  note: { type: 'string' },
                },
              },
            },
          },
        },
        required: ['values'],
      },
    }

    const systemText = [
      'You are extracting structured values for a speech-language evaluation report.',
      'Return only the requested fields. If a value is missing, omit the key.',
      'Honor types: string | number | boolean | array | object. Keep numbers as numbers.',
      'Provide provenance entries referencing artifactId and (page or startSec/endSec) where possible.',
    ].join(' ')

    const userText = `Section: ${schema.title} (key=${schema.key})\nFields: ${JSON.stringify(fieldContracts)}\n\nSources:\n${bundledText}`

    const ai = getGeminiClient()
    const model = resolveModel()

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: userText }] }],
      config: {
        systemInstruction: systemText,
        temperature: 0.1,
        tools: [{ functionDeclarations: [functionDeclaration] }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY,
            allowedFunctionNames: ['return_field_values'],
          },
        },
      },
    })

    // Extract function call from response
    const candidate = (response as any).candidates?.[0]
    const parts = candidate?.content?.parts || []
    const fcPart = parts.find((p: any) => p.functionCall)

    if (!fcPart?.functionCall?.args) {
      return NextResponse.json({ success: false, error: 'Model did not return tool output' }, { status: 502 })
    }

    const parsed = fcPart.functionCall.args

    return NextResponse.json({ success: true, sectionKey, fields: targetFields, ...parsed })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
