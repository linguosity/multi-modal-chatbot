/**
 * Anthropic SDK wrapper exposing the message-shaped interface the rest of the
 * codebase expects (`anthropic.messages.create(params)` → `{ content, stop_reason }`).
 *
 * Historically this was an OpenAI-backed shim; now it's backed by the real
 * Anthropic SDK (`@anthropic-ai/sdk`). Keep the class API stable so routes
 * that import this continue working.
 */

import AnthropicSDK from '@anthropic-ai/sdk'

export const CLAUDE_MODELS = {
  OPUS:   'claude-opus-4-7',
  SONNET: 'claude-sonnet-4-6',
  HAIKU:  'claude-haiku-4-5-20251001',
} as const

export type ClaudeModelId = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS]

type AnthropicContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: any }
  | { type: 'tool_result'; tool_use_id: string; content: string | AnthropicContentBlock[]; is_error?: boolean }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } | { type: 'url'; url: string } }
  | { type: 'document'; source: { type: 'base64'; media_type: string; data: string } | { type: 'url'; url: string }; title?: string }

type AnthropicMessageParam = {
  role: 'user' | 'assistant' | 'system'
  // Accept raw string OR structured content blocks — Anthropic SDK allows both.
  content: string | AnthropicContentBlock[]
}

type AnthropicCacheControl = { type: 'ephemeral'; ttl?: '5m' | '1h' }

type AnthropicTool = {
  name: string
  description?: string
  input_schema: any
  cache_control?: AnthropicCacheControl
}

type AnthropicSystemBlock = { type: 'text'; text: string; cache_control?: AnthropicCacheControl }

type CreateParams = {
  model?: string
  max_tokens?: number
  temperature?: number
  /**
   * String for simple cases; array of text blocks (each with optional
   * `cache_control: { type: "ephemeral" }`) when you want to mark stable
   * sections as cache-eligible. Prompt caching cuts cache-hit input cost to
   * ~10% and latency to ~15% of a cold call.
   */
  system?: string | AnthropicSystemBlock[]
  messages: AnthropicMessageParam[]
  tools?: AnthropicTool[]
  tool_choice?: { type: 'tool'; name: string } | 'auto' | undefined
}

let _client: AnthropicSDK | null = null

function getClient(apiKey?: string): AnthropicSDK {
  if (_client) return _client
  _client = new AnthropicSDK({
    apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
  })
  return _client
}

function resolveModel(explicit?: string): string {
  return explicit || process.env.CLAUDE_MODEL || CLAUDE_MODELS.SONNET
}

/**
 * Class + namespace declared locally first, then default-exported together.
 * This lets callers do `import Anthropic from '...'` followed by
 * `Anthropic.ToolUseBlock` — the namespace declaration merges with the class
 * declaration into a single binding that the default export carries over.
 */
class Anthropic {
  private defaultModel: string
  private apiKey?: string

  constructor(opts: { apiKey?: string; project?: string } = {}) {
    this.apiKey = opts.apiKey
    this.defaultModel = process.env.CLAUDE_MODEL || CLAUDE_MODELS.SONNET
  }

  public messages = {
    create: async (params: CreateParams) => {
      const client = getClient(this.apiKey)
      const model = resolveModel(params.model || this.defaultModel)

      // Collect role:'system' messages + explicit params.system. When the
      // caller passes system as an array (for cache_control markers), pass it
      // straight through and append any role:'system' message text as a
      // trailing uncached block. When system is a plain string, concatenate.
      let systemParam: any = params.system ?? ''
      const conversation: any[] = []
      for (const m of params.messages) {
        if (m.role === 'system') {
          const extra =
            typeof m.content === 'string'
              ? m.content
              : m.content
                  .filter((b): b is Extract<AnthropicContentBlock, { type: 'text' }> => b.type === 'text')
                  .map((b) => b.text)
                  .join('\n')
          if (Array.isArray(systemParam)) {
            if (extra) systemParam = [...systemParam, { type: 'text', text: extra }]
          } else {
            systemParam = systemParam ? `${systemParam}\n${extra}` : extra
          }
          continue
        }
        conversation.push({ role: m.role, content: m.content })
      }

      const requestBody: any = {
        model,
        max_tokens: params.max_tokens ?? 4096,
        messages: conversation,
      }
      if (Array.isArray(systemParam) ? systemParam.length > 0 : systemParam) {
        requestBody.system = systemParam
      }
      if (params.temperature !== undefined) requestBody.temperature = params.temperature
      if (params.tools && params.tools.length > 0) {
        // Pass tools through as-is — allows cache_control markers to survive.
        requestBody.tools = params.tools.map((t) => {
          const out: any = { name: t.name, description: t.description, input_schema: t.input_schema }
          if (t.cache_control) out.cache_control = t.cache_control
          return out
        })
      }
      if (
        params.tool_choice &&
        typeof params.tool_choice === 'object' &&
        params.tool_choice.type === 'tool'
      ) {
        requestBody.tool_choice = { type: 'tool', name: params.tool_choice.name }
      }

      const response = await client.messages.create(requestBody)

      return {
        content: response.content as unknown as AnthropicContentBlock[],
        stop_reason: response.stop_reason ?? 'stop',
        // Expose usage so callers can log cache behavior.
        // `cache_creation_input_tokens` > 0 → cache write (cold call).
        // `cache_read_input_tokens` > 0    → cache hit (warm call).
        usage: (response as any).usage ?? undefined,
      }
    },
  }
}

// Namespace merges with the class above so `Anthropic.ToolUseBlock` /
// `Anthropic.MessageParam` etc. are accessible at the type level via
// `import Anthropic from '...'`.
// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Anthropic {
  export type TextBlock = { type: 'text'; text: string }
  export type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: any }
  export type ToolResultBlock = {
    type: 'tool_result'
    tool_use_id: string
    content: string | ContentBlock[]
    is_error?: boolean
  }
  export type ImageBlock = {
    type: 'image'
    source: { type: 'base64'; media_type: string; data: string } | { type: 'url'; url: string }
  }
  export type DocumentBlock = {
    type: 'document'
    source: { type: 'base64'; media_type: string; data: string } | { type: 'url'; url: string }
    title?: string
  }
  export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock | ImageBlock | DocumentBlock

  export type MessageParam = {
    role: 'user' | 'assistant' | 'system'
    content: string | ContentBlock[]
  }

  export type Tool = {
    name: string
    description?: string
    input_schema: any
  }

  export type Message = {
    id?: string
    type?: 'message'
    role?: 'assistant'
    model?: string
    content: ContentBlock[]
    stop_reason?: string | null
    stop_sequence?: string | null
    usage?: { input_tokens?: number; output_tokens?: number }
  }
}

export default Anthropic
