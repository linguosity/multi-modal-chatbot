import OpenAI from 'openai'
import { z } from 'zod'
import { zodTextFormat } from 'openai/helpers/zod'

// Centralized OpenAI client (reuses project-scoped key if present)
let _client: OpenAI | null = null
export function getOpenAI(): OpenAI {
  if (_client) return _client
  _client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    project: process.env.OPENAI_PROJECT || process.env.OPENAI_PROJECT_ID,
  })
  return _client
}

export type RoleMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type StructuredParseOptions = {
  model?: string
  max_output_tokens?: number
}

/**
 * Parse model output into a Zod-validated object using Structured Outputs.
 * - Ensures strict JSON schema adherence
 * - Surfaces refusals and incomplete responses
 */
export async function parseWithZod<T>(
  schema: z.ZodType<T>,
  name: string,
  messages: RoleMessage[],
  opts: StructuredParseOptions = {}
): Promise<{ ok: true; data: T } | { ok: false; error: string; refusal?: string }> {
  const openai = getOpenAI()
  const model = opts.model || process.env.OPENAI_MODEL || 'gpt-5-2025-08-07'

  try {
    const response = await openai.responses.parse({
      model,
      input: messages.map(m => ({ role: m.role, content: m.content })),
      max_output_tokens: opts.max_output_tokens,
      text: { format: zodTextFormat(schema, name) },
    })

    // Handle incomplete or refused generations
    if (response.status === 'incomplete') {
      const reason = (response as any).incomplete_details?.reason || 'incomplete'
      return { ok: false, error: `Model response incomplete: ${reason}` }
    }

    // responses.parse sets .output_parsed on success
    const parsed = (response as any).output_parsed as T | undefined
    if (parsed === undefined || parsed === null) {
      // Check explicit refusal payloads
      const first = (response as any).output?.[0]?.content?.[0]
      if (first?.type === 'refusal' && first?.refusal) {
        return { ok: false, error: 'Model refused the request', refusal: first.refusal }
      }
      return { ok: false, error: 'No parsed output returned by model' }
    }

    return { ok: true, data: parsed }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: msg }
  }
}

/**
 * Helper to stream a schema-constrained response. Caller consumes events and
 * then calls stream.get_final_response() to access the parsed object.
 */
export function streamParseWithZod<T>(
  schema: z.ZodType<T>,
  name: string,
  messages: RoleMessage[],
  opts: StructuredParseOptions = {}
) {
  const openai = getOpenAI()
  const model = opts.model || process.env.OPENAI_MODEL || 'gpt-5-2025-08-07'
  return openai.responses.stream({
    model,
    input: messages.map(m => ({ role: m.role, content: m.content })),
    text: { format: zodTextFormat(schema, name) },
    max_output_tokens: opts.max_output_tokens,
  })
}

