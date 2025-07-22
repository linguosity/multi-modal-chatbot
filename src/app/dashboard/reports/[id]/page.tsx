'use client';

import { useParams } from 'next/navigation'; 
import { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

import type { DataPoint, ReportSection } from '@/lib/schemas/report';
import { SectionHeader } from "@/components/ui/card"
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { useReport } from '@/lib/context/ReportContext';
import { SlpReportSectionGroup } from '@/lib/report-groups';
import { ReportSectionCard } from '@/components/ReportSectionCard';
import { FloatingAIAssistant } from '@/components/FloatingAIAssistant';
import { Toaster } from '@/components/ui/toaster';

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { report, loading, handleSave, setReport } = useReport();
  const [error, setError] = useState<string | null>(null);
  const [isSeedReport, setIsSeedReport] = useState(false);
  const [templateGroups, setTemplateGroups] = useState<SlpReportSectionGroup[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch template structure to generate dynamic groups
  useEffect(() => {
    const fetchTemplateGroups = async () => {
      if (!report?.templateId) {
        console.log('⚠️ No templateId found, using fallback');
        setTemplateGroups([
          {
            title: "Report Sections",
            sectionTypes: report?.sections.map(s => s.sectionType) || []
          }
        ]);
        return;
      }

      const supabase = createBrowserSupabase();
      try {
        console.log('🔍 Fetching template structure for report:', report.templateId);
        const { data: template, error } = await supabase
          .from('report_templates')
          .select('*')
          .eq('id', report.templateId)
          .single();

        if (error) {
          console.log('❌ Template fetch error:', error);
          throw new Error('Failed to fetch template');
        }
        console.log('📋 Template data:', template);
        
        if (template.template_structure && Array.isArray(template.template_structure)) {
          // Fetch section types to map UUIDs to names
          const sectionTypesResponse = await fetch('/api/report-section-types');
          const sectionTypes = await sectionTypesResponse.json();
          
          // Create mapping from UUID to name
          const uuidToNameMap: Record<string, string> = {};
          sectionTypes.forEach((st: any) => {
            uuidToNameMap[st.id] = st.name;
          });
          
          // Convert template groups to display groups
          const dynamicGroups: SlpReportSectionGroup[] = template.template_structure.map((group: any) => ({
            title: group.title,
            sectionTypes: (group.sectionTypeIds || []).map((uuid: string) => uuidToNameMap[uuid]).filter(Boolean)
          }));
          
          console.log('✅ Generated dynamic groups:', dynamicGroups);
          setTemplateGroups(dynamicGroups);
        } else {
          console.warn('⚠️ Template has no structure, using fallback');
          // Fallback to default groups if template has no structure
          setTemplateGroups([
            {
              title: "Report Sections",
              sectionTypes: report.sections.map(s => s.sectionType)
            }
          ]);
        }
      } catch (err) {
        console.error('❌ Error fetching template:', err);
        // Fallback: create a single group with all sections
        setTemplateGroups([
          {
            title: "Report Sections", 
            sectionTypes: report.sections.map(s => s.sectionType)
          }
        ]);
      }
    };

    if (report && !isSeedReport) {
      fetchTemplateGroups();
    }
  }, [report, isSeedReport]);

  useEffect(() => {
    if (id === 'seed-report-demo') {
      setIsSeedReport(true);
      const fetchSeedReport = async () => {
        try {
          const response = await fetch('/api/seed');
          if (!response.ok) {
            throw new Error('Failed to fetch seed data');
          }
          const seedData = await response.json();
          // Assuming seedData.reports is an array and we want the first one
          if (seedData.reports && seedData.reports.length > 0) {
            setReport(seedData.reports[0]);
            // For seed reports, use hardcoded groups
            setTemplateGroups([
              {
                title: "Initial Information & Background",
                sectionTypes: ["reason_for_referral", "parent_concern", "health_developmental_history", "family_background"]
              },
              {
                title: "Assessment Findings", 
                sectionTypes: ["assessment_tools", "assessment_results", "language_sample", "validity_statement"]
              },
              {
                title: "Summary, Eligibility & Recommendations",
                sectionTypes: ["eligibility_checklist", "conclusion", "recommendations", "accommodations"]
              }
            ]);
          } else {
            setError('No seed reports found.');
          }
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('An unknown error occurred');
          }
        }
      };
      fetchSeedReport();
    }
  }, [id, setReport]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentReportRef = useRef(report);

  // Keep the ref updated with the current report
  useEffect(() => {
    currentReportRef.current = report;
  }, [report]);

  const handleSectionUpdate = (sectionId: string, newContent: string, shouldSave = false) => {
    // First, update the report state
    setReport(prevReport => {
      if (!prevReport) return null;
      const updatedSections = prevReport.sections.map(section =>
        section.id === sectionId ? { ...section, content: newContent, lastUpdated: new Date().toISOString() } : section
      );
      return { ...prevReport, sections: updatedSections };
    });

    // Only save if explicitly requested (on blur)
    if (shouldSave && !isSeedReport) {
      setIsSaving(true); // Show saving indicator
      
      // Use a small delay to ensure the state update has completed
      setTimeout(async () => {
        if (currentReportRef.current) {
          try {
            await handleSave(currentReportRef.current);
          } catch (error) {
            console.error('Save failed:', error);
          } finally {
            setIsSaving(false); // Hide saving indicator
          }
        } else {
          setIsSaving(false);
        }
      }, 100); // Small delay to ensure state is updated
    }
  };

  const handleAIGeneration = async (sectionIds: string[], input: string, files?: File[]) => {
    if (!report) return;

    setIsSaving(true);
    try {
      // Process each selected section
      for (const sectionId of sectionIds) {
        const section = report.sections.find(s => s.id === sectionId);
        if (!section) continue;

        // Create FormData for file uploads if needed
        let body: any = {
          reportId: report.id,
          sectionId: sectionId,
          generation_type: 'prose',
          unstructuredInput: input || `Generate content for ${section.title} section.`
        };

        // If files are provided, use FormData
        if (files && files.length > 0) {
          const formData = new FormData();
          formData.append('reportId', report.id);
          formData.append('sectionId', sectionId);
          formData.append('generation_type', 'prose');
          formData.append('unstructuredInput', input || `Generate content for ${section.title} section.`);
          
          files.forEach((file, index) => {
            formData.append(`file_${index}`, file);
          });
          
          body = formData;
        }

        const res = await fetch('/api/ai/generate-section', {
          method: 'POST',
          ...(files && files.length > 0 ? {} : { headers: { 'Content-Type': 'application/json' } }),
          body: files && files.length > 0 ? body : JSON.stringify(body)
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'AI generation failed');

        // Update the section content
        handleSectionUpdate(sectionId, json.updatedSection.content, true);
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      setError(error instanceof Error ? error.message : 'AI generation failed');
    } finally {
      setIsSaving(false);
    }
  };



  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (report) {
      const oldIndex = report.sections.findIndex((section) => section.id === String(active.id));
      const newIndex = report.sections.findIndex((section) => section.id === String(over.id));

      if (oldIndex === -1 || newIndex === -1) return; // Defensive

      const updatedSections = arrayMove(report.sections, oldIndex, newIndex);
      const updatedReport = { ...report, sections: updatedSections };
      setReport(updatedReport);

      // Only save to Supabase if it's not a seed report
      if (!isSeedReport) {
        await handleSave(updatedReport);
      }
    }
  };

  // Debug logging
  console.log('🐛 Debug info:', { 
    loading, 
    error, 
    report: report ? { id: report.id, title: report.title, sectionsCount: report.sections?.length } : null,
    templateGroups: templateGroups.length,
    isSeedReport 
  });

  if (loading && !isSeedReport) return <div className="p-6">Loading report...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!report) return <div className="p-6">Report not found.</div>;

  return (
    <>
      <Toaster />
      
      {/* Floating AI Assistant */}
      <FloatingAIAssistant
        sections={report.sections}
        reportId={report.id}
        onGenerateContent={handleAIGeneration}
      />
      
      {/* Subtle saving indicator */}
      {isSaving && (
        <div className="fixed top-4 right-4 z-50 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-md shadow-sm flex items-center gap-2 text-sm">
          <div className="animate-spin h-3 w-3 border border-blue-600 border-t-transparent rounded-full"></div>
          Saving...
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {templateGroups.map((group: SlpReportSectionGroup) => (
            <div key={group.title} className="md:col-span-2">
              <SectionHeader>{group.title}</SectionHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SortableContext items={report.sections.filter(s => Array.isArray(group.sectionTypes) && group.sectionTypes.includes(s.sectionType)).map(s => s.id)} strategy={rectSortingStrategy}>
                  {report.sections
                    .filter(section => Array.isArray(group.sectionTypes) && group.sectionTypes.includes(section.sectionType))
                    .map((section: ReportSection) => (
                      <ReportSectionCard key={section.id} section={section} onUpdateSectionAction={handleSectionUpdate} reportId={report.id} />
                    ))}
                </SortableContext>
              </div>
            </div>
          ))}
        </div>
      </DndContext>
    </>
  );
}

