/**
 * Singleton Google Gemini client + model constants.
 *
 * SDK: @google/genai (unified Gen AI SDK, replaces deprecated @google/generative-ai)
 * Docs: https://ai.google.dev/gemini-api/docs
 */

import { GoogleGenAI } from '@google/genai'

// ── Model constants ──────────────────────────────────────────────────────────
export const GEMINI_MODELS = {
  /** Best quality, 1M context, structured output, tool calling */
  PRO: 'gemini-2.5-pro',
  /** Fast + cheap, still 1M context, structured output, tool calling */
  FLASH: 'gemini-2.5-flash',
} as const

export type GeminiModelId = (typeof GEMINI_MODELS)[keyof typeof GEMINI_MODELS]

// ── Singleton client ─────────────────────────────────────────────────────────
let _client: GoogleGenAI | null = null

export function getGeminiClient(): GoogleGenAI {
  if (_client) return _client

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error(
      'GOOGLE_GEMINI_API_KEY is not set. Get one at https://aistudio.google.com/apikey'
    )
  }

  _client = new GoogleGenAI({ apiKey })
  return _client
}

/**
 * Resolve which model to use:
 *   1. Explicit `model` param
 *   2. GEMINI_MODEL env var
 *   3. Default to Flash (cheapest)
 */
export function resolveModel(explicit?: string): string {
  return explicit || process.env.GEMINI_MODEL || GEMINI_MODELS.FLASH
}
