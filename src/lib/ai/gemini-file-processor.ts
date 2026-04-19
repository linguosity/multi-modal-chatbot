/**
 * Gemini File Processor — unified replacement for file-processing.ts + enhanced-file-processor.ts
 *
 * Leverages Gemini's native multimodal capabilities:
 * - Audio → Gemini understands audio natively (no separate Whisper step)
 * - PDFs → inline base64 or File API
 * - Images → inline base64 vision
 * - Text → direct analysis
 */

import { getGeminiClient, resolveModel, GEMINI_MODELS } from './gemini-client'
import type { Part } from '@google/genai'

// ── File size limits (Gemini supports large inputs) ──────────────────────────
export const FILE_SIZE_LIMITS = {
  PDF: 50 * 1024 * 1024,    // 50MB (Gemini limit)
  IMAGE: 20 * 1024 * 1024,  // 20MB
  AUDIO: 40 * 1024 * 1024,  // 40MB (Gemini supports up to ~10 hours of audio)
}

export const SUPPORTED_FILE_TYPES = {
  PDF: ['application/pdf'],
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  AUDIO: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/flac', 'audio/webm'],
  DOCUMENT: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/csv', 'text/plain', 'text/html'],
}

export const PDF_LIMITS = {
  MAX_PAGES: 3600, // Gemini supports much larger PDFs than Claude
  MAX_SIZE: 50 * 1024 * 1024,
}

// ── Types (same interface as file-processing.ts) ─────────────────────────────

export interface ProcessedFile {
  name: string
  type: string
  size: number
  content: string // Base64 content or transcription text
  processingMethod: 'gemini-document' | 'gemini-vision' | 'gemini-audio'
  confidence?: number
  pageCount?: number
}

export interface FileValidationResult {
  isValid: boolean
  error?: string
  fileType?: 'PDF' | 'IMAGE' | 'AUDIO' | 'DOCUMENT'
}

// ── Validation ───────────────────────────────────────────────────────────────

export function validateFile(file: File): FileValidationResult {
  let fileType: 'PDF' | 'IMAGE' | 'AUDIO' | 'DOCUMENT' | undefined

  if (SUPPORTED_FILE_TYPES.PDF.includes(file.type)) {
    fileType = 'PDF'
  } else if (SUPPORTED_FILE_TYPES.IMAGE.includes(file.type)) {
    fileType = 'IMAGE'
  } else if (SUPPORTED_FILE_TYPES.AUDIO.includes(file.type)) {
    fileType = 'AUDIO'
  } else if (SUPPORTED_FILE_TYPES.DOCUMENT.includes(file.type)) {
    fileType = 'DOCUMENT'
  } else {
    return {
      isValid: false,
      error: `Unsupported file type: ${file.type}. Supported: PDF, Images (JPEG, PNG, WebP, GIF), Audio (MP3, WAV, M4A, OGG, FLAC), Documents (DOCX, CSV, TXT, HTML)`,
    }
  }

  const sizeLimit = fileType === 'DOCUMENT' ? FILE_SIZE_LIMITS.PDF : FILE_SIZE_LIMITS[fileType]
  if (file.size > sizeLimit) {
    const sizeMB = Math.round(sizeLimit / (1024 * 1024))
    return { isValid: false, error: `File exceeds ${sizeMB}MB limit for ${fileType} files` }
  }

  return { isValid: true, fileType }
}

export function estimatePDFPageCount(file: File): number {
  const avgPageSize = 50 * 1024
  return Math.ceil(file.size / avgPageSize)
}

export function validatePDF(file: File): FileValidationResult {
  const basic = validateFile(file)
  if (!basic.isValid) return basic

  const estimatedPages = estimatePDFPageCount(file)
  if (estimatedPages > PDF_LIMITS.MAX_PAGES) {
    return {
      isValid: false,
      error: `PDF appears to have ~${estimatedPages} pages. Gemini supports up to ${PDF_LIMITS.MAX_PAGES} pages.`,
    }
  }

  return { isValid: true, fileType: 'PDF' }
}

// ── Base64 conversion ────────────────────────────────────────────────────────

export async function processPDFDirect(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  return Buffer.from(arrayBuffer).toString('base64')
}

export async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  return Buffer.from(arrayBuffer).toString('base64')
}

// ── Audio transcription via Gemini ───────────────────────────────────────────

/**
 * Transcribes audio using Gemini's native audio understanding.
 * No separate Whisper step needed — Gemini processes audio natively.
 */
export async function transcribeAudio(file: File): Promise<string> {
  const ai = getGeminiClient()
  const model = resolveModel()

  const base64 = await fileToBase64(file)

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: file.type || 'audio/mpeg',
              data: base64,
            },
          },
          {
            text: 'Transcribe this audio recording accurately and completely. Return only the transcription text, nothing else.',
          },
        ],
      },
    ],
  })

  const text = response.text
  if (!text) {
    throw new Error('No transcription returned by Gemini')
  }

  return text
}

// ── Unified file processor ───────────────────────────────────────────────────

export async function processFile(file: File): Promise<ProcessedFile> {
  let validation: FileValidationResult
  if (file.type === 'application/pdf') {
    validation = validatePDF(file)
  } else {
    validation = validateFile(file)
  }

  if (!validation.isValid) {
    throw new Error(validation.error)
  }

  const processed: ProcessedFile = {
    name: file.name,
    type: file.type,
    size: file.size,
    content: '',
    processingMethod: 'gemini-document',
  }

  switch (validation.fileType) {
    case 'PDF':
    case 'DOCUMENT':
      processed.content = await processPDFDirect(file)
      processed.processingMethod = 'gemini-document'
      if (file.type === 'application/pdf') {
        processed.pageCount = estimatePDFPageCount(file)
      }
      break

    case 'IMAGE':
      processed.content = await fileToBase64(file)
      processed.processingMethod = 'gemini-vision'
      break

    case 'AUDIO':
      processed.content = await transcribeAudio(file)
      processed.processingMethod = 'gemini-audio'
      break

    default:
      throw new Error(`Unsupported file type: ${validation.fileType}`)
  }

  return processed
}

export async function processMultipleFiles(files: File[]): Promise<ProcessedFile[]> {
  const results: ProcessedFile[] = []
  const errors: string[] = []

  for (const file of files) {
    try {
      results.push(await processFile(file))
    } catch (error) {
      errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (errors.length > 0 && results.length === 0) {
    throw new Error(`Failed to process any files:\n${errors.join('\n')}`)
  }

  return results
}

// ── Convert processed files to Gemini content parts ──────────────────────────

/**
 * Converts processed files into Gemini Part[] for use in generateContent.
 * This replaces filesToClaudeContent() from the old file-processing.ts.
 */
export function filesToGeminiParts(processedFiles: ProcessedFile[]): Part[] {
  const parts: Part[] = []

  for (const file of processedFiles) {
    if (file.processingMethod === 'gemini-vision') {
      parts.push({
        inlineData: {
          mimeType: file.type,
          data: file.content,
        },
      })
    } else if (file.processingMethod === 'gemini-document') {
      if (file.type === 'application/pdf') {
        parts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: file.content,
          },
        })
      } else {
        // Text-based documents: decode base64 and send as text
        try {
          const textContent = Buffer.from(file.content, 'base64').toString('utf-8')
          parts.push({ text: `Content from ${file.name}:\n${textContent}` })
        } catch {
          parts.push({ text: `Content from ${file.name}:\n${file.content}` })
        }
      }
    } else if (file.processingMethod === 'gemini-audio') {
      // Audio was already transcribed — send as text
      parts.push({ text: `Audio Transcript from ${file.name}:\n${file.content}` })
    }
  }

  return parts
}

/**
 * Backward-compatible: converts processed files to Claude-shaped content blocks.
 * Used by routes that haven't been fully migrated yet.
 */
export function filesToClaudeContent(processedFiles: ProcessedFile[]): Array<{ type: string; source?: any; text?: string; title?: string }> {
  const content: Array<{ type: string; source?: any; text?: string; title?: string }> = []

  for (const file of processedFiles) {
    if (file.processingMethod === 'gemini-vision') {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: file.type, data: file.content },
      })
    } else if (file.processingMethod === 'gemini-document') {
      if (file.type === 'application/pdf') {
        content.push({
          type: 'document',
          source: { type: 'base64', media_type: file.type, data: file.content },
          title: file.name,
        })
      } else {
        try {
          const textContent = Buffer.from(file.content, 'base64').toString('utf-8')
          content.push({ type: 'text', text: `Content from ${file.name}:\n${textContent}` })
        } catch {
          content.push({ type: 'text', text: `Content from ${file.name}:\n${file.content}` })
        }
      }
    } else if (file.processingMethod === 'gemini-audio') {
      content.push({ type: 'text', text: `Audio Transcript from ${file.name}:\n${file.content}` })
    }
  }

  return content
}
