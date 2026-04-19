/**
 * Gemini Messages — drop-in replacement for anthropic-compat.ts
 *
 * Provides the same `messages.create(params)` interface that the codebase expects
 * (Anthropic-shaped tool calling), but routes everything through Google Gemini.
 */

import { getGeminiClient, resolveModel } from './gemini-client'
import type {
  Content,
  FunctionDeclaration,
  Part,
  GenerateContentConfig,
} from '@google/genai'
import { FunctionCallingConfigMode } from '@google/genai'

// ── Anthropic-compatible types (kept identical to anthropic-compat.ts) ───────

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

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Map Anthropic tool definitions → Gemini FunctionDeclarations */
function toGeminiFunctions(tools: AnthropicTool[]): FunctionDeclaration[] {
  return tools.map(t => ({
    name: t.name,
    description: t.description || '',
    parametersJsonSchema: t.input_schema || { type: 'object', properties: {} },
  }))
}

/** Convert Anthropic messages array → Gemini Contents + optional system instruction */
function toGeminiContents(
  messages: AnthropicMessageParam[],
  system?: string
): { contents: Content[]; systemInstruction?: string } {
  let systemInstruction = system || undefined
  const contents: Content[] = []

  for (const m of messages) {
    if (m.role === 'system') {
      // Gemini uses a dedicated systemInstruction field
      systemInstruction = (systemInstruction ? systemInstruction + '\n' : '') +
        m.content.filter(b => b.type === 'text').map(b => (b as any).text).join('\n')
      continue
    }

    const toolResultBlocks = m.content.filter(b => b.type === 'tool_result') as Extract<AnthropicContentBlock, { type: 'tool_result' }>[]
    const toolUseBlocks = m.content.filter(b => b.type === 'tool_use') as Extract<AnthropicContentBlock, { type: 'tool_use' }>[]
    const textBlocks = m.content.filter(b => b.type === 'text') as Extract<AnthropicContentBlock, { type: 'text' }>[]

    // Tool results → functionResponse parts
    if (toolResultBlocks.length > 0) {
      const parts: Part[] = toolResultBlocks.map(tr => ({
        functionResponse: {
          name: tr.tool_use_id, // Gemini uses the function name, not ID — but we store name in tool_use_id mapping
          response: { result: tr.content || '' },
        },
      }))
      contents.push({ role: 'user', parts })
      continue
    }

    // Tool use blocks (from assistant) → functionCall parts
    if (toolUseBlocks.length > 0) {
      const parts: Part[] = []
      for (const tb of textBlocks) {
        parts.push({ text: tb.text })
      }
      for (const tu of toolUseBlocks) {
        parts.push({
          functionCall: { name: tu.name, args: tu.input || {} },
        })
      }
      contents.push({ role: 'model', parts })
      continue
    }

    // Plain text
    const role = m.role === 'assistant' ? 'model' : 'user'
    const combined = textBlocks.map(t => t.text).join('\n')
    if (combined) {
      contents.push({ role, parts: [{ text: combined }] })
    }
  }

  return { contents, systemInstruction }
}

/** Generate a unique tool-use ID */
function generateToolId(): string {
  return `toolu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ── Main class ───────────────────────────────────────────────────────────────

export default class Anthropic {
  private model: string

  constructor(opts: { apiKey?: string; project?: string } = {}) {
    // Resolve model: GEMINI_MODEL env → default Flash
    this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  }

  public messages = {
    create: async (params: CreateParams) => {
      const ai = getGeminiClient()
      const model = resolveModel(params.model || this.model)
      const tools = params.tools || []

      const { contents, systemInstruction } = toGeminiContents(params.messages, params.system)

      // Build config
      const config: GenerateContentConfig = {
        maxOutputTokens: params.max_tokens,
        ...(systemInstruction ? { systemInstruction } : {}),
      }

      // Temperature — Gemini supports it on most models
      if (params.temperature !== undefined) {
        config.temperature = params.temperature
      }

      // Tools
      if (tools.length > 0) {
        config.tools = [{ functionDeclarations: toGeminiFunctions(tools) }]

        // Tool choice mapping
        if (params.tool_choice && typeof params.tool_choice === 'object' && params.tool_choice.type === 'tool') {
          config.toolConfig = {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.ANY,
              allowedFunctionNames: [params.tool_choice.name],
            },
          }
        }
      }

      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      })

      // Parse response into Anthropic-shaped content blocks
      const content: AnthropicContentBlock[] = []
      const candidate = (response as any).candidates?.[0]
      const parts: Part[] = candidate?.content?.parts || []

      for (const part of parts) {
        if (part.text && part.text.trim().length > 0) {
          content.push({ type: 'text', text: part.text })
        }
        if (part.functionCall) {
          content.push({
            type: 'tool_use',
            id: generateToolId(),
            name: part.functionCall.name!,
            input: part.functionCall.args || {},
          })
        }
      }

      // If no content extracted, try the simple text accessor
      if (content.length === 0 && response.text) {
        content.push({ type: 'text', text: response.text })
      }

      const hasToolCalls = content.some(c => c.type === 'tool_use')
      const stop_reason = hasToolCalls ? 'tool_use' : 'stop'

      return { content, stop_reason }
    },
  }
}

// Type namespace compatibility (same as anthropic-compat.ts)
export namespace Anthropic {
  export type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: any }
  export type MessageParam = {
    role: 'user' | 'assistant' | 'system'
    content: AnthropicContentBlock[]
  }
}
