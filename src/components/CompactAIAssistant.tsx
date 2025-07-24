'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Upload, FileText, Image, X, Volume2 } from 'lucide-react'
import { ReportSection } from '@/lib/schemas/report'

interface Props {
  sections: ReportSection[]
  reportId: string
  onGenerateContent: (sectionIds: string[], input: string, files?: File[]) => Promise<void>
  isOpen: boolean
  onToggle: () => void
}

export const CompactAIAssistant: React.FC<Props> = ({
  sections,
  reportId,
  onGenerateContent,
  isOpen,
  onToggle
}) => {
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Auto-select the current section (single section context)
  const selectedSections = sections.map(s => s.id)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || [])
    setFiles(prev => [...prev, ...uploadedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleGenerate = async () => {
    if (!input.trim() && files.length === 0) return

    setLoading(true)
    try {
      await onGenerateContent(selectedSections, input, files)
      // Reset form
      setInput('')
      setFiles([])
      onToggle() // Close the panel
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasContent = input.trim() || files.length > 0

  if (!isOpen) return null

  return (
    <div className="absolute top-full right-0 mt-2 w-80 z-50">
      <Card className="shadow-xl border bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              AI Assistant
            </CardTitle>
            <Button
              onClick={onToggle}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Text Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">
              Input Text or Assessment Notes
            </label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what you want to generate or paste assessment notes..."
              className="min-h-[80px] resize-none border-gray-200 focus:border-blue-500 text-sm"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">
              Upload Files (Optional)
            </label>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full justify-start text-gray-600 border-dashed h-8 text-xs"
            >
              <Upload className="h-3 w-3 mr-2" />
              Upload Images, PDFs, or Audio
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-1.5 bg-gray-50 rounded text-xs">
                    <div className="flex items-center gap-1.5">
                      {file.type.startsWith('image/') ? (
                        <Image className="h-3 w-3 text-blue-500" />
                      ) : file.type.startsWith('audio/') ? (
                        <Volume2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <FileText className="h-3 w-3 text-red-500" />
                      )}
                      <span className="truncate max-w-[200px]">{file.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-4 w-4 p-0"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !hasContent}
            className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-sm"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-2" />
                Generate Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}