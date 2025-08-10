import { EnhancedFileProcessor, ENHANCED_FILE_LIMITS } from '../enhanced-file-processor'

// Mock Anthropic
const mockAnthropic = {
  messages: {
    create: jest.fn()
  }
}

// Mock OpenAI
const mockOpenAI = {
  audio: {
    transcriptions: {
      create: jest.fn()
    }
  }
}

// Mock the AI clients
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn(() => mockAnthropic)
})

jest.mock('openai', () => {
  return jest.fn(() => mockOpenAI)
})

// Mock crypto for file hashing
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: jest.fn(() => Promise.resolve(new ArrayBuffer(32)))
    }
  }
})

// Mock Image constructor
global.Image = class {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  width = 1920
  height = 1080
  
  set src(value: string) {
    setTimeout(() => {
      if (this.onload) this.onload()
    }, 0)
  }
} as any

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url')

describe('EnhancedFileProcessor', () => {
  let processor: EnhancedFileProcessor

  beforeEach(() => {
    processor = new EnhancedFileProcessor()
    jest.clearAllMocks()
  })

  describe('validateFile', () => {
    test('should validate PDF files correctly', () => {
      const mockPDFFile = new File(['mock pdf content'], 'test.pdf', {
        type: 'application/pdf'
      })
      Object.defineProperty(mockPDFFile, 'size', { value: 1024 * 1024 }) // 1MB

      const result = processor.validateFile(mockPDFFile)

      expect(result.isValid).toBe(true)
      expect(result.fileType).toBe('PDF')
      expect(result.warnings).toBeDefined()
    })

    test('should reject oversized files', () => {
      const mockLargeFile = new File(['mock content'], 'large.pdf', {
        type: 'application/pdf'
      })
      Object.defineProperty(mockLargeFile, 'size', { 
        value: ENHANCED_FILE_LIMITS.PDF.maxSize + 1 
      })

      const result = processor.validateFile(mockLargeFile)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('File size exceeds limit')
    })

    test('should reject unsupported file types', () => {
      const mockUnsupportedFile = new File(['mock content'], 'test.xyz', {
        type: 'application/xyz'
      })

      const result = processor.validateFile(mockUnsupportedFile)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Unsupported file type')
    })

    test('should validate image files correctly', () => {
      const mockImageFile = new File(['mock image'], 'test.jpg', {
        type: 'image/jpeg'
      })
      Object.defineProperty(mockImageFile, 'size', { value: 1024 * 1024 }) // 1MB

      const result = processor.validateFile(mockImageFile)

      expect(result.isValid).toBe(true)
      expect(result.fileType).toBe('IMAGE')
    })

    test('should validate audio files correctly', () => {
      const mockAudioFile = new File(['mock audio'], 'test.mp3', {
        type: 'audio/mpeg'
      })
      Object.defineProperty(mockAudioFile, 'size', { value: 1024 * 1024 }) // 1MB

      const result = processor.validateFile(mockAudioFile)

      expect(result.isValid).toBe(true)
      expect(result.fileType).toBe('AUDIO')
    })

    test('should validate text files correctly', () => {
      const mockTextFile = new File(['mock text content'], 'test.txt', {
        type: 'text/plain'
      })
      Object.defineProperty(mockTextFile, 'size', { value: 1024 }) // 1KB

      const result = processor.validateFile(mockTextFile)

      expect(result.isValid).toBe(true)
      expect(result.fileType).toBe('TEXT')
    })

    test('should warn about large PDFs', () => {
      const mockLargePDF = new File(['mock pdf content'], 'large.pdf', {
        type: 'application/pdf'
      })
      // Size that would estimate to ~60 pages
      Object.defineProperty(mockLargePDF, 'size', { value: 60 * 50 * 1024 })

      const result = processor.validateFile(mockLargePDF)

      expect(result.isValid).toBe(true)
      expect(result.warnings.some(w => w.includes('Large PDF detected'))).toBe(true)
    })
  })

  describe('processFile', () => {
    test('should process PDF files successfully', async () => {
      const mockPDFFile = new File(['mock pdf content'], 'test.pdf', {
        type: 'application/pdf'
      })
      Object.defineProperty(mockPDFFile, 'size', { value: 1024 * 1024 })

      // Mock Claude response
      mockAnthropic.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Analyzed PDF content with test scores and observations.' }]
      })

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        result: 'data:application/pdf;base64,bW9jayBwZGYgY29udGVudA==',
        onload: null as any,
        onerror: null as any
      }
      
      global.FileReader = jest.fn(() => mockFileReader) as any
      
      // Trigger onload after a short delay
      setTimeout(() => {
        if (mockFileReader.onload) mockFileReader.onload()
      }, 0)

      const result = await processor.processFile(mockPDFFile)

      expect(result.type).toBe('PDF')
      expect(result.processingMethod).toBe('claude-document')
      expect(result.name).toBe('test.pdf')
      expect(result.confidence).toBeGreaterThan(0)
      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-5-sonnet-20241022',
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'document'
                })
              ])
            })
          ])
        })
      )
    })

    test('should process image files successfully', async () => {
      const mockImageFile = new File(['mock image'], 'test.jpg', {
        type: 'image/jpeg'
      })
      Object.defineProperty(mockImageFile, 'size', { value: 1024 * 1024 })

      // Mock Claude response
      mockAnthropic.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Analyzed image with visual elements and text.' }]
      })

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        result: 'data:image/jpeg;base64,bW9jayBpbWFnZQ==',
        onload: null as any,
        onerror: null as any
      }
      
      global.FileReader = jest.fn(() => mockFileReader) as any
      
      setTimeout(() => {
        if (mockFileReader.onload) mockFileReader.onload()
      }, 0)

      const result = await processor.processFile(mockImageFile)

      expect(result.type).toBe('IMAGE')
      expect(result.processingMethod).toBe('claude-vision')
      expect(result.metadata.dimensions).toEqual({ width: 1920, height: 1080 })
      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'image'
                })
              ])
            })
          ])
        })
      )
    })

    test('should process audio files successfully', async () => {
      const mockAudioFile = new File(['mock audio'], 'test.mp3', {
        type: 'audio/mpeg'
      })
      Object.defineProperty(mockAudioFile, 'size', { value: 1024 * 1024 })

      // Mock Whisper response
      mockOpenAI.audio.transcriptions.create.mockResolvedValue({
        text: 'This is a transcribed audio content with assessment observations.',
        duration: 120,
        language: 'en',
        segments: [
          {
            start: 0,
            end: 5,
            text: 'This is a transcribed audio content',
            avg_logprob: -0.2
          },
          {
            start: 5,
            end: 10,
            text: 'with assessment observations.',
            avg_logprob: -0.3
          }
        ]
      })

      // Mock Claude response
      mockAnthropic.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Analyzed transcript and extracted assessment data.' }]
      })

      const result = await processor.processFile(mockAudioFile)

      expect(result.type).toBe('AUDIO')
      expect(result.processingMethod).toBe('whisper-transcription')
      expect(result.metadata.duration).toBe(120)
      expect(result.content.extracted.audioSegments).toHaveLength(2)
      expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          file: mockAudioFile,
          model: 'whisper-1',
          response_format: 'verbose_json'
        })
      )
    })

    test('should process text files successfully', async () => {
      const mockTextFile = new File(['Mock text content with assessment data'], 'test.txt', {
        type: 'text/plain'
      })
      Object.defineProperty(mockTextFile, 'size', { value: 1024 })

      // Mock Claude response
      mockAnthropic.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Analyzed text content and extracted structured data.' }]
      })

      // Mock FileReader for text
      const mockFileReader = {
        readAsText: jest.fn(),
        result: 'Mock text content with assessment data',
        onload: null as any,
        onerror: null as any
      }
      
      global.FileReader = jest.fn(() => mockFileReader) as any
      
      setTimeout(() => {
        if (mockFileReader.onload) mockFileReader.onload()
      }, 0)

      const result = await processor.processFile(mockTextFile)

      expect(result.type).toBe('TEXT')
      expect(result.processingMethod).toBe('text-extraction')
      expect(result.content.raw).toBe('Mock text content with assessment data')
    })

    test('should handle processing errors gracefully', async () => {
      const mockFile = new File(['mock content'], 'test.pdf', {
        type: 'application/pdf'
      })
      Object.defineProperty(mockFile, 'size', { value: 1024 })

      // Mock Claude to throw an error
      mockAnthropic.messages.create.mockRejectedValue(new Error('API Error'))

      await expect(processor.processFile(mockFile)).rejects.toThrow('Failed to process file test.pdf')
    })
  })

  describe('processFiles', () => {
    test('should process multiple files in parallel', async () => {
      const mockFiles = [
        new File(['pdf content'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['image content'], 'test2.jpg', { type: 'image/jpeg' }),
        new File(['text content'], 'test3.txt', { type: 'text/plain' })
      ]

      mockFiles.forEach(file => {
        Object.defineProperty(file, 'size', { value: 1024 })
      })

      // Mock successful responses
      mockAnthropic.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Successful analysis' }]
      })

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        readAsText: jest.fn(),
        result: 'mock-result',
        onload: null as any,
        onerror: null as any
      }
      
      global.FileReader = jest.fn(() => mockFileReader) as any
      
      setTimeout(() => {
        if (mockFileReader.onload) mockFileReader.onload()
      }, 0)

      const result = await processor.processFiles(mockFiles)

      expect(result.successful).toHaveLength(3)
      expect(result.failed).toHaveLength(0)
      expect(result.totalProcessingTime).toBeGreaterThan(0)
    })

    test('should handle partial failures', async () => {
      const mockFiles = [
        new File(['pdf content'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['invalid content'], 'test2.xyz', { type: 'application/xyz' })
      ]

      mockFiles.forEach(file => {
        Object.defineProperty(file, 'size', { value: 1024 })
      })

      mockAnthropic.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Successful analysis' }]
      })

      const mockFileReader = {
        readAsDataURL: jest.fn(),
        result: 'mock-result',
        onload: null as any,
        onerror: null as any
      }
      
      global.FileReader = jest.fn(() => mockFileReader) as any
      
      setTimeout(() => {
        if (mockFileReader.onload) mockFileReader.onload()
      }, 0)

      const result = await processor.processFiles(mockFiles)

      expect(result.successful).toHaveLength(1)
      expect(result.failed).toHaveLength(1)
      expect(result.failed[0].error).toContain('Unsupported file type')
    })
  })

  describe('progress tracking', () => {
    test('should track processing progress', (done) => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(mockFile, 'size', { value: 1024 })

      let progressUpdates: any[] = []

      processor.addProgressListener((progress) => {
        progressUpdates.push(progress)
        
        if (progress.stage === 'completed') {
          expect(progressUpdates.length).toBeGreaterThan(1)
          expect(progressUpdates[0].stage).toBe('validating')
          expect(progressUpdates[progressUpdates.length - 1].stage).toBe('completed')
          expect(progressUpdates[progressUpdates.length - 1].progress).toBe(100)
          done()
        }
      })

      mockAnthropic.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Success' }]
      })

      const mockFileReader = {
        readAsDataURL: jest.fn(),
        result: 'mock-result',
        onload: null as any,
        onerror: null as any
      }
      
      global.FileReader = jest.fn(() => mockFileReader) as any
      
      setTimeout(() => {
        if (mockFileReader.onload) mockFileReader.onload()
      }, 0)

      processor.processFile(mockFile)
    })
  })
})