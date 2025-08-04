'use client'

import React, { useState } from 'react'
import { Upload, FileText, Image, Loader2 } from 'lucide-react'
import { BaseModal } from './ui/base-modal'
import { Button } from './ui/button'
import { cn } from '@/lib/design-system/utils'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onDataReceived: (data: any) => void
  sectionType: string
}

export default function UploadModal({ isOpen, onClose, onDataReceived, sectionType }: UploadModalProps) {
  const [textInput, setTextInput] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const processWithAI = async () => {
    setIsProcessing(true)
    try {
      // TODO: Implement actual Claude API call
      // This would send textInput + files to your AI generation endpoint
      
      // Mock processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock structured data extraction
      const mockData = {
        is_valid: true,
        student_cooperation: {
          cooperative: true,
          understanding: textInput.includes('cooperative') ? 'Student was very cooperative' : '',
          custom_notes: textInput.substring(0, 100) + '...'
        },
        validity_factors: {
          attention_issues: textInput.toLowerCase().includes('attention'),
          motivation_problems: textInput.toLowerCase().includes('motivation'),
          cultural_considerations: textInput.toLowerCase().includes('cultural'),
          other: 'Extracted from uploaded content'
        }
      }
      
      onDataReceived(mockData)
    } catch (error) {
      console.error('Error processing with AI:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const footer = (
    <>
      <Button
        variant="secondary"
        onClick={onClose}
        disabled={isProcessing}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={processWithAI}
        disabled={(!textInput.trim() && files.length === 0) || isProcessing}
        loading={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Process with AI'
        )}
      </Button>
    </>
  )

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Upload Data for ${sectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
      size="lg"
      footer={footer}
      data-testid="upload-modal"
    >
      <div className="p-6 space-y-6">
        {/* Text Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Input
          </label>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste your notes, assessment data, or any text content here..."
            className={cn(
              "w-full h-32 border border-gray-300 rounded-lg p-3 text-sm resize-none",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              "transition-colors"
            )}
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Files (Images, PDFs, Documents)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, DOC, TXT, PNG, JPG up to 10MB each
              </p>
            </label>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    {file.type.startsWith('image/') ? (
                      <Image className="h-4 w-4 text-blue-500" />
                    ) : (
                      <FileText className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="text-sm text-gray-700 truncate">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">How it works:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Add your unstructured notes, images, or documents</li>
            <li>• AI will analyze the content and extract relevant data</li>
            <li>• Structured fields will be automatically populated</li>
            <li>• You can review and edit the extracted data</li>
          </ul>
        </div>
      </div>
    </BaseModal>
  )
}