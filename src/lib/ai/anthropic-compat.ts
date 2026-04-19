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
  | { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }

type AnthropicMessageParam = {
  role: 'user' | 'assistant' | 'system'
  content: AnthropicContentBlock[]
}

type AnthropicTool = {
  name: string
  description?: string
  input_schema: any
}

type CreateParams = {
  model?: string
  max_tokens?: number
  temperature?: number
  system?: string
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
 * Class kept named `Anthropic` so existing callers doing
 * `import Anthropic from '...'` followed by `Anthropic.ToolUseBlock` etc.
 * still type-resolve via the matching namespace declaration below.
 */
export default class Anthropic {
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

      // Split messages into system prompt + conversation
      let systemText = params.system || ''
      const conversation: any[] = []
      for (const m of params.messages) {
        if (m.role === 'system') {
          const extra = m.content
            .filter((b): b is Extract<AnthropicContentBlock, { type: 'text' }> => b.type === 'text')
            .map((b) => b.text)
            .join('\n')
          systemText = systemText ? `${systemText}\n${extra}` : extra
          continue
        }
        conversation.push({ role: m.role, content: m.content })
      }

      const requestBody: any = {
        model,
        max_tokens: params.max_tokens ?? 4096,
        messages: conversation,
      }
      if (systemText) requestBody.system = systemText
      if (params.temperature !== undefined) requestBody.temperature = params.temperature
      if (params.tools && params.tools.length > 0) {
        requestBody.tools = params.tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.input_schema,
        }))
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
      }
    },
  }
}

// Type namespace for `Anthropic.ToolUseBlock` / `Anthropic.MessageParam` references
export namespace Anthropic {
  export type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: any }
  export type MessageParam = {
    role: 'user' | 'assistant' | 'system'
    content: AnthropicContentBlock[]
  }
}
