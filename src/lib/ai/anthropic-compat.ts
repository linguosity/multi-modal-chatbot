// Anthropic compatibility layer backed by OpenAI function calling
// Supports: text messages, tool/function calling, tool results loop
// Note: Does not support Anthropic image/document content blocks; callers should pre-extract text.

import OpenAI from 'openai'

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
  model: string
  max_tokens?: number
  temperature?: number
  system?: string
  messages: AnthropicMessageParam[]
  tools?: AnthropicTool[]
  tool_choice?: { type: 'tool'; name: string } | 'auto' | undefined
}

export default class Anthropic {
  private openai: OpenAI
  private model: string

  constructor(opts: { apiKey?: string, project?: string } = {}) {
    this.openai = new OpenAI({
      apiKey: opts.apiKey || process.env.OPENAI_API_KEY,
      // Support project-scoped API keys if provided
      project: opts.project || process.env.OPENAI_PROJECT || process.env.OPENAI_PROJECT_ID,
    })
    // Prefer Claude model if provided; otherwise allow override via OPENAI_MODEL
    this.model = process.env.CLAUDE_MODEL || process.env.OPENAI_MODEL || 'claude-opus-4-1-20250805'
  }

  public messages = {
    create: async (params: CreateParams) => {
      const system = params.system
      const tools = params.tools || []

      // Map Anthropic tool schemas to OpenAI function tools
      const oaTools = tools.map(t => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description || undefined,
          parameters: t.input_schema || { type: 'object', properties: {} }
        }
      }))

      // Build chat messages
      const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
      if (system) {
        chatMessages.push({ role: 'system', content: system })
      }

      for (const m of params.messages) {
        // Collapse text blocks into a single string
        const toolResultBlocks = m.content.filter(b => b.type === 'tool_result') as Extract<AnthropicContentBlock, { type: 'tool_result' }>[]
        const textBlocks = m.content.filter(b => b.type === 'text') as Extract<AnthropicContentBlock, { type: 'text' }>[]

        if (toolResultBlocks.length > 0) {
          // Forward tool results as tool role messages
          for (const tr of toolResultBlocks) {
            chatMessages.push({
              role: 'tool',
              tool_call_id: tr.tool_use_id,
              content: tr.content || ''
            })
          }
          continue
        }

        const combined = textBlocks.map(t => t.text).join('\n')
        const role = m.role === 'system' ? 'user' : m.role // treat stray system as user for safety
        chatMessages.push({ role, content: combined || '' })
      }

      // Tool choice mapping
      let tool_choice: any = undefined
      if (params.tool_choice && typeof params.tool_choice === 'object' && params.tool_choice.type === 'tool') {
        tool_choice = { type: 'function', function: { name: params.tool_choice.name } }
      }

      const opts: any = {
        model: params.model || this.model,
        max_completion_tokens: params.max_tokens,
        messages: chatMessages,
        tools: oaTools.length ? oaTools : undefined,
        tool_choice: tool_choice as any,
      }
      // GPT-5 models only support default temperature; omit to avoid 400s
      const modelName = (params.model || this.model || '').toString()
      if (!modelName.startsWith('gpt-5') && params.temperature !== undefined) {
        opts.temperature = params.temperature
      }

      const completion = await this.openai.chat.completions.create(opts)

      const choice = completion.choices[0]
      const toolCalls = choice.message.tool_calls || []
      const content: AnthropicContentBlock[] = []

      const text = choice.message.content || ''
      if (text && text.trim().length > 0) {
        content.push({ type: 'text', text })
      }

      for (const tc of toolCalls) {
        let args: any = {}
        try {
          args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {}
        } catch {
          args = tc.function.arguments
        }
        content.push({ type: 'tool_use', id: tc.id, name: tc.function.name, input: args })
      }

      const stop_reason = toolCalls.length > 0 ? 'tool_use' : (choice.finish_reason || 'stop')

      return {
        content,
        stop_reason
      }
    }
  }
}

// Type namespace compatibility to satisfy existing type references like Anthropic.ToolUseBlock
export namespace Anthropic {
  export type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: any }
  export type MessageParam = {
    role: 'user' | 'assistant' | 'system'
    content: AnthropicContentBlock[]
  }
}
