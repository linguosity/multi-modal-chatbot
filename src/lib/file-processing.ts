import OpenAI from 'openai';
import { fromBuffer } from 'pdf2pic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  PDF: 10 * 1024 * 1024, // 10MB
  IMAGE: 5 * 1024 * 1024, // 5MB
  AUDIO: 25 * 1024 * 1024, // 25MB (OpenAI Whisper limit)
};

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  PDF: ['application/pdf'],
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  AUDIO: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/flac'],
};

export interface ProcessedFile {
  name: string;
  type: string;
  size: number;
  content: string;
  processingMethod: 'pdf-parse' | 'claude-vision' | 'whisper-transcription';
  confidence?: number;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: 'PDF' | 'IMAGE' | 'AUDIO';
}

/**
 * Validates file type and size
 */
export function validateFile(file: File): FileValidationResult {
  // Check file type
  let fileType: 'PDF' | 'IMAGE' | 'AUDIO' | undefined;
  
  if (SUPPORTED_FILE_TYPES.PDF.includes(file.type)) {
    fileType = 'PDF';
  } else if (SUPPORTED_FILE_TYPES.IMAGE.includes(file.type)) {
    fileType = 'IMAGE';
  } else if (SUPPORTED_FILE_TYPES.AUDIO.includes(file.type)) {
    fileType = 'AUDIO';
  } else {
    return {
      isValid: false,
      error: `Unsupported file type: ${file.type}. Supported types: PDF, Images (JPEG, PNG, WebP, GIF), Audio (MP3, WAV, M4A, OGG, FLAC)`
    };
  }

  // Check file size
  const sizeLimit = FILE_SIZE_LIMITS[fileType];
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
 * Extracts text content from PDF files
 */
export async function extractPDFText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  const validation = validateFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const processedFile: ProcessedFile = {
    name: file.name,
    type: file.type,
    size: file.size,
    content: '',
    processingMethod: 'pdf-parse', // Will be updated based on actual processing
  };

  try {
    switch (validation.fileType) {
      case 'PDF':
        processedFile.content = await extractPDFText(file);
        processedFile.processingMethod = 'pdf-parse';
        break;
      
      case 'IMAGE':
        // For images, we'll return the base64 data and let Claude Vision handle it
        // The actual OCR will happen in the Claude API call
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
      // For images, add as image content for Claude Vision
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: file.type,
          data: file.content
        }
      });
    } else {
      // For PDF and audio, add as text content
      const methodLabel = file.processingMethod === 'pdf-parse' ? 'PDF' : 'Audio Transcript';
      content.push({
        type: "text",
        text: `${methodLabel} from ${file.name}:\n${file.content}`
      });
    }
  }

  return content;
}