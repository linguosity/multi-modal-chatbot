/**
 * Structured-output helpers backed by Claude tool-use.
 *
 * Claude doesn't have a dedicated `responses.parse()` endpoint like OpenAI;
 * the canonical pattern is to define a single tool whose input_schema matches
 * the desired JSON shape and force the model to call it. The tool's input
 * object is the validated JSON response.
 *
 * Same exports as before (`parseWithZod`, `streamParseWithZod`, `RoleMessage`,
 * `StructuredParseOptions`) so call sites don't need to change.
 */

import AnthropicSDK from '@anthropic-ai/sdk'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { CLAUDE_MODELS } from './anthropic-compat'

export type RoleMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type StructuredParseOptions = {
  model?: string
  max_output_tokens?: number
}

let _client: AnthropicSDK | null = null
function getClient(): AnthropicSDK {
  if (_client) return _client
  _client = new AnthropicSDK({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _client
}

function resolveModel(explicit?: string): string {
  return explicit || process.env.CLAUDE_MODEL || CLAUDE_MODELS.SONNET
}

/** Convert our flat messages array → Anthropic messages + system prompt. */
function toAnthropicInput(messages: RoleMessage[]): {
  system?: string
  messages: any[]
} {
  let system: string | undefined
  const out: any[] = []
  for (const m of messages) {
    if (m.role === 'system') {
      system = system ? `${system}\n${m.content}` : m.content
      continue
    }
    out.push({
      role: m.role,
      content: [{ type: 'text', text: m.content }],
    })
  }
  return { system, messages: out }
}

/** Strip JSON-schema fields Claude's tool_use doesn't need. */
function zodToClaudeSchema(schema: z.ZodType): Record<string, unknown> {
  const full = zodToJsonSchema(schema, { target: 'openApi3' }) as Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { $schema, default: _d, ...rest } = full as any
  return rest
}

function sanitizeToolName(name: string): string {
  return (name || 'return_structured_output').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64)
}

/**
 * Parse model output into a Zod-validated object using a forced tool call.
 */
export async function parseWithZod<T>(
  schema: z.ZodType<T>,
  name: string,
  messages: RoleMessage[],
  opts: StructuredParseOptions = {}
): Promise<{ ok: true; data: T } | { ok: false; error: string; refusal?: string }> {
  const client = getClient()
  const model = resolveModel(opts.model)
  const { system, messages: convo } = toAnthropicInput(messages)
  const toolName = sanitizeToolName(name)

  try {
    const requestBody: any = {
      model,
      max_tokens: opts.max_output_tokens ?? 4096,
      messages: convo,
      tools: [
        {
          name: toolName,
          description: `Return the structured ${name} response via this tool.`,
          input_schema: zodToClaudeSchema(schema),
        },
      ],
      tool_choice: { type: 'tool', name: toolName },
    }
    if (system) requestBody.system = system

    const response = await client.messages.create(requestBody)

    // Extract the forced tool_use block
    const toolBlock: any = response.content.find(
      (b: any) => b.type === 'tool_use' && b.name === toolName
    )
    if (!toolBlock) {
      const text = response.content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('\n')
        .trim()
      if ((response.stop_reason as string) === 'refusal') {
        return { ok: false, error: 'Model refused the request', refusal: text || 'refusal' }
      }
      return { ok: false, error: text || 'Model did not return the structured tool call' }
    }

    const result = schema.safeParse(toolBlock.input)
    if (!result.success) {
      return { ok: false, error: `Zod validation failed: ${result.error.message}` }
    }
    return { ok: true, data: result.data }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: msg }
  }
}

/**
 * Stream a schema-constrained response. Consumer accumulates chunks and
 * JSON-parses the concatenated `input_json_delta` events when done.
 */
export async function* streamParseWithZod<T>(
  schema: z.ZodType<T>,
  name: string,
  messages: RoleMessage[],
  opts: StructuredParseOptions = {}
): AsyncGenerator<string, void, undefined> {
  const client = getClient()
  const model = resolveModel(opts.model)
  const { system, messages: convo } = toAnthropicInput(messages)
  const toolName = sanitizeToolName(name)

  const requestBody: any = {
    model,
    max_tokens: opts.max_output_tokens ?? 4096,
    messages: convo,
    tools: [
      {
        name: toolName,
        description: `Return the structured ${name} response via this tool.`,
        input_schema: zodToClaudeSchema(schema),
      },
    ],
    tool_choice: { type: 'tool', name: toolName },
  }
  if (system) requestBody.system = system

  const stream = client.messages.stream(requestBody)

  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      const delta: any = event.delta
      if (delta?.type === 'input_json_delta' && typeof delta.partial_json === 'string') {
        yield delta.partial_json
      } else if (delta?.type === 'text_delta' && typeof delta.text === 'string') {
        yield delta.text
      }
    }
  }
}
