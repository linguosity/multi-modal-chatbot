'use client'

import { Save, FileDown, X } from "lucide-react";
import { SplitButton } from "@/components/ui/split-button";
import { Breadcrumb, useBreadcrumbs } from "@/components/ui/breadcrumb";
import { usePathname, useRouter } from "next/navigation";
import { useReport } from "@/lib/context/ReportContext";
import { useState, useEffect } from "react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { report, handleSave } = useReport();
  
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

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between
                       bg-white/95 backdrop-blur border-b px-4 py-2">
      <Breadcrumb items={breadcrumbItems} />

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
          }
        ]}
      >
        <Save className="h-4 w-4 mr-1" />
        Save Report
      </SplitButton>
    </header>
  );
}
