'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Sparkles, Upload, FileText, Image, X, Check, Volume2, File } from 'lucide-react'
import { ReportSection } from '@/lib/schemas/report'

interface Props {
  sections: ReportSection[]
  reportId: string
  onGenerateContent: (sectionIds: string[], input: string, files?: File[]) => Promise<void>
}

export const FloatingAIAssistant: React.FC<Props> = ({
  sections,
  reportId,
  onGenerateContent
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Auto-select the current section if there's only one
  useEffect(() => {
    if (sections.length === 1) {
      setSelectedSections([sections[0].id])
    }
  }, [sections])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || [])
    setFiles(prev => [...prev, ...uploadedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const handleGenerate = async () => {
    if (!input.trim() && files.length === 0) return
    if (selectedSections.length === 0) return

    setLoading(true)
    try {
      await onGenerateContent(selectedSections, input, files)
      // Reset form
      setInput('')
      setFiles([])
      setSelectedSections([])
      setIsOpen(false)
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasContent = input.trim() || files.length > 0

  return (
    <>
      {/* Floating Button */}
      <div className="fixed top-20 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-12 h-12 shadow-lg bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        </Button>
      </div>

      {/* Popup Panel */}
      {isOpen && (
        <div className="fixed top-20 right-20 z-40 w-80">
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Text Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Input Text
                </label>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe what you want to generate or paste assessment notes..."
                  className="min-h-[100px] resize-none border-gray-200 focus:border-blue-500"
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Upload Files
                </label>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full justify-start text-gray-600 border-dashed"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files (PDF, Images, Audio, Documents)
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,audio/*,.docx,.csv,.txt,.html"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  {/* File List */}
                  {files.length > 0 && (
                    <div className="space-y-1">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <div className="flex items-center gap-2">
                            {file.type.startsWith('image/') ? (
                              <Image className="h-4 w-4 text-blue-500" />
                            ) : file.type.startsWith('audio/') ? (
                              <Volume2 className="h-4 w-4 text-green-500" />
                            ) : file.type === 'application/pdf' ? (
                              <FileText className="h-4 w-4 text-red-500" />
                            ) : (
                              <File className="h-4 w-4 text-purple-500" />
                            )}
                            <span className="truncate max-w-[180px]">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Section Selection - Only show if multiple sections */}
              {sections.length > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Apply to Sections
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-2 border border-gray-200 rounded p-2">
                    {sections.map((section) => (
                      <div key={section.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={section.id}
                          checked={selectedSections.includes(section.id)}
                          onCheckedChange={() => toggleSection(section.id)}
                        />
                        <label
                          htmlFor={section.id}
                          className="text-sm text-gray-700 cursor-pointer flex-1"
                        >
                          {section.title}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={loading || !hasContent || selectedSections.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {sections.length === 1 ? 'Generate Content' : `Generate for ${selectedSections.length} Section${selectedSections.length !== 1 ? 's' : ''}`}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}