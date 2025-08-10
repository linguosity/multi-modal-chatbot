'use client'

import { Save, FileDown, X, Trash2, Wrench } from "lucide-react";
import { SplitButton } from "@/components/ui/split-button";
import { Breadcrumb, useBreadcrumbs } from "@/components/ui/breadcrumb";
import { AIIntakeDrawer } from "@/components/AIIntakeDrawer";
import { usePathname, useRouter } from "next/navigation";
import { useReport } from "@/lib/context/ReportContext";
import { useState, useEffect } from "react";
import { SettingsButton } from '@/components/UserSettingsModal'

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { report, handleSave, handleDelete } = useReport();
  
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

  const handleAIIntakeProcess = (data: string | Record<string, unknown>, type: 'structured' | 'unstructured') => {
    console.log(`Processing ${type} data:`, data);
    // TODO: Implement AI processing logic
    // This would typically call an API endpoint to process the data
    // and update the report sections accordingly
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between
                       bg-white/95 backdrop-blur border-b px-4 py-2">
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex items-center gap-2">
        <AIIntakeDrawer onProcessData={handleAIIntakeProcess} />
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
      </div>
    </header>
  );
}
