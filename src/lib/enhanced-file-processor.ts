/**
 * Enhanced Multi-Modal File Processing Engine
 * 
 * This system provides comprehensive file processing for PDFs, images, audio, and text files
 * using Claude's latest API capabilities and OpenAI's Whisper for audio transcription.
 */

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

// Initialize AI clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Enhanced file size limits based on latest API specifications
export const ENHANCED_FILE_LIMITS = {
  PDF: {
    maxSize: 32 * 1024 * 1024, // 32MB (Claude API limit)
    maxPages: 100, // Claude API limit for visual PDF analysis
    supportedTypes: ['application/pdf']
  },
  IMAGE: {
    maxSize: 30 * 1024 * 1024, // 30MB (Claude API limit)
    maxDimensions: { width: 8000, height: 8000 }, // Claude API limit
    supportedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  },
  AUDIO: {
    maxSize: 25 * 1024 * 1024, // 25MB (OpenAI Whisper limit)
    maxDuration: 3600, // 1 hour in seconds
    supportedTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/flac', 'audio/webm']
  },
  TEXT: {
    maxSize: 10 * 1024 * 1024, // 10MB for text files
    supportedTypes: ['text/plain', 'text/csv', 'text/html', 'text/markdown', 'application/json']
  }
}

export interface ProcessedFile {
  id: string
  name: string
  type: FileType
  size: number
  processingMethod: ProcessingMethod
  content: ProcessedContent
  confidence: number
  metadata: FileMetadata
  sourceReferences: SourceReference[]
  processingTime: number
  errors: string[]
}

export interface ProcessedContent {
  raw: string | Buffer // Original content
  extracted: ExtractedData // Structured extracted data
  annotations: ContentAnnotation[] // AI-generated annotations
  preview: string // Human-readable preview
}

export interface ExtractedData {
  text?: string
  structuredData?: Record<string, any>
  visualElements?: VisualElement[]
  audioSegments?: AudioSegment[]
  metadata?: ContentMetadata
}

export interface ContentAnnotation {
  type: 'highlight' | 'note' | 'warning' | 'suggestion'
  content: string
  location?: string // page number, timestamp, etc.
  confidence: number
}

export interface VisualElement {
  type: 'chart' | 'table' | 'diagram' | 'handwriting' | 'form'
  description: string
  location: string
  extractedData?: any
}

export interface AudioSegment {
  startTime: number
  endTime: number
  text: string
  confidence: number
  speaker?: string
}

export interface FileMetadata {
  originalName: string
  processedAt: string
  processingDuration: number
  fileHash?: string
  dimensions?: { width: number; height: number }
  duration?: number // for audio/video
  pageCount?: number // for PDFs
  language?: string
  encoding?: string
}

export interface SourceReference {
  type: 'page' | 'timestamp' | 'line' | 'section'
  location: string
  content: string
  confidence: number
}

export interface ContentMetadata {
  language?: string
  readingLevel?: string
  topics?: string[]
  entities?: Array<{ name: string; type: string; confidence: number }>
}

export type FileType = 'PDF' | 'IMAGE' | 'AUDIO' | 'TEXT'
export type ProcessingMethod = 'claude-document' | 'claude-vision' | 'whisper-transcription' | 'text-extraction'

export interface FileValidationResult {
  isValid: boolean
  fileType?: FileType
  error?: string
  warnings: string[]
  estimatedProcessingTime?: number
}

export interface ProcessingProgress {
  fileId: string
  fileName: string
  stage: ProcessingStage
  progress: number // 0-100
  estimatedTimeRemaining?: number
  currentOperation?: string
}

export type ProcessingStage = 'validating' | 'uploading' | 'processing' | 'extracting' | 'analyzing' | 'completed' | 'failed'

export interface ProcessingOptions {
  enableOCR: boolean
  enableImageAnalysis: boolean
  enableAudioTranscription: boolean
  confidenceThreshold: number
  extractStructuredData: boolean
  generateAnnotations: boolean
  preserveFormatting: boolean
  language?: string
}

export class EnhancedFileProcessor {
  private processingProgress: Map<string, ProcessingProgress> = new Map()
  private progressListeners: Array<(progress: ProcessingProgress) => void> = []

  /**
   * Validates a file for processing
   */
  validateFile(file: File): FileValidationResult {
    const warnings: string[] = []
    
    // Determine file type
    const fileType = this.detectFileType(file)
    if (!fileType) {
      return {
        isValid: false,
        error: `Unsupported file type: ${file.type}. Supported types: PDF, Images (JPEG, PNG, WebP, GIF), Audio (MP3, WAV, M4A, OGG, FLAC), Text (TXT, CSV, HTML, MD, JSON)`,
        warnings
      }
    }

    // Check file size
    const limits = ENHANCED_FILE_LIMITS[fileType]
    if (file.size > limits.maxSize) {
      const sizeMB = Math.round(limits.maxSize / (1024 * 1024))
      return {
        isValid: false,
        error: `File size exceeds limit. Maximum size for ${fileType} files: ${sizeMB}MB`,
        warnings
      }
    }

    // File-specific validations
    if (fileType === 'PDF') {
      const estimatedPages = this.estimatePDFPageCount(file)
      if (estimatedPages > ENHANCED_FILE_LIMITS.PDF.maxPages) {
        return {
          isValid: false,
          error: `PDF appears to have ~${estimatedPages} pages. Claude supports PDFs up to ${ENHANCED_FILE_LIMITS.PDF.maxPages} pages for visual analysis.`,
          warnings
        }
      }
      if (estimatedPages > 50) {
        warnings.push(`Large PDF detected (~${estimatedPages} pages). Processing may take longer.`)
      }
    }

    // Estimate processing time
    const estimatedTime = this.estimateProcessingTime(file, fileType)
    if (estimatedTime > 60) {
      warnings.push(`Estimated processing time: ${Math.round(estimatedTime / 60)} minutes`)
    }

    return {
      isValid: true,
      fileType,
      warnings,
      estimatedProcessingTime: estimatedTime
    }
  }

  /**
   * Processes a single file with comprehensive analysis
   */
  async processFile(file: File, options: Partial<ProcessingOptions> = {}): Promise<ProcessedFile> {
    const fileId = this.generateFileId()
    const startTime = Date.now()
    
    // Set default options
    const processingOptions: ProcessingOptions = {
      enableOCR: true,
      enableImageAnalysis: true,
      enableAudioTranscription: true,
      confidenceThreshold: 0.7,
      extractStructuredData: true,
      generateAnnotations: true,
      preserveFormatting: true,
      ...options
    }

    // Initialize progress tracking
    this.updateProgress(fileId, {
      fileId,
      fileName: file.name,
      stage: 'validating',
      progress: 0
    })

    try {
      // Validate file
      const validation = this.validateFile(file)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      this.updateProgress(fileId, { stage: 'processing', progress: 20 })

      // Process based on file type
      let processedFile: ProcessedFile
      switch (validation.fileType!) {
        case 'PDF':
          processedFile = await this.processPDF(file, processingOptions, fileId)
          break
        case 'IMAGE':
          processedFile = await this.processImage(file, processingOptions, fileId)
          break
        case 'AUDIO':
          processedFile = await this.processAudio(file, processingOptions, fileId)
          break
        case 'TEXT':
          processedFile = await this.processText(file, processingOptions, fileId)
          break
        default:
          throw new Error(`Unsupported file type: ${validation.fileType}`)
      }

      this.updateProgress(fileId, { stage: 'completed', progress: 100 })

      return {
        ...processedFile,
        processingTime: Date.now() - startTime
      }

    } catch (error) {
      this.updateProgress(fileId, { stage: 'failed', progress: 0 })
      throw new Error(`Failed to process file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Processes multiple files in parallel with progress tracking
   */
  async processFiles(files: File[], options: Partial<ProcessingOptions> = {}): Promise<{
    successful: ProcessedFile[]
    failed: Array<{ file: File; error: string }>
    totalProcessingTime: number
  }> {
    const startTime = Date.now()
    const successful: ProcessedFile[] = []
    const failed: Array<{ file: File; error: string }> = []

    console.log(`🚀 [EnhancedFileProcessor] Processing ${files.length} files`)

    // Process files in parallel (with concurrency limit)
    const concurrencyLimit = 3
    const chunks = this.chunkArray(files, concurrencyLimit)

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (file) => {
        try {
          const processed = await this.processFile(file, options)
          successful.push(processed)
          console.log(`✅ [EnhancedFileProcessor] Successfully processed: ${file.name}`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          failed.push({ file, error: errorMessage })
          console.error(`❌ [EnhancedFileProcessor] Failed to process: ${file.name} - ${errorMessage}`)
        }
      })

      await Promise.all(chunkPromises)
    }

    const totalProcessingTime = Date.now() - startTime
    console.log(`🎉 [EnhancedFileProcessor] Completed: ${successful.length} successful, ${failed.length} failed (${totalProcessingTime}ms)`)

    return {
      successful,
      failed,
      totalProcessingTime
    }
  }

  /**
   * Processes PDF files using Claude's document processing
   */
  private async processPDF(file: File, options: ProcessingOptions, fileId: string): Promise<ProcessedFile> {
    this.updateProgress(fileId, { stage: 'processing', progress: 30, currentOperation: 'Converting PDF to base64' })

    const base64Content = await this.fileToBase64(file)
    const pageCount = this.estimatePDFPageCount(file)

    this.updateProgress(fileId, { stage: 'processing', progress: 50, currentOperation: 'Analyzing with Claude' })

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.1,
      messages: [{
        role: 'user',
        content: [{
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64Content
          },
          title: file.name
        }, {
          type: 'text',
          text: `Analyze this PDF document and extract all relevant assessment information. Focus on:
          1. Test scores and standardized assessment results
          2. Student demographic and background information
          3. Clinical observations and findings
          4. Recommendations and service needs
          5. Any structured data, forms, or tables
          
          Provide a comprehensive analysis with confidence scores for extracted information.`
        }]
      }]
    })

    this.updateProgress(fileId, { stage: 'extracting', progress: 80, currentOperation: 'Extracting structured data' })

    const extractedData = this.parseClaudeResponse(response)
    const annotations = this.generateAnnotations(response, 'pdf')

    return {
      id: fileId,
      name: file.name,
      type: 'PDF',
      size: file.size,
      processingMethod: 'claude-document',
      content: {
        raw: base64Content,
        extracted: extractedData,
        annotations,
        preview: this.generatePreview(extractedData, 'pdf')
      },
      confidence: this.calculateConfidence(response),
      metadata: {
        originalName: file.name,
        processedAt: new Date().toISOString(),
        processingDuration: 0, // Will be set by caller
        pageCount,
        fileHash: await this.generateFileHash(file)
      },
      sourceReferences: this.extractSourceReferences(response, file.name, 'pdf'),
      processingTime: 0, // Will be set by caller
      errors: []
    }
  }

  /**
   * Processes image files using Claude's vision capabilities
   */
  private async processImage(file: File, options: ProcessingOptions, fileId: string): Promise<ProcessedFile> {
    this.updateProgress(fileId, { stage: 'processing', progress: 30, currentOperation: 'Converting image to base64' })

    const base64Content = await this.fileToBase64(file)
    const dimensions = await this.getImageDimensions(file)

    this.updateProgress(fileId, { stage: 'processing', progress: 50, currentOperation: 'Analyzing with Claude Vision' })

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.1,
      messages: [{
        role: 'user',
        content: [{
          type: 'image',
          source: {
            type: 'base64',
            media_type: file.type,
            data: base64Content
          }
        }, {
          type: 'text',
          text: `Analyze this image for assessment-related information including:
          1. Test scores, charts, or graphs
          2. Handwritten notes or observations
          3. Forms or structured data
          4. Visual assessments or drawings
          5. Any text content (OCR)
          
          Extract all relevant information with confidence scores and location references.`
        }]
      }]
    })

    this.updateProgress(fileId, { stage: 'extracting', progress: 80, currentOperation: 'Extracting visual elements' })

    const extractedData = this.parseClaudeResponse(response)
    const annotations = this.generateAnnotations(response, 'image')

    return {
      id: fileId,
      name: file.name,
      type: 'IMAGE',
      size: file.size,
      processingMethod: 'claude-vision',
      content: {
        raw: base64Content,
        extracted: extractedData,
        annotations,
        preview: this.generatePreview(extractedData, 'image')
      },
      confidence: this.calculateConfidence(response),
      metadata: {
        originalName: file.name,
        processedAt: new Date().toISOString(),
        processingDuration: 0,
        dimensions,
        fileHash: await this.generateFileHash(file)
      },
      sourceReferences: this.extractSourceReferences(response, file.name, 'image'),
      processingTime: 0,
      errors: []
    }
  }

  /**
   * Processes audio files using OpenAI Whisper
   */
  private async processAudio(file: File, options: ProcessingOptions, fileId: string): Promise<ProcessedFile> {
    this.updateProgress(fileId, { stage: 'processing', progress: 30, currentOperation: 'Transcribing audio with Whisper' })

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: options.language || 'en',
      response_format: 'verbose_json',
      timestamp_granularities: ['word', 'segment']
    })

    this.updateProgress(fileId, { stage: 'processing', progress: 60, currentOperation: 'Analyzing transcript with Claude' })

    // Process transcription with Claude for structured extraction
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.1,
      messages: [{
        role: 'user',
        content: [{
          type: 'text',
          text: `Analyze this audio transcription from an assessment session and extract relevant information:

TRANSCRIPT:
${transcription.text}

Extract and structure:
1. Assessment observations and findings
2. Test administration notes
3. Student responses and behaviors
4. Clinical impressions
5. Any mentioned scores or measurements

Provide confidence scores and timestamp references where possible.`
        }]
      }]
    })

    this.updateProgress(fileId, { stage: 'extracting', progress: 80, currentOperation: 'Processing audio segments' })

    const extractedData = this.parseClaudeResponse(response)
    const audioSegments = this.processAudioSegments(transcription)
    const annotations = this.generateAnnotations(response, 'audio')

    return {
      id: fileId,
      name: file.name,
      type: 'AUDIO',
      size: file.size,
      processingMethod: 'whisper-transcription',
      content: {
        raw: transcription.text,
        extracted: {
          ...extractedData,
          audioSegments
        },
        annotations,
        preview: this.generatePreview(extractedData, 'audio')
      },
      confidence: this.calculateTranscriptionConfidence(transcription),
      metadata: {
        originalName: file.name,
        processedAt: new Date().toISOString(),
        processingDuration: 0,
        duration: transcription.duration,
        language: transcription.language,
        fileHash: await this.generateFileHash(file)
      },
      sourceReferences: this.extractAudioReferences(transcription, file.name),
      processingTime: 0,
      errors: []
    }
  }

  /**
   * Processes text files with direct analysis
   */
  private async processText(file: File, options: ProcessingOptions, fileId: string): Promise<ProcessedFile> {
    this.updateProgress(fileId, { stage: 'processing', progress: 30, currentOperation: 'Reading text content' })

    const textContent = await this.readTextFile(file)

    this.updateProgress(fileId, { stage: 'processing', progress: 50, currentOperation: 'Analyzing with Claude' })

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.1,
      messages: [{
        role: 'user',
        content: [{
          type: 'text',
          text: `Analyze this text content for assessment-related information:

CONTENT:
${textContent}

Extract and structure any relevant:
1. Assessment data and observations
2. Test scores or measurements
3. Student information
4. Clinical notes
5. Recommendations or findings

Provide structured data with confidence scores.`
        }]
      }]
    })

    this.updateProgress(fileId, { stage: 'extracting', progress: 80, currentOperation: 'Extracting structured data' })

    const extractedData = this.parseClaudeResponse(response)
    const annotations = this.generateAnnotations(response, 'text')

    return {
      id: fileId,
      name: file.name,
      type: 'TEXT',
      size: file.size,
      processingMethod: 'text-extraction',
      content: {
        raw: textContent,
        extracted: extractedData,
        annotations,
        preview: this.generatePreview(extractedData, 'text')
      },
      confidence: this.calculateConfidence(response),
      metadata: {
        originalName: file.name,
        processedAt: new Date().toISOString(),
        processingDuration: 0,
        encoding: 'utf-8',
        fileHash: await this.generateFileHash(file)
      },
      sourceReferences: this.extractSourceReferences(response, file.name, 'text'),
      processingTime: 0,
      errors: []
    }
  }

  // Helper methods
  private detectFileType(file: File): FileType | null {
    if (ENHANCED_FILE_LIMITS.PDF.supportedTypes.includes(file.type)) return 'PDF'
    if (ENHANCED_FILE_LIMITS.IMAGE.supportedTypes.includes(file.type)) return 'IMAGE'
    if (ENHANCED_FILE_LIMITS.AUDIO.supportedTypes.includes(file.type)) return 'AUDIO'
    if (ENHANCED_FILE_LIMITS.TEXT.supportedTypes.includes(file.type)) return 'TEXT'
    return null
  }

  private estimatePDFPageCount(file: File): number {
    // Rough estimate: 50KB per page for typical text PDFs
    const avgPageSize = 50 * 1024
    return Math.ceil(file.size / avgPageSize)
  }

  private estimateProcessingTime(file: File, fileType: FileType): number {
    // Estimate in seconds based on file type and size
    const sizeMB = file.size / (1024 * 1024)
    
    switch (fileType) {
      case 'PDF':
        return Math.max(10, sizeMB * 2) // 2 seconds per MB, minimum 10 seconds
      case 'IMAGE':
        return Math.max(5, sizeMB * 1.5) // 1.5 seconds per MB, minimum 5 seconds
      case 'AUDIO':
        return Math.max(15, sizeMB * 3) // 3 seconds per MB, minimum 15 seconds (transcription is slow)
      case 'TEXT':
        return Math.max(3, sizeMB * 0.5) // 0.5 seconds per MB, minimum 3 seconds
      default:
        return 10
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = () => reject(new Error('Failed to convert file to base64'))
      reader.readAsDataURL(file)
    })
  }

  private async readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read text file'))
      reader.readAsText(file)
    })
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.width, height: img.height })
      img.onerror = () => resolve({ width: 0, height: 0 })
      img.src = URL.createObjectURL(file)
    })
  }

  private async generateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  private updateProgress(fileId: string, update: Partial<ProcessingProgress>): void {
    const current = this.processingProgress.get(fileId) || {
      fileId,
      fileName: '',
      stage: 'validating' as ProcessingStage,
      progress: 0
    }
    
    const updated = { ...current, ...update }
    this.processingProgress.set(fileId, updated)
    
    // Notify listeners
    this.progressListeners.forEach(listener => {
      try {
        listener(updated)
      } catch (error) {
        console.error('Error in progress listener:', error)
      }
    })
  }

  // Placeholder methods for parsing and analysis (to be implemented based on specific needs)
  private parseClaudeResponse(response: any): ExtractedData {
    // Implementation would parse Claude's response and extract structured data
    return {
      text: response.content[0]?.text || '',
      structuredData: {},
      metadata: {}
    }
  }

  private generateAnnotations(response: any, fileType: string): ContentAnnotation[] {
    // Implementation would generate annotations based on Claude's analysis
    return []
  }

  private generatePreview(data: ExtractedData, fileType: string): string {
    return data.text?.substring(0, 200) + '...' || 'No preview available'
  }

  private calculateConfidence(response: any): number {
    // Implementation would calculate confidence based on Claude's response
    return 0.8
  }

  private calculateTranscriptionConfidence(transcription: any): number {
    // Implementation would calculate confidence based on Whisper's response
    return transcription.segments?.reduce((avg: number, seg: any) => avg + (seg.avg_logprob || 0), 0) / (transcription.segments?.length || 1) || 0.8
  }

  private extractSourceReferences(response: any, fileName: string, fileType: string): SourceReference[] {
    // Implementation would extract source references from Claude's response
    return []
  }

  private extractAudioReferences(transcription: any, fileName: string): SourceReference[] {
    // Implementation would extract timestamp references from Whisper's response
    return transcription.segments?.map((seg: any, index: number) => ({
      type: 'timestamp' as const,
      location: `${Math.floor(seg.start)}:${Math.floor((seg.start % 1) * 60).toString().padStart(2, '0')}-${Math.floor(seg.end)}:${Math.floor((seg.end % 1) * 60).toString().padStart(2, '0')}`,
      content: seg.text,
      confidence: seg.avg_logprob || 0.8
    })) || []
  }

  private processAudioSegments(transcription: any): AudioSegment[] {
    return transcription.segments?.map((seg: any) => ({
      startTime: seg.start,
      endTime: seg.end,
      text: seg.text,
      confidence: seg.avg_logprob || 0.8,
      speaker: undefined // Whisper doesn't provide speaker identification
    })) || []
  }

  // Public methods for progress tracking
  addProgressListener(listener: (progress: ProcessingProgress) => void): void {
    this.progressListeners.push(listener)
  }

  removeProgressListener(listener: (progress: ProcessingProgress) => void): void {
    const index = this.progressListeners.indexOf(listener)
    if (index > -1) {
      this.progressListeners.splice(index, 1)
    }
  }

  getProcessingProgress(fileId: string): ProcessingProgress | undefined {
    return this.processingProgress.get(fileId)
  }
}

// Singleton instance for global use
export const enhancedFileProcessor = new EnhancedFileProcessor()