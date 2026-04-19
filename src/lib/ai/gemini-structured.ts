/**
 * Gemini Structured Output — drop-in replacement for structured.ts
 *
 * Replaces OpenAI's `responses.parse()` with Gemini's `responseSchema`.
 * Same exports: parseWithZod(), streamParseWithZod(), RoleMessage, StructuredParseOptions
 */

import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { getGeminiClient, resolveModel } from './gemini-client'
import type { Content, Part } from '@google/genai'

// ── Re-export identical types ────────────────────────────────────────────────
export type RoleMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type StructuredParseOptions = {
  model?: string
  max_output_tokens?: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert our simple messages array into Gemini's Content[] + optional systemInstruction */
function toGeminiInput(messages: RoleMessage[]): {
  contents: Content[]
  systemInstruction?: string
} {
  let systemInstruction: string | undefined
  const contents: Content[] = []

  for (const m of messages) {
    if (m.role === 'system') {
      // Gemini uses a separate systemInstruction field
      systemInstruction = (systemInstruction ? systemInstruction + '\n' : '') + m.content
      continue
    }

    const role = m.role === 'assistant' ? 'model' : 'user'
    contents.push({ role, parts: [{ text: m.content }] })
  }

  return { contents, systemInstruction }
}

/** Convert Zod schema → JSON Schema suitable for Gemini responseSchema */
function zodToGeminiSchema(schema: z.ZodType): Record<string, unknown> {
  const full = zodToJsonSchema(schema, { target: 'openApi3' }) as Record<string, unknown>
  // zodToJsonSchema wraps in { $schema, ... } — strip meta fields Gemini doesn't need
  const { $schema, default: _d, ...rest } = full as any // eslint-disable-line @typescript-eslint/no-unused-vars
  return rest
}

// ── parseWithZod ─────────────────────────────────────────────────────────────

/**
 * Parse model output into a Zod-validated object using Gemini Structured Outputs.
 * - Sends responseSchema + responseMimeType: "application/json"
 * - Post-validates with Zod for safety
 */
export async function parseWithZod<T>(
  schema: z.ZodType<T>,
  name: string,
  messages: RoleMessage[],
  opts: StructuredParseOptions = {}
): Promise<{ ok: true; data: T } | { ok: false; error: string; refusal?: string }> {
  const ai = getGeminiClient()
  const model = resolveModel(opts.model)
  const { contents, systemInstruction } = toGeminiInput(messages)

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: zodToGeminiSchema(schema) as any,
        maxOutputTokens: opts.max_output_tokens,
        ...(systemInstruction ? { systemInstruction } : {}),
      },
    })

    const text = response.text
    if (!text) {
      // Check for safety / refusal
      const candidate = (response as any).candidates?.[0]
      if (candidate?.finishReason === 'SAFETY') {
        return { ok: false, error: 'Model refused the request (safety filter)', refusal: 'safety' }
      }
      return { ok: false, error: 'No text output returned by model' }
    }

    // Parse JSON and validate with Zod
    let raw: unknown
    try {
      raw = JSON.parse(text)
    } catch {
      return { ok: false, error: `Invalid JSON from model: ${text.slice(0, 200)}` }
    }

    const result = schema.safeParse(raw)
    if (!result.success) {
      return { ok: false, error: `Zod validation failed: ${result.error.message}` }
    }

    return { ok: true, data: result.data }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: msg }
  }
}

// ── streamParseWithZod ───────────────────────────────────────────────────────

/**
 * Stream a schema-constrained response from Gemini.
 * Returns an async iterable of text chunks. The caller accumulates chunks,
 * then JSON-parses + Zod-validates the full text when the stream ends.
 *
 * Usage:
 *   const stream = streamParseWithZod(schema, name, messages)
 *   let fullText = ''
 *   for await (const chunk of stream) { fullText += chunk; sendToClient(chunk) }
 *   const parsed = schema.parse(JSON.parse(fullText))
 */
export async function* streamParseWithZod<T>(
  schema: z.ZodType<T>,
  name: string,
  messages: RoleMessage[],
  opts: StructuredParseOptions = {}
): AsyncGenerator<string, void, undefined> {
  const ai = getGeminiClient()
  const model = resolveModel(opts.model)
  const { contents, systemInstruction } = toGeminiInput(messages)

  const response = await ai.models.generateContentStream({
    model,
    contents,
    config: {
      responseMimeType: 'application/json',
      responseSchema: zodToGeminiSchema(schema) as any,
      maxOutputTokens: opts.max_output_tokens,
      ...(systemInstruction ? { systemInstruction } : {}),
    },
  })

  for await (const chunk of response) {
    const text = chunk.text
    if (text) {
      yield text
    }
  }
}
