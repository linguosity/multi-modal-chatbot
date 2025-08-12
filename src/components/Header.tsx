'use client'

import { Save, FileDown, X, Trash2, Wrench, Mic, Square } from "lucide-react";
import Link from 'next/link'
import { BaseModal } from '@/components/ui/base-modal'
import { Button } from '@/components/ui/button'
import { SplitButton } from "@/components/ui/split-button";
import { Breadcrumb, useBreadcrumbs } from "@/components/ui/breadcrumb";
import { AIIntakeDrawer } from "@/components/AIIntakeDrawer";
import { usePathname, useRouter } from "next/navigation";
import { useReport } from "@/lib/context/ReportContext";
import { useState, useEffect, useRef } from "react";
import { SettingsButton } from '@/components/UserSettingsModal'

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { report, handleSave, handleDelete, realtime } = useReport();
  const isViewMode = pathname?.includes('/view');
  
  const breadcrumbItems = useBreadcrumbs(
    pathname, 
    {}, 
    report ? { title: report.title, type: report.type } : undefined,
    // Extract section data from pathname if we're in a section
    pathname.includes('/dashboard/reports/') && report ? 
      (() => {
        const segments = pathname.split('/');
        const sectionId = segments[segments.length - 1];
        const section = report.sections?.find(s => s.id === sectionId);
        return section ? { title: section.title } : undefined;
      })() : undefined
  );
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);

  // Mock save state tracking - in a real app this would come from context
  useEffect(() => {
    // Update last saved when report changes (simplified)
    if (report) {
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    }
  }, [report]);

  const handleSaveClick = async () => {
    if (!report) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      await handleSave(report);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      setSaveError(error as Error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndClose = async () => {
    await handleSaveClick();
    router.push('/dashboard');
  };

  const handleExportPdf = () => {
    console.log('Export PDF clicked');
    // TODO: Implement PDF export
  };

  const handleRepairSync = async () => {
    if (!report) return;
    try {
      const res = await fetch('/api/admin/repair-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: report.id })
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        console.warn('Repair sync failed', json?.error);
        alert('Repair failed: ' + (json?.error || res.statusText));
      } else {
        console.log('Repair sync completed', json);
        alert('Repair complete');
      }
    } catch (e) {
      console.error('Repair sync error', e);
      alert('Repair error: ' + (e as Error).message);
    }
  }

  // Voice journal recorder (modal)
  const [showRecorder, setShowRecorder] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const resetRecorder = () => {
    setIsRecording(false)
    setAudioBlob(null)
    chunksRef.current.length = 0
  }

  const openRecorder = () => {
    resetRecorder()
    mediaRef.current = null
    chunksRef.current.length = 0
    setShowRecorder(true)
  }

  const closeRecorder = () => {
    const mr = mediaRef.current
    try { if (mr && mr.state !== 'inactive') mr.stop() } catch {}
    setShowRecorder(false)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current.length = 0
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          setAudioBlob(blob)
          try { stream.getTracks().forEach(t => t.stop()) } catch {}
        } catch (e) { console.error('Voice journal error', e) }
      }
      mediaRef.current = mr
      mr.start()
      setIsRecording(true)
    } catch (e) {
      console.error('Mic permission error', e)
      alert('Please allow microphone access to record')
    }
  }

  const stopRecording = () => {
    const mr = mediaRef.current
    try {
      if (mr && mr.state !== 'inactive') mr.stop()
    } catch {}
    setIsRecording(false)
  }

  const submitVoiceJournal = async () => {
    if (!report) return
    try {
      const formData = new FormData()
      formData.append('reportId', report.id)
      // Target all sections so AI can route content
      const sectionIds = (report.sections || []).map(s => s.id)
      formData.append('sectionIds', JSON.stringify(sectionIds))
      formData.append('replace', 'false')
      formData.append('dryRun', 'false')
      formData.append('text', '')
      if (!audioBlob) return alert('No recording to submit')
      const file = new File([audioBlob], 'voice_journal.webm', { type: 'audio/webm' })
      formData.append('file_0', file)

      const res = await fetch('/api/ai/process-intake', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok || !json?.success) {
        alert('Voice note processing failed')
      } else {
        alert('Voice note added to report')
        setShowRecorder(false)
      }
    } catch (e) {
      console.error('Submit voice journal failed', e)
      alert('Recording upload failed')
    }
  }

  const handleAIIntakeProcess = (data: string | Record<string, unknown>) => {
    console.log('Processing intake data:', data);
    // TODO: Implement AI processing logic
    // This would typically call an API endpoint to process the data
    // and update the report sections accordingly
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between
                       bg-white/95 backdrop-blur border-b px-4 py-2">
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex items-center gap-2">
        {isViewMode && (
          <>
            {/* Minimal actions in report view to reduce clutter */}
            {report?.id && (
              <Link href={`/dashboard/reports/${report.id}`}>
                <Button variant="secondary" size="sm">Back to Edit</Button>
              </Link>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={() => { try { window.print() } catch {} }}
            >
              Print
            </Button>
          </>
        )}
        {!isViewMode && (
          <>
        <AIIntakeDrawer onProcessData={handleAIIntakeProcess} />
        {/* Realtime badge */}
        {(() => {
          const on = (realtime?.broadcast === 'SUBSCRIBED') || (realtime?.pg === 'SUBSCRIBED')
          const label = on ? 'Realtime: ON' : 'Realtime: OFF'
          const cls = on ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'
          return (
            <span className={`hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${cls}`} title={`Broadcast: ${realtime?.broadcast || 'n/a'} | PG: ${realtime?.pg || 'n/a'}`}>
              {label}
            </span>
          )
        })()}
        {report?.id && (
          <Link href={`/dashboard/reports/${report.id}/timeline`}>
            <Button variant="secondary" size="sm">Timeline</Button>
          </Link>
        )}
        {/* Voice journal recorder */}
        <button
          onClick={openRecorder}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-200"
          title="Record a quick voice note"
        >
          <Mic className="h-3.5 w-3.5" /> Record
        </button>
        <BaseModal
          isOpen={showRecorder}
          onClose={closeRecorder}
          title="Quick Voice Note"
        >
          <div className="p-4 space-y-4">
            {!isRecording && !audioBlob && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Use your mic to capture a brief note describing what you observed and where it belongs.</div>
                <Button size="sm" onClick={startRecording}><Mic className="h-4 w-4 mr-1"/> Start</Button>
              </div>
            )}
            {isRecording && (
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-sm text-red-600">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-600"/> Recording…
                </div>
                <Button size="sm" variant="secondary" onClick={stopRecording}><Square className="h-4 w-4 mr-1"/> Stop</Button>
              </div>
            )}
            {!isRecording && audioBlob && (
              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="secondary" onClick={resetRecorder}>Re-record</Button>
                <Button size="sm" onClick={submitVoiceJournal}>Submit</Button>
              </div>
            )}
          </div>
        </BaseModal>
        {/* Global user settings (defaults for locked fields, state, etc.) */}
        <SettingsButton />
        {/* Repair sync for current report */}
        {report && (
          <button
            onClick={handleRepairSync}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-200"
            title="Repair data sync for this report"
          >
            <Wrench className="h-3.5 w-3.5" /> Repair
          </button>
        )}
        
        <SplitButton
          onClick={handleSaveClick}
          isSaving={isSaving}
          lastSaved={lastSaved}
          hasUnsavedChanges={hasUnsavedChanges}
          saveError={saveError}
          dropdownItems={[
            {
              label: "Save",
              icon: <Save className="h-4 w-4" />,
              onClick: handleSaveClick
            },
            {
              label: "Save & Close",
              icon: <X className="h-4 w-4" />,
              onClick: handleSaveAndClose
            },
            {
              label: "Export PDF",
              icon: <FileDown className="h-4 w-4" />,
              onClick: handleExportPdf,
              separator: true
            },
            {
              label: "Delete Report",
              icon: <Trash2 className="h-4 w-4 text-red-500" />,
              onClick: handleDelete,
              separator: true
            }
          ]}
        >
          <Save className="h-4 w-4 mr-1" />
          Save Report
        </SplitButton>
          </>
        )}
      </div>
    </header>
  );
}
