'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Brain, Sparkles, CheckCircle, Loader2, X } from 'lucide-react'
import { EvidenceChip, fileKindFromType } from '@/components/EvidenceChip'
import { LoadingMoment, type LoadingFile } from '@/components/LoadingMoment'
import { usePathname } from 'next/navigation'
import { useProgressToasts } from '@/lib/context/ProgressToastContext'
import { useToast as useAppToast } from '@/lib/context/ToastContext'
import { useRecentUpdates } from '@/lib/context/RecentUpdatesContext'
import { useReport } from '@/lib/context/ReportContext'
import { getSectionSchemaForType } from '@/lib/structured-schemas'
import { v4 as uuidv4 } from 'uuid'
import { hydrateSection } from '@/lib/render/hydrateSection'
import { renderStructuredData } from '@/lib/report-renderer'
import type { Report } from '@/types/report-types'
import { DryRunPreviewModal, type DryRunSlide } from '@/components/DryRunPreviewModal'
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
  const { showProcessingSummaryToast } = useAppToast()
  const { addRecentUpdate } = useRecentUpdates()
  const { report, refreshReport } = useReport()
  
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
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSlides, setPreviewSlides] = useState<DryRunSlide[]>([])
  
  // Results State
  const [processingResults, setProcessingResults] = useState<{
    successful: number
    failed: number
    sections: Array<{ sectionId: string; confidence: number }>
  } | null>(null)

  // Loading moment state (snapshot of files at submit time + SSE op id)
  const [loadingFiles, setLoadingFiles] = useState<LoadingFile[]>([])
  const [loadingOperationId, setLoadingOperationId] = useState<string | null>(null)
  const [loadingActive, setLoadingActive] = useState(false)

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

  // Listen for the "open-ai" event to open the drawer programmatically
  useEffect(() => {
    const handleOpenAI = () => {
      setIsOpen(true)
    }
    window.addEventListener('open-ai', handleOpenAI)
    return () => window.removeEventListener('open-ai', handleOpenAI)
  }, [])

  const canRun = (rawText.trim() || files.length > 0) && selectedSectionIds.length > 0

  const runAI = async () => {
    setIsProcessing(true)
    clearAllToasts()

    // Hoisted so the finally block can close the SSE stream regardless of
    // whether the try body errored before assigning it.
    let es: EventSource | null = null

    // Snapshot files for the loading-moment overlay before any state changes
    const snapshot: LoadingFile[] = files.map((f, i) => ({
      id: f.id,
      name: f.file.name,
      kind: fileKindFromType(f.file.type) as LoadingFile['kind'],
      status: i === 0 ? 'working' : 'queued',
    }))
    if (rawText.trim()) {
      snapshot.push({ id: 'note', name: 'note.txt', kind: 'note', status: 'queued' })
    }
    setLoadingFiles(snapshot)

    // Close the drawer immediately so the loading moment is visible (unless dry run)
    if (!dryRun) {
      setIsOpen(false)
      setLoadingActive(true)
    }
    
    // Emit staged progress toasts to indicate work while request runs
    const firstSectionId = selectedSectionIds[0] || '00000000-0000-0000-0000-000000000000'
    const stage = (slug: string, delay: number) => {
      setTimeout(() => {
        // Use a deterministic synthetic field to match toast parser
        processLogLine(`📝 Processing update: ${firstSectionId}.${slug} ... replace`)
      }, delay)
    }
    stage('uploading_files', 0)
    stage('extracting_text', 900)
    stage('analyzing_with_ai', 1800)
    stage('applying_updates', 2700)
    
    try {
      const reportId = pathname.split('/')[3]
      // Optional SSE progress subscription
      const enableSse = process?.env?.NEXT_PUBLIC_ENABLE_SSE_PROGRESS === 'true'
      const operationId = enableSse ? uuidv4() : null
      setLoadingOperationId(operationId)

      // Create FormData for file uploads
      const formData = new FormData()
      formData.append('reportId', reportId)
      formData.append('sectionIds', JSON.stringify(selectedSectionIds))
      formData.append('replace', replaceMode.toString())
      formData.append('dryRun', dryRun.toString())
      formData.append('text', rawText)
      if (operationId) formData.append('operationId', operationId)

      // Subscribe to SSE before sending request (es hoisted to function scope for finally cleanup)
      if (operationId) {
        try {
          es = new EventSource(`/api/stream/${operationId}`)
          es.onmessage = (evt) => {
            if (!evt?.data) return
            // Route raw server log lines into the toast pipeline
            processLogLine(evt.data)
          }
          es.onerror = () => {
            // Silent; stream may close naturally at end
          }
        } catch {}
      }

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
        // Force a refresh to ensure UI sees latest DB changes in case realtime misses
        try { await refreshReport() } catch {}

        // Mark staged steps as completed for non-SSE flows
        const completeStage = (slug: string) => processLogLine(`✅ Updated ${firstSectionId}.${slug}`)
        completeStage('uploading_files')
        completeStage('extracting_text')
        completeStage('analyzing_with_ai')
        completeStage('applying_updates')
        
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
              try { addRecentUpdate(u.sectionId, [fp], 'ai_update', 'notice') } catch {}
            } else {
              processLogLine(`❌ Failed to update ${u.sectionId}.${fp}`)
            }
          }, 300 + idx * 120)
        })
        
        // Show a concise processing summary toast if available
        try {
          const ps = result?.results?.processingSummary
          const updatedSections: string[] = Array.from(new Set((updates || []).filter((u: any) => u?.success && u?.sectionId).map((u: any) => u.sectionId)))
          const fieldUpdates: string[] = (updates || []).filter((u: any) => u?.success && u?.sectionId && u?.fieldPath).slice(0, 6).map((u: any) => `${u.sectionId}.${u.fieldPath}`)
          if (ps && typeof ps.summary === 'string') {
            showProcessingSummaryToast({
              summary: ps.summary,
              updatedSections,
              fieldUpdates,
            })
          }
        } catch {}
        
        onProcessData?.(rawText)

        // If no update results, finalize progress so UI does not appear stuck
        if ((!updates || updates.length === 0)) {
          setTimeout(() => {
            processLogLine(`✅ Updated ${firstSectionId}.complete`)
          }, 400)
        }

        // Dry-run preview slides (open even if zero updates, to show steps UI)
        if (dryRun && report) {
          try {
            const proposed = Array.isArray(result.results?.proposedUpdates) ? result.results.proposedUpdates : []
            const previews = buildDryRunPreviews({ report, proposed, targetSectionIds: selectedSectionIds })
            setPreviewSlides(previews)
            setPreviewOpen(true)
          } catch (e) {
            console.warn('Dry-run preview failed:', e)
          }
        }
        
        // Reset input state after a brief delay
        setTimeout(() => {
          setRawText('')
          setFiles([])
          setProcessingResults(null)
        }, 1500)
      } else {
        // Mark staged steps as failed for visibility
        processLogLine(`❌ Failed to update ${firstSectionId}.applying_updates`)
        processLogLine(`❌ Failed to update ${firstSectionId}.analyzing_with_ai`)
        processLogLine(`❌ Failed to update ${firstSectionId}.extracting_text`)
        processLogLine(`❌ Failed to update ${firstSectionId}.uploading_files`)
        processLogLine(`❌ Processing failed: ${result.error}`)
      }
    } catch (error) {
      // Mark staged steps as failed for visibility
      processLogLine(`❌ Failed to update ${firstSectionId}.applying_updates`)
      processLogLine(`❌ Failed to update ${firstSectionId}.analyzing_with_ai`)
      processLogLine(`❌ Failed to update ${firstSectionId}.extracting_text`)
      processLogLine(`❌ Failed to update ${firstSectionId}.uploading_files`)
      processLogLine(`❌ Error during processing: ${error}`)
    } finally {
      setIsProcessing(false)
      // Hold the loading moment briefly so the user sees completion state
      setTimeout(() => {
        setLoadingActive(false)
        setLoadingOperationId(null)
      }, 900)
      // Close SSE stream if open
      try { es?.close?.() } catch {}
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
      
      <SheetContent side="right" className="w-[600px] sm:max-w-[600px] bg-[var(--paper)]" aria-describedby="ai-intake-desc">
        <SheetHeader className="border-b border-[var(--line-2)] pb-3 mb-2">
          <div className="flex items-baseline justify-between">
            <div className="flex flex-col gap-1">
              <div className="wf-label">Step 1</div>
              <SheetTitle className="wf-heading" style={{ fontSize: 22 }}>Drop evidence for this student.</SheetTitle>
            </div>
            <span className="wf-pill tan">HIPAA · FERPA safe</span>
          </div>
        </SheetHeader>
        <p id="ai-intake-desc" className="sr-only">Provide notes or files, choose sections, then optionally run a dry run to preview proposed updates.</p>

        {/* Scrollable content area to ensure submit is reachable on small screens */}
        <div className="flex flex-col gap-5 mt-4 h-[calc(100vh-10rem)] overflow-y-auto pr-1">

          {/* Dropzone */}
          <div
            className={`wf-dropzone text-center relative ${isDragActive ? 'active' : ''}`}
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true) }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true) }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false) }}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.wav,.mp3,.m4a"
              onChange={(e) => handleFiles(Array.from(e.target.files || []))}
              className="hidden"
              id="file-upload"
            />
            <div className="wf-hand accent" style={{ fontSize: 28, marginBottom: 10 }}>drop files here</div>
            <div className="wf-sm">or</div>
            <div className="flex gap-2 justify-center mt-2 flex-wrap">
              <label htmlFor="file-upload" className="wf-btn sm cursor-pointer">📄 Browse</label>
              <button type="button" className="wf-btn sm ghost" disabled>🎙 Record audio</button>
              <button type="button" className="wf-btn sm ghost" disabled>📷 Photograph note</button>
              <button type="button" className="wf-btn sm ghost" onClick={() => { /* focus textarea below */ document.getElementById('raw-notes')?.focus() }}>✏ Type note</button>
            </div>

            {isImporting && (
              <div className="mt-3 flex items-center justify-center gap-2 wf-sm">
                <Loader2 className="h-3 w-3 animate-spin" /> Importing files...
              </div>
            )}
          </div>

          {/* Queue */}
          {files.length > 0 && (
            <div>
              <div className="flex items-baseline justify-between">
                <div className="wf-label bold">Queued · {files.length} file{files.length === 1 ? '' : 's'}</div>
                <span className="wf-sm">Est. analysis time ~{Math.max(15, files.length * 6)} s</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {files.map((fileMeta) => (
                  <div key={fileMeta.id} className="relative group">
                    <EvidenceChip
                      kind={fileKindFromType(fileMeta.file.type) as any}
                      name={fileMeta.file.name}
                      meta={`${(fileMeta.file.size / 1024 / 1024).toFixed(1)} MB${fileMeta.kind === 'pdf' && fileMeta.pageEstimate ? ` · ≈${fileMeta.pageEstimate}pg` : ''}`}
                    />
                    <button
                      onClick={() => removeFile(fileMeta.id)}
                      aria-label={`Remove ${fileMeta.file.name}`}
                      className="absolute -top-1.5 -right-1.5 bg-[var(--card-surface)] border border-[var(--line)] rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="wf-divider" />

          {/* Context note */}
          <div className="flex flex-col gap-1">
            <div className="wf-label bold">Tell Linguosity the context (optional)</div>
            <Textarea
              id="raw-notes"
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder='e.g., "Initial eval, 2nd grade, referred by teacher for intelligibility concerns."'
              className="resize-none font-mono text-sm bg-[var(--card-surface)] border-[var(--line)] rounded-[3px]"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>

          {/* Target sections */}
          {report?.sections && report.sections.length > 0 && (
            <div>
              <div className="wf-label bold mb-2">Target sections</div>
              <div className="wf-box max-h-48 overflow-auto space-y-0.5">
                {report.sections.map((s) => (
                  <label key={s.id} className="flex items-start gap-2 text-xs py-0.5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 shrink-0 accent-[var(--terracotta)]"
                      checked={selectedSectionIds.includes(s.id)}
                      onChange={(e) => {
                        setSelectedSectionIds(prev => e.target.checked ? Array.from(new Set([...prev, s.id])) : prev.filter(id => id !== s.id))
                      }}
                    />
                    <span className="text-xs leading-tight" style={{ fontFamily: 'var(--font-mono)' }}>{s.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="wf-divider" />

          {/* Section controls */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
              <input
                type="checkbox"
                checked={replaceMode}
                onChange={(e) => setReplaceMode(e.target.checked)}
                className="accent-[var(--terracotta)]"
              />
              Replace existing content
            </label>

            <label className="flex items-center gap-2 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="accent-[var(--terracotta)]"
              />
              Preview only (dry run)
            </label>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="wf-btn ghost"
                disabled={isProcessing}
              >
                Save draft
              </button>
              <button
                type="button"
                disabled={!canRun || isProcessing}
                onClick={runAI}
                className="wf-btn primary"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Submit for analysis →
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Processing Results */}
          {processingResults && (
            <div className="wf-box terra">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-[var(--terracotta-ink)]" />
                <div className="wf-label bold" style={{ color: 'var(--terracotta-ink)' }}>Processing complete</div>
              </div>
              <div className="text-xs space-y-0.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>
                <p>{processingResults.successful} sections updated successfully</p>
                {processingResults.failed > 0 && (
                  <p>{processingResults.failed} sections failed to update</p>
                )}
              </div>

              {(resultIsDryRun(processingResults) && (processingResults as any).proposedUpdates) && (
                <div className="mt-3">
                  <button onClick={applyProposedUpdates} className="wf-btn sm primary">
                    Apply these updates
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>

      <LoadingMoment
        active={loadingActive}
        files={loadingFiles}
        operationId={loadingOperationId}
        onSkip={() => setLoadingActive(false)}
      />

      <DryRunPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        slides={previewSlides}
        onApplyAll={async (approvedUpdates) => {
          try {
            if (!report || !approvedUpdates || approvedUpdates.length === 0) return
            const reportId = report.id
            const form = new FormData()
            form.append('reportId', reportId)
            form.append('sectionIds', JSON.stringify(selectedSectionIds))
            form.append('replace', replaceMode.toString())
            form.append('dryRun', 'false')
            form.append('text', rawText)
            form.append('applyUpdates', JSON.stringify(approvedUpdates))
            const res = await fetch('/api/ai/process-intake', { method: 'POST', body: form })
            const json = await res.json()
            if (!res.ok || !json?.success) {
              alert('Apply failed: ' + (json?.error || res.statusText))
            } else {
              alert('Updates applied')
              setPreviewOpen(false)
              try { await refreshReport() } catch {}
            }
          } catch (e) {
            alert('Apply error: ' + (e as Error).message)
          }
        }}
      />
    </Sheet>
  )
}

// Build dry-run preview slides by applying proposed updates in-memory and rendering HTML
function deepClone<T>(obj: T): T { return JSON.parse(JSON.stringify(obj)) }

function setByPath(obj: any, path: string, value: any) {
  if (!path) return value
  const parts = path.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]
    const num = Number(key)
    const isIndex = !Number.isNaN(num) && String(num) === key
    if (isIndex) {
      if (!Array.isArray(cur)) cur = []
      if (!cur[num]) cur[num] = {}
      cur = cur[num]
    } else {
      if (!cur[key] || typeof cur[key] !== 'object') cur[key] = {}
      cur = cur[key]
    }
  }
  const last = parts[parts.length - 1]
  const lastNum = Number(last)
  const lastIsIndex = !Number.isNaN(lastNum) && String(lastNum) === last
  if (lastIsIndex) {
    if (!Array.isArray(cur)) cur = []
    cur[lastNum] = value
  } else {
    cur[last] = value
  }
  return obj
}

function buildDryRunPreviews({ report, proposed, targetSectionIds }: { report: Report, proposed: any[], targetSectionIds: string[] }): DryRunSlide[] {
  const byId = new Map(report.sections.map(s => [s.id, s] as const))
  const staged: Record<string, { data: any, updates: any[] }> = {}
  for (const sid of targetSectionIds) {
    const section = byId.get(sid)
    if (!section) continue
    staged[sid] = { data: deepClone(section.structured_data || {}), updates: [] }
  }
  for (const u of proposed) {
    const sid = u.section_id
    if (!staged[sid]) continue
    try {
      const path = (u.field_path || '').replace(/^structured_data\./, '')
      staged[sid].data = setByPath(staged[sid].data, path, u.value)
      staged[sid].updates.push(u)
    } catch {}
  }
  const slides: DryRunSlide[] = []
  for (const sid of Object.keys(staged)) {
    const section = byId.get(sid)
    if (!section) continue
    const { data, updates } = staged[sid]
    let html = ''
    const type = (section.sectionType || '').toString().toLowerCase()
    if (['assessment_results','assessment_tools','validity_statement','recommendations'].includes(type) && Object.keys(data || {}).length > 0) {
      html = renderStructuredData(data, type, { report })
    } else if (typeof section.content === 'string' && section.content.trim()) {
      html = hydrateSection({ html: section.content, data, reportMeta: report as any })
    } else {
      html = `<pre class="text-xs">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`
    }
    slides.push({ sectionId: sid, sectionTitle: section.title, html, updates })
  }
  return slides
}

function escapeHtml(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;')
}

// Helper: determine if results were from dry run
function resultIsDryRun(r: any): boolean {
  return r && r.mode === 'dryRun'
}
