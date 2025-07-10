'use client';

import { useParams } from 'next/navigation'; 
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Report, ReportSection } from '@/lib/schemas/report'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import TiptapEditor from '@/components/TiptapEditor'
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SectionHeader, Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { CustomModal } from '@/components/ui/custom-modal';
import { GripVertical, Sparkles, Info, Pencil, FileText, User, Heart, Users, Clipboard, TestTube, BarChart, FileCheck, Book, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { useReport } from '@/lib/context/ReportContext';
import { motion } from 'framer-motion';
// page.tsx  (very top)
import { SlpReportSectionGroup, slpReportSectionGroups } from '@/lib/report-groups';                  // ✅ matches your file
import { useAudioRecorder } from 'use-audio-recorder';
import { ReportInputSection } from '@/components/ReportInputSection';
import { Toaster } from '@/components/ui/toaster';
import { createToast } from '@/lib/hooks/use-toast';

const colors = ['#E57373', '#81C784', '#64B5F6', '#FFD54F', '#9575CD'];

const iconMap: { [key: string]: React.ElementType } = {
  reason_for_referral: FileText,
  parent_concern: User,
  health_developmental_history: Heart,
  family_background: Users,
  assessment_tools: Clipboard,
  assessment_results: TestTube,
  language_sample: BarChart,
  validity_statement: FileCheck,
  eligibility_checklist: Book,
  conclusion: ThumbsUp,
  recommendations: ThumbsDown,
  accommodations: ThumbsDown,
};



const SortableSection = ({ section, highlightedSections, onEditClick }: { section: ReportSection, highlightedSections: string[], onEditClick: (section: ReportSection) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderColor: section.borderColor || 'transparent',
  };

  const Icon = iconMap[section.sectionType] || Info;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="w-full group"
    >
      <Card
        className={`h-full cursor-pointer border-2 ${highlightedSections.includes(section.id) ? 'ai-highlight' : ''}`}
        onClick={() => onEditClick(section)}
        style={{ borderColor: section.borderColor || 'transparent' }}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center">
            <Icon className="mr-2 h-5 w-5" />
            <CardTitle className="text-lg">{section.title}</CardTitle>
          </div>
          <div className="flex items-center">
            <div {...listeners} className="ml-2 cursor-grab">
              <GripVertical />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative min-h-[21.33rem]">
          <div className="break-words">
            <TiptapEditor
              content={section.content}
              editable={false}
              withBorder={false}
              scrollable={true}
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
        </CardContent>
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="size-4 text-gray-500" onClick={() => onEditClick(section)} />
        </div>
      </Card>
    </div>
  );
};

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createBrowserSupabase();

  const { report, loading, showJson, setShowJson, handleSave, handleDelete, setReport } = useReport();

  const [unstructuredInput, setUnstructuredInput] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [highlightedSections, setHighlightedSections] = useState<string[]>([])
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [proposedSections, setProposedSections] = useState<ReportSection[] | null>(null);
  const [selectedSectionsToAccept, setSelectedSectionsToAccept] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSection, setEditingSection] = useState<ReportSection | null>(null);
  const [error, setError] = useState<string | null>(null); // Local error state
  const [tooltipOpen, setTooltipOpen] = useState(true);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require the mouse to move by 10 pixels before activating
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      // Press delay of 250ms, with a tolerance of 5px of movement
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleSectionChange = (sectionId: string, newContent: string) => {
    setReport(prevReport => {
      if (!prevReport) return null
      const updatedSections = prevReport.sections.map(section =>
        section.id === sectionId ? { ...section, content: newContent } : section
      )
      return { ...prevReport, sections: updatedSections }
    })
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleGenerateAI = async (unstructuredInput: string, files: File[], audioBlob: Blob | null) => {
    if (!report || (!unstructuredInput && files.length === 0 && !audioBlob)) return;
    setAiGenerating(true);
    setError(null); // Clear previous errors

    const fileContents: { name: string, type: string; data: string }[] = [];
    for (const file of files) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      await new Promise<void>((resolve) => {
        reader.onload = () => {
          fileContents.push({ name: file.name, type: file.type, data: reader.result as string });
          resolve();
        };
      });
    }

    let audioContent: { type: string; data: string } | undefined;
    if (audioBlob) {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      await new Promise<void>((resolve) => {
        reader.onload = () => {
          audioContent = { type: audioBlob.type, data: reader.result as string };
          resolve();
        };
      });
    }

    try {
      const response = await fetch('/api/ai/generate-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: report.id,
          unstructuredInput: unstructuredInput,
          files: fileContents,
          audio: audioContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content with AI');
      }

      const { updatedSections } = await response.json();
      setProposedSections(updatedSections);
      setShowReviewModal(true);
      setSelectedSectionsToAccept(updatedSections.map((sec: ReportSection) => sec.id));

      // Clear inputs after successful generation
      setUnstructuredInput('');
      setSelectedFiles([]);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleConfirmAIChanges = async () => {
    if (!report || !proposedSections) return;

    let newSections = [...report.sections];
    const newlyUpdatedIds: string[] = [];

    proposedSections.forEach(proposedSec => {
      if (selectedSectionsToAccept.includes(proposedSec.id)) {
        const index = newSections.findIndex(sec => sec.id === proposedSec.id);
        if (index !== -1) {
          newSections[index] = { ...proposedSec, lastUpdated: new Date().toISOString() };
          newlyUpdatedIds.push(proposedSec.id);
        }
      }
    });

    const updatedReport = { ...report, sections: newSections };

    setReport(updatedReport);

    setHighlightedSections(newlyUpdatedIds);
    setTimeout(() => setHighlightedSections([]), 3000);

    setShowReviewModal(false);
    setProposedSections(null);
    setSelectedSectionsToAccept([]);

    await handleSave(updatedReport);
  };

  const handleToggleSectionAccept = (sectionId: string) => {
    setSelectedSectionsToAccept(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleAcceptAll = () => {
    if (proposedSections) {
      setSelectedSectionsToAccept(proposedSections.map(sec => sec.id));
    }
  };

  const handleRejectAll = () => {
    setSelectedSectionsToAccept([]);
  };

  const onDragEnd = async (event: any) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    if (active.id !== over.id) {
      if (report) {
        const oldIndex = report.sections.findIndex((section) => section.id === active.id);
        const newIndex = report.sections.findIndex((section) => section.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
          return;
        }

        const updatedReport = { ...report, sections: arrayMove(report.sections, oldIndex, newIndex) };
        setReport(updatedReport);
        await handleSave(updatedReport);
      }
    }
  };

  const handleEditModalSave = async () => {
    if (editingSection && report) {
      const updatedSections = report.sections.map(section =>
        section.id === editingSection.id ? { ...section, content: editingSection.content } : section
      );
      const updatedReport = { ...report, sections: updatedSections };
      setReport(updatedReport);
      await handleSave(updatedReport);
    }
    setShowEditModal(false);
    setEditingSection(null);
  };

  const handleEditModalCancel = () => {
    setShowEditModal(false);
    setEditingSection(null);
  };

  if (loading) {
    return <div className="p-6">Loading report...</div>
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>
  }

  if (!report) {
    return <div className="p-6">Report not found.</div>
  }

  const reasonForReferralSection = report.sections.find(s => s.sectionType === 'reason_for_referral')

  return (
    <>
      <Toaster />
      <div className="w-full p-6 grid grid-cols-1 md:grid-cols-2 gap-4 self-start">
        <Card className="mb-4 h-auto min-h-0">
          <CardContent>
            <CardTitle>{report.studentName || 'N/A'}</CardTitle>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <p className="text-gray-700">{report.title}</p>
              <p className="text-gray-700">{report.type}</p>
              <p className="text-gray-700">{report.studentId || 'N/A'}</p>
              <p className="text-gray-700">
                {report.finalizedDate
                  ? new Date(report.finalizedDate).toLocaleDateString()
                  : report.createdAt
                  ? new Date(report.createdAt).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        <ReportInputSection
          reportId={report.id}
          onGenerateAIAction={handleGenerateAI}
          aiGenerating={aiGenerating}
        />
      </div>
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={(event) => console.log('Drag Start:', event)} 
        onDragMove={(event) => console.log('Drag Move:', event)} 
        onDragEnd={onDragEnd}
      >
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">

          

          {/* Main container for the grouped report sections */}
          <div className="space-y-8 mt-6 md:col-span-2">
            {slpReportSectionGroups.map((group: SlpReportSectionGroup, groupIndex: number) => (
              <div key={groupIndex} className="group-container">
                <SectionHeader>{group.title}</SectionHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SortableContext items={report.sections.filter(section => group.sectionTypes.includes(section.sectionType)).map(s => s.id)} strategy={rectSortingStrategy}>
                    {report.sections
                      .filter(section => group.sectionTypes.includes(section.sectionType))
                      .map((section: ReportSection) => (
                        <SortableSection key={section.id} section={section} highlightedSections={highlightedSections} onEditClick={(sec) => { setEditingSection(sec); setShowEditModal(true); }} />
                      ))}
                  </SortableContext>
                </div>
              </div>
            ))}
          </div>

          {/* AI Review Modal */}
          <CustomModal
            isOpen={showReviewModal}
            onClose={() => setShowReviewModal(false)}
            title="Review AI Generated Content"
          >
            <p className="text-sm text-gray-500">
              Review the proposed changes. Uncheck any sections you do not wish to accept.
            </p>
            <div className="py-4 space-y-4">
              {proposedSections?.map((section: ReportSection) => (
                <div key={section.id} className="border p-3 rounded-md">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSectionsToAccept.includes(section.id)}
                      onChange={() => handleToggleSectionAccept(section.id)}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="font-semibold text-lg">{section.title}</span>
                  </label>
                  <div className="mt-2 p-2 bg-gray-50 rounded-md text-sm">
                    <p className="whitespace-pre-wrap">{section.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
              <div className="flex space-x-2 mb-2 sm:mb-0">
                <Button variant="secondary" onClick={handleAcceptAll}>Accept All</Button>
                <Button variant="secondary" onClick={handleRejectAll}>Reject All</Button>
              </div>
              <div className="flex space-x-2">
                <Button variant="secondary" onClick={() => setShowReviewModal(false)}>Cancel</Button>
                <Button onClick={handleConfirmAIChanges}>Confirm Selected</Button>
              </div>
            </div>
          </CustomModal>

          {/* Edit Section Modal */}
          <CustomModal
            isOpen={showEditModal}
            onClose={handleEditModalCancel}
            title={`Edit ${editingSection?.title || ''}`}
          >
            <p className="text-sm text-gray-500">
              Make changes to the section content below.
            </p>
            <div className="py-4">
              {editingSection && (
                <TiptapEditor
                  content={editingSection.content}
                  onChange={(newContent) => setEditingSection(prev => prev ? { ...prev, content: newContent } : null)}
                  editable={true}
                  withBorder={true}
                  scrollable={true}
                />
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={handleEditModalCancel}>Cancel</Button>
              <Button onClick={handleEditModalSave}>Save Changes</Button>
            </div>
          </CustomModal>
        </div>
      </DndContext>
    </>
  )
}