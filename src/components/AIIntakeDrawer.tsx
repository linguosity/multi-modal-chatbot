'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Brain, FileText, Upload, Sparkles, CheckCircle, Loader2, GripVertical, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useProgressToasts } from '@/lib/context/ProgressToastContext'
import { useReport } from '@/lib/context/ReportContext'
import { getSectionSchemaForType } from '@/lib/structured-schemas'
interface FileMeta {
  id: string
  file: File
  kind: 'pdf' | 'image' | 'audio' | 'text' | 'document'
  pageEstimate?: number
}

interface AIIntakeDrawerProps {
  onProcessData?: (data: string | Record<string, unknown>) => void
}

export const AIIntakeDrawer: React.FC<AIIntakeDrawerProps> = ({
  onProcessData
}) => {
  const pathname = usePathname()
  const { processLogLine, clearAllToasts } = useProgressToasts()
  const { report } = useReport()
  
  // UI State
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  
  // Input State
  const [rawText, setRawText] = useState('')
  const [files, setFiles] = useState<FileMeta[]>([])
  
  // Processing State
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([])
  const [replaceMode, setReplaceMode] = useState(false)
  const [dryRun, setDryRun] = useState(false)
  
  // Results State
  const [processingResults, setProcessingResults] = useState<{
    successful: number
    failed: number
    sections: Array<{ sectionId: string; confidence: number }>
  } | null>(null)

  // Helper functions
  const getFileKind = (file: File): FileMeta['kind'] => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type === 'application/pdf') return 'pdf'
    if (file.type.startsWith('audio/')) return 'audio'
    if (file.type.startsWith('text/')) return 'text'
    return 'document'
  }

  const estimatePdfPages = (file: File) => Math.max(1, Math.ceil(file.size / (50 * 1024)))

  const handleFiles = (newFiles: File[]) => {
    setIsImporting(true)
    const fileMetas: FileMeta[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 11),
      file,
      kind: getFileKind(file),
      pageEstimate: file.type === 'application/pdf' ? estimatePdfPages(file) : undefined
    }))
    setFiles(prev => [...prev, ...fileMetas])
    // Briefly show importing indicator to signal file capture
    setTimeout(() => setIsImporting(false), 150)
  }

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const dt = e.dataTransfer
    if (!dt) return
    const dropped: File[] = []
    // Prefer items to filter for files
    if (dt.items && dt.items.length) {
      for (let i = 0; i < dt.items.length; i++) {
        const item = dt.items[i]
        if (item.kind === 'file') {
          const f = item.getAsFile()
          if (f) dropped.push(f)
        }
      }
    } else if (dt.files && dt.files.length) {
      for (let i = 0; i < dt.files.length; i++) {
        dropped.push(dt.files[i])
      }
    }
    if (dropped.length) handleFiles(dropped)
    setIsDragActive(false)
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  // Initialize selection with all sections when drawer opens and none selected
  useEffect(() => {
    if (isOpen && report?.sections && selectedSectionIds.length === 0) {
      setSelectedSectionIds(report.sections.map(s => s.id))
    }
  }, [isOpen, report])

  const canRun = (rawText.trim() || files.length > 0) && selectedSectionIds.length > 0

  const runAI = async () => {
    setIsProcessing(true)
    clearAllToasts()
    
    try {
      const reportId = pathname.split('/')[3]
      
      // Create FormData for file uploads
      const formData = new FormData()
      formData.append('reportId', reportId)
      formData.append('sectionIds', JSON.stringify(selectedSectionIds))
      formData.append('replace', replaceMode.toString())
      formData.append('dryRun', dryRun.toString())
      formData.append('text', rawText)

      // Attach sectionInfo and sectionSchemas as fallbacks (DB-agnostic mode)
      if (report?.sections && selectedSectionIds.length > 0) {
        const selected = report.sections.filter(s => selectedSectionIds.includes(s.id))
        const sectionInfo = selected.map(s => ({ id: s.id, title: s.title, section_type: s.sectionType }))
        const sectionSchemas: Record<string, unknown> = {}
        for (const s of selected) {
          const schema = getSectionSchemaForType(s.sectionType || '')
          if (schema) sectionSchemas[s.id] = schema
        }
        formData.append('sectionInfo', JSON.stringify(sectionInfo))
        if (Object.keys(sectionSchemas).length > 0) {
          formData.append('sectionSchemas', JSON.stringify(sectionSchemas))
        }
      }
      
      // Add files to FormData
      files.forEach((fileMeta, index) => {
        formData.append(`file_${index}`, fileMeta.file)
      })
      
      const response = await fetch('/api/ai/process-intake', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        setProcessingResults(result.results)
        
        // Display granular update results as progress toasts (simulate procedural stacking)
        const updates: any[] = (result.results.updateResults && Array.isArray(result.results.updateResults)) ? result.results.updateResults : []
        updates.forEach((u: any, idx: number) => {
          const fp = u.fieldPath || 'section'
          const action = replaceMode ? 'replace' : (u.merge_strategy || 'append')
          // Create a processing toast first
          processLogLine(`📝 Processing update: ${u.sectionId}.${fp} ... ${action}`)
          // Then mark completion shortly after to simulate progress
          setTimeout(() => {
            if (u.success) {
              processLogLine(`✅ Updated ${u.sectionId}.${fp}`)
            } else {
              processLogLine(`❌ Failed to update ${u.sectionId}.${fp}`)
            }
          }, 300 + idx * 120)
        })
        
        onProcessData?.(rawText)
        
        // In dryRun, keep drawer open to allow applying proposed updates
        if (!dryRun) {
          setTimeout(() => {
            setIsOpen(false)
            setRawText('')
            setFiles([])
            setProcessingResults(null)
          }, 4000)
        }
      } else {
        processLogLine(`❌ Processing failed: ${result.error}`)
      }
    } catch (error) {
      processLogLine(`❌ Error during processing: ${error}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const applyProposedUpdates = async () => {
    if (!processingResults || !(processingResults as any).proposedUpdates) return
    setIsProcessing(true)
    try {
      const reportId = pathname.split('/')[3]
      const formData = new FormData()
      formData.append('reportId', reportId)
      formData.append('sectionIds', JSON.stringify(selectedSectionIds))
      formData.append('replace', replaceMode.toString())
      // include same section context
      if (report?.sections && selectedSectionIds.length > 0) {
        const selected = report.sections.filter(s => selectedSectionIds.includes(s.id))
        const sectionInfo = selected.map(s => ({ id: s.id, title: s.title, section_type: s.sectionType }))
        const sectionSchemas: Record<string, unknown> = {}
        for (const s of selected) {
          const schema = getSectionSchemaForType(s.sectionType || '')
          if (schema) sectionSchemas[s.id] = schema
        }
        formData.append('sectionInfo', JSON.stringify(sectionInfo))
        if (Object.keys(sectionSchemas).length > 0) {
          formData.append('sectionSchemas', JSON.stringify(sectionSchemas))
        }
      }
      // attach proposed updates from server dry run
      const updates = (processingResults as any).proposedUpdates
      formData.append('applyUpdates', JSON.stringify(updates))
      const response = await fetch('/api/ai/process-intake', { method: 'POST', body: formData })
      const result = await response.json()
      if (result.success) {
        processLogLine(`✅ Applied ${result.results.successful} updates`)
        setTimeout(() => {
          setIsOpen(false)
          setRawText('')
          setFiles([])
          setProcessingResults(null)
        }, 1200)
      } else {
        processLogLine(`❌ Failed to apply updates: ${result.error}`)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="default" 
          size="sm"
          className="flex items-center gap-2"
        >
          <Brain className="h-4 w-4" />
          AI Intake
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>AI Assessment Intake</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 h-full mt-6">

          {/* Target Sections */}
          {report?.sections && report.sections.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Sections</label>
              <div className="max-h-40 overflow-auto border rounded-md p-2 space-y-1">
                {report.sections.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedSectionIds.includes(s.id)}
                      onChange={(e) => {
                        setSelectedSectionIds(prev => e.target.checked ? Array.from(new Set([...prev, s.id])) : prev.filter(id => id !== s.id))
                      }}
                    />
                    <span className="truncate">{s.title}</span>
                    <span className="text-xs text-gray-500">({s.sectionType})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Dropzone */}
          <div
            className={[
              'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors',
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            ].join(' ')}
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true) }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true) }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false) }}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.wav,.mp3"
              onChange={(e) => handleFiles(Array.from(e.target.files || []))}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {isDragActive ? 'Release to add files' : 'Drop files here or click to upload'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, TXT, DOCX, JPG/PNG, WAV/MP3
              </p>
            </label>

            {isDragActive && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-md border border-blue-300 bg-white/70 px-3 py-1 text-sm text-blue-700">
                  Drop to upload
                </div>
              </div>
            )}

            {isImporting && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Loader2 className="h-3 w-3 animate-spin" /> Importing files...
              </div>
            )}
          </div>

          {/* Text input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raw Assessment Notes
            </label>
            <Textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste your assessment notes, observations, or test results here..."
              className="resize-none"
            />
          </div>

          {/* Attachment list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Attachments ({files.length})</h3>
              <div className="space-y-1">
                {files.map((fileMeta) => (
                  <div key={fileMeta.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                    
                    {/* File icon */}
                    {fileMeta.kind === 'pdf' && <FileText className="h-4 w-4 text-red-500" />}
                    {fileMeta.kind === 'image' && <FileText className="h-4 w-4 text-blue-500" />}
                    {fileMeta.kind === 'audio' && <FileText className="h-4 w-4 text-green-500" />}
                    {fileMeta.kind === 'text' && <FileText className="h-4 w-4 text-gray-500" />}
                    {fileMeta.kind === 'document' && <FileText className="h-4 w-4 text-purple-500" />}
                    
                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileMeta.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(fileMeta.file.size / 1024 / 1024).toFixed(1)} MB
                        {fileMeta.kind === 'pdf' && fileMeta.pageEstimate ? ` • ≈ ${fileMeta.pageEstimate} pages` : ''}
                      </p>
                    </div>
                    
                    {/* Remove button */}
                    <button
                      onClick={() => removeFile(fileMeta.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section selection and controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Sections
              </label>
              <select
                multiple
                value={selectedSectionIds}
                onChange={(e) => setSelectedSectionIds(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                size={4}
              >
                {report?.sections.map(section => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </div>

          {/* Replace mode switch */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={replaceMode}
              onChange={(e) => setReplaceMode(e.target.checked)}
              className="rounded"
            />
            Replace existing content
          </label>

          {/* Dry run switch */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded"
            />
            Preview only (dry run)
          </label>

            {/* Process button */}
            <Button
              disabled={!canRun || isProcessing}
              onClick={runAI}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Process with AI
                </>
              )}
            </Button>
          </div>

          {/* Processing Results */}
          {processingResults && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-medium text-green-800">Processing Complete!</h3>
              </div>
              
              <div className="text-sm text-green-700 space-y-1">
                <p>✅ {processingResults.successful} sections updated successfully</p>
                {processingResults.failed > 0 && (
                  <p className="text-orange-600">⚠️ {processingResults.failed} sections failed to update</p>
                )}
              </div>

              {/* Apply proposed updates after dry run */}
              {(resultIsDryRun(processingResults) && (processingResults as any).proposedUpdates) && (
                <div className="mt-3">
                  <Button size="sm" onClick={applyProposedUpdates}>
                    Apply these updates
                  </Button>
                </div>
              )}
              
              <p className="text-xs text-green-600 mt-2">
                This drawer will close automatically in a few seconds...
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Helper: determine if results were from dry run
function resultIsDryRun(r: any): boolean {
  return r && r.mode === 'dryRun'
}
