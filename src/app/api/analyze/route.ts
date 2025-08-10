import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getSectionSchemaForType, SectionSchema } from '@/lib/structured-schemas'

export const runtime = 'nodejs'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MODEL = process.env.OPENAI_MODEL || 'gpt-5-2025-08-07'

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
        if (s.type === 'pdf') return `[pdf:${s.artifactId}#p${s.page}]\n${s.text}`
        if (s.type === 'audio') return `[audio:${s.artifactId}@${s.startSec}-${s.endSec}]\n${s.text}`
        return `[text:${s.artifactId}]\n${s.text}`
      })
      .join('\n\n---\n\n')

    // Tool to return strict JSON values per field
    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'return_field_values',
          description: 'Return only the requested fields with validated values and provenance.',
          parameters: {
            type: 'object',
            properties: {
              values: {
                type: 'object',
                additionalProperties: true,
                description: 'Map of field key to value (string | number | boolean | object | array)'
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
                      confidence: { type: 'number', minimum: 0, maximum: 1 },
                      note: { type: 'string' }
                    }
                  }
                }
              }
            },
            required: ['values']
          }
        }
      }
    ]

    const system = [
      'You are extracting structured values for a speech-language evaluation report.',
      'Return only the requested fields. If a value is missing, omit the key.',
      'Honor types: string | number | boolean | array | object. Keep numbers as numbers.',
      'Provide provenance entries referencing artifactId and (page or startSec/endSec) where possible.'
    ].join(' ')

    const user = `Section: ${schema.title} (key=${schema.key})\nFields: ${JSON.stringify(fieldContracts)}\n\nSources:\n${bundledText}`

    // Call OpenAI with function call
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.1,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      tools,
      tool_choice: { type: 'function', function: { name: 'return_field_values' } as any } as any
    })

    const msg = completion.choices[0].message
    const tc = msg.tool_calls?.[0]
    if (!tc?.function?.arguments) {
      return NextResponse.json({ success: false, error: 'Model did not return tool output' }, { status: 502 })
    }

    let parsed: any
    try {
      parsed = JSON.parse(tc.function.arguments)
    } catch {
      parsed = { values: {}, provenance: {} }
    }

    return NextResponse.json({ success: true, sectionKey, fields: targetFields, ...parsed })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
