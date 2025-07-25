import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// File size limits (in bytes) - Updated to match Claude API limits
export const FILE_SIZE_LIMITS = {
  PDF: 32 * 1024 * 1024, // 32MB (Claude API limit)
  IMAGE: 30 * 1024 * 1024, // 30MB (Claude API limit)
  AUDIO: 25 * 1024 * 1024, // 25MB (OpenAI Whisper limit)
};

// Supported file types - Expanded to match Claude API support
export const SUPPORTED_FILE_TYPES = {
  PDF: ['application/pdf'],
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  AUDIO: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/flac'],
  DOCUMENT: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/csv', 'text/plain', 'text/html']
};

// PDF processing limits
export const PDF_LIMITS = {
  MAX_PAGES: 100, // Claude API limit for visual PDF analysis
  MAX_SIZE: 32 * 1024 * 1024, // 32MB
};

export interface ProcessedFile {
  name: string;
  type: string;
  size: number;
  content: string; // Base64 content for all file types
  processingMethod: 'claude-pdf' | 'claude-vision' | 'whisper-transcription';
  confidence?: number;
  pageCount?: number; // For PDFs
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: 'PDF' | 'IMAGE' | 'AUDIO' | 'DOCUMENT';
}

/**
 * Validates file type and size
 */
export function validateFile(file: File): FileValidationResult {
  // Check file type
  let fileType: 'PDF' | 'IMAGE' | 'AUDIO' | 'DOCUMENT' | undefined;
  
  if (SUPPORTED_FILE_TYPES.PDF.includes(file.type)) {
    fileType = 'PDF';
  } else if (SUPPORTED_FILE_TYPES.IMAGE.includes(file.type)) {
    fileType = 'IMAGE';
  } else if (SUPPORTED_FILE_TYPES.AUDIO.includes(file.type)) {
    fileType = 'AUDIO';
  } else if (SUPPORTED_FILE_TYPES.DOCUMENT.includes(file.type)) {
    fileType = 'DOCUMENT';
  } else {
    return {
      isValid: false,
      error: `Unsupported file type: ${file.type}. Supported types: PDF, Images (JPEG, PNG, WebP, GIF), Audio (MP3, WAV, M4A, OGG, FLAC), Documents (DOCX, CSV, TXT, HTML)`
    };
  }

  // Check file size
  const sizeLimit = fileType === 'DOCUMENT' ? FILE_SIZE_LIMITS.PDF : FILE_SIZE_LIMITS[fileType];
  if (file.size > sizeLimit) {
    const sizeMB = Math.round(sizeLimit / (1024 * 1024));
    return {
      isValid: false,
      error: `File size exceeds limit. Maximum size for ${fileType} files: ${sizeMB}MB`
    };
  }

  return { isValid: true, fileType };
}

/**
 * Estimates PDF page count (rough approximation based on file size)
 * For more accurate count, would need to parse PDF structure
 */
export function estimatePDFPageCount(file: File): number {
  // Rough estimate: 50KB per page for typical text PDFs
  // This is very approximate - actual parsing would be more accurate
  const avgPageSize = 50 * 1024; // 50KB
  return Math.ceil(file.size / avgPageSize);
}

/**
 * Validates PDF-specific constraints
 */
export function validatePDF(file: File): FileValidationResult {
  const basicValidation = validateFile(file);
  if (!basicValidation.isValid) return basicValidation;

  // Check page count estimate
  const estimatedPages = estimatePDFPageCount(file);
  if (estimatedPages > PDF_LIMITS.MAX_PAGES) {
    return {
      isValid: false,
      error: `PDF appears to have ~${estimatedPages} pages. Claude supports PDFs up to ${PDF_LIMITS.MAX_PAGES} pages for visual analysis. Consider splitting the document.`
    };
  }

  return { isValid: true, fileType: 'PDF' };
}

/**
 * Converts PDF to base64 for direct Claude API consumption
 */
export async function processPDFDirect(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (error) {
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


/**
 * Converts file to base64 for Claude Vision API
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to convert file to base64'));
    reader.readAsDataURL(file);
  });
}

/**
 * Transcribes audio files using OpenAI Whisper
 */
export async function transcribeAudio(file: File): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en', // Can be made configurable
      response_format: 'text',
    });

    return transcription;
  } catch (error) {
    throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Processes a single file and returns extracted content
 */
export async function processFile(file: File): Promise<ProcessedFile> {
  let validation: FileValidationResult;
  
  // Use PDF-specific validation for PDFs
  if (file.type === 'application/pdf') {
    validation = validatePDF(file);
  } else {
    validation = validateFile(file);
  }
  
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const processedFile: ProcessedFile = {
    name: file.name,
    type: file.type,
    size: file.size,
    content: '',
    processingMethod: 'claude-pdf', // Default, will be updated
  };

  try {
    switch (validation.fileType) {
      case 'PDF':
      case 'DOCUMENT':
        processedFile.content = await processPDFDirect(file);
        processedFile.processingMethod = 'claude-pdf';
        if (file.type === 'application/pdf') {
          processedFile.pageCount = estimatePDFPageCount(file);
        }
        break;
      
      case 'IMAGE':
        processedFile.content = await fileToBase64(file);
        processedFile.processingMethod = 'claude-vision';
        break;
      
      case 'AUDIO':
        processedFile.content = await transcribeAudio(file);
        processedFile.processingMethod = 'whisper-transcription';
        break;
      
      default:
        throw new Error(`Unsupported file type: ${validation.fileType}`);
    }

    return processedFile;
  } catch (error) {
    throw new Error(`Failed to process file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Processes multiple files and returns array of processed content
 */
export async function processMultipleFiles(files: File[]): Promise<ProcessedFile[]> {
  const results: ProcessedFile[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      const processed = await processFile(file);
      results.push(processed);
    } catch (error) {
      errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  if (errors.length > 0 && results.length === 0) {
    throw new Error(`Failed to process any files:\n${errors.join('\n')}`);
  }

  return results;
}

/**
 * Converts processed files to Claude message content format
 */
export function filesToClaudeContent(processedFiles: ProcessedFile[]): Array<{ type: string; source?: any; text?: string }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const content: Array<{ type: string; source?: any; text?: string }> = []; // eslint-disable-line @typescript-eslint/no-explicit-any

  for (const file of processedFiles) {
    if (file.processingMethod === 'claude-vision') {
      // Direct image support
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: file.type,
          data: file.content
        }
      });
    } else if (file.processingMethod === 'claude-pdf') {
      // For now, use text content with base64 data until document type is confirmed
      const pageInfo = file.pageCount ? ` (~${file.pageCount} pages)` : '';
      content.push({
        type: "text",
        text: `PDF Document: ${file.name}${pageInfo}\n\nBase64 Content: ${file.content.substring(0, 100)}...`
      });
    } else if (file.processingMethod === 'whisper-transcription') {
      // Audio transcript
      content.push({
        type: "text",
        text: `Audio Transcript from ${file.name}:\n${file.content}`
      });
    }
  }

  return content;
}