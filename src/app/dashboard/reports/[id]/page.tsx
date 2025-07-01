'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Report, ReportSection } from '@/lib/schemas/report'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import TiptapEditor from '@/components/TiptapEditor'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SectionHeader, Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { GripVertical } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useReport } from '@/lib/context/ReportContext'; // Import useReport

const SortableSection = ({ section, highlightedSections, onEditClick }: { section: ReportSection, highlightedSections: string[], onEditClick: (section: ReportSection) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="w-full">
      <Card
        className={`h-full cursor-pointer ${highlightedSections.includes(section.id) ? 'ai-highlight' : ''}`}
        onClick={() => onEditClick(section)}
      >
        <CardHeader>
          <CardTitle>{section.title}</CardTitle>
        </CardHeader>
        <CardContent className="relative h-32 overflow-hidden">
          <TiptapEditor
            content={section.content}
            editable={false}
            withBorder={false}
            scrollable={false}
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
        </CardContent>
        <div {...listeners} className="absolute top-2 right-2 cursor-grab">
            <GripVertical />
        </div>
      </Card>
    </div>
  );
};

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const supabase = createClient();
  const router = useRouter();

  const { report, setReport, loading, error, handleSave, handleDelete, showJson, setShowJson } = useReport(); // Use useReport hook

  const [unstructuredInput, setUnstructuredInput] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [highlightedSections, setHighlightedSections] = useState<string[]>([])
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [proposedSections, setProposedSections] = useState<ReportSection[] | null>(null);
  const [selectedSectionsToAccept, setSelectedSectionsToAccept] = useState<string[]>([]); // Sections selected in modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSection, setEditingSection] = useState<ReportSection | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  const slpReportSectionGroups = [
    {
      title: "Initial Information & Background",
      sectionTypes: [
        "reason_for_referral",
        "parent_concern",
        "health_developmental_history",
        "family_background",
      ],
    },
    {
      title: "Assessment Findings",
      sectionTypes: [
        "assessment_tools",
        "assessment_results",
        "language_sample",
        "validity_statement",
      ],
    },
    {
      title: "Summary, Eligibility & Recommendations",
      sectionTypes: [
        "eligibility_checklist",
        "conclusion",
        "recommendations",
        "accommodations",
      ],
    },
  ];

  useEffect(() => {
    async function fetchReport() {
      if (!id) return;
      // setLoading(true); // Loading state is now managed by ReportProvider
      // setError(null); // Error state is now managed by ReportProvider

      try {
        const response = await fetch(`/api/reports/${id}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setReport(data)
      } catch (err: any) {
        // setError(err.message) // Error state is now managed by ReportProvider
      } finally {
        // setLoading(false) // Loading state is now managed by ReportProvider
      }
    }

    fetchReport()
  }, [id, setReport]); // Add setReport to dependencies

  const handleSectionChange = (sectionId: string, newContent: string) => {
    setReport(prevReport => {
      if (!prevReport) return null
      const updatedSections = prevReport.sections.map(section =>
        section.id === sectionId ? { ...section, content: newContent } : section
      )
      return { ...prevReport, sections: updatedSections }
    })
  }

  const handleGenerateAI = async (primarySectionId: string) => {
    if (!report || !unstructuredInput) return
    setAiGenerating(true)
    // setError(null) // Error state is now managed by ReportProvider

    try {
      const response = await fetch('/api/ai/generate-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: report.id,
          sectionId: primarySectionId,
          unstructuredInput: unstructuredInput,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate content with AI')
      }

      const { updatedSections } = await response.json()
      setProposedSections(updatedSections);
      setShowReviewModal(true);
      setSelectedSectionsToAccept(updatedSections.map((sec: any) => sec.id));

      setUnstructuredInput('')
    } catch (err: any) {
      // setError(err.message) // Error state is now managed by ReportProvider
    } finally {
      setAiGenerating(false)
    }
  }

  const handleConfirmAIChanges = async () => {
    if (!report || !proposedSections) return;

    setReport(prevReport => {
      if (!prevReport) return null;
      let newSections = [...prevReport.sections];
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
      setHighlightedSections(newlyUpdatedIds);
      setTimeout(() => setHighlightedSections([]), 3000);
      return { ...prevReport, sections: newSections };
    });

    setShowReviewModal(false);
    setProposedSections(null);
    setSelectedSectionsToAccept([]);

    await handleSave();
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

  const onDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setReport((prevReport) => {
        if (!prevReport) return null;
        const oldIndex = prevReport.sections.findIndex((section) => section.id === active.id);
        const newIndex = prevReport.sections.findIndex((section) => section.id === over.id);
        return { ...prevReport, sections: arrayMove(prevReport.sections, oldIndex, newIndex) };
      });
    }
  };

  const handleEditModalSave = () => {
    if (editingSection) {
      handleSectionChange(editingSection.id, editingSection.content);
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
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className="p-6">
        <div className="flow-root mb-4">
          <dl className="-my-3 divide-y divide-gray-200 text-sm">
            <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
              <dt className="font-medium text-gray-900">Report Title</dt>
              <dd className="text-gray-700 sm:col-span-2">{report.title}</dd>
            </div>

            <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
              <dt className="font-medium text-gray-900">Report Type</dt>
              <dd className="text-gray-700 sm:col-span-2">{report.type}</dd>
            </div>

            <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
              <dt className="font-medium text-gray-900">Report Date</dt>
              <dd className="text-gray-700 sm:col-span-2">
                {report.finalizedDate ? new Date(report.finalizedDate).toLocaleDateString() : (report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A')}
              </dd>
            </div>
          </dl>
        </div>

        {/* AI Input and Generate Button - Moved to a general location */}
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <Label htmlFor="unstructured-input" className="text-md font-semibold mb-2 block">
            Unstructured Notes for AI Generation (Applies to entire report)
          </Label>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Textarea
                id="unstructured-input"
                value={unstructuredInput}
                onChange={(e) => setUnstructuredInput(e.target.value)}
                rows={4}
                placeholder="Enter notes, observations, or key points for AI generation. The AI will update relevant sections based on this input."
                className="w-full mb-2"
              />
              <Button
                onClick={() => handleGenerateAI(reasonForReferralSection?.id || '')}
                disabled={aiGenerating || !unstructuredInput}
              >
                {aiGenerating ? 'Generating...' : 'Generate with AI'}
              </Button>
            </div>
            <label
              htmlFor="File"
              className="flex flex-col items-center rounded border border-gray-300 p-4 text-gray-900 shadow-sm sm:p-6"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m0-3-3-3m0 0-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75"
                />
              </svg>

              <span className="mt-4 font-medium"> Upload your file(s) </span>

              <span
                className="mt-2 inline-block rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-center text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100"
              >
                Browse files
              </span>

              <input multiple type="file" id="File" className="sr-only" />
            </label>
          </div>
        </div>

        {showJson && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <h2 className="text-lg font-semibold mb-2">Full Report JSON</h2>
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        )}

        {/* Main container for the grouped report sections */}
        <div className="space-y-8 mt-6">
          {slpReportSectionGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="group-container">
              <SectionHeader>{group.title}</SectionHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SortableContext items={report.sections.filter(section => group.sectionTypes.includes(section.sectionType)).map(s => s.id)} strategy={rectSortingStrategy}>
                  {report.sections
                    .filter(section => group.sectionTypes.includes(section.sectionType))
                    .map(section => (
                      <SortableSection key={section.id} section={section} highlightedSections={highlightedSections} onEditClick={(sec) => { setEditingSection(sec); setShowEditModal(true); }} />
                    ))}
                </SortableContext>
              </div>
            </div>
          ))}
        </div>

        {/* AI Review Modal */}
        <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review AI Generated Content</DialogTitle>
              <DialogDescription>
                Review the proposed changes. Uncheck any sections you do not wish to accept.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {proposedSections?.map(section => (
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
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
              <div className="flex space-x-2 mb-2 sm:mb-0">
                <Button variant="secondary" onClick={handleAcceptAll}>Accept All</Button>
                <Button variant="secondary" onClick={handleRejectAll}>Reject All</Button>
              </div>
              <div className="flex space-x-2">
                <Button variant="secondary" onClick={() => setShowReviewModal(false)}>Cancel</Button>
                <Button onClick={handleConfirmAIChanges}>Confirm Selected</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Section Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {editingSection?.title}</DialogTitle>
              <DialogDescription>
                Make changes to the section content below.
              </DialogDescription>
            </DialogHeader>
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
            <DialogFooter>
              <Button variant="secondary" onClick={handleEditModalCancel}>Cancel</Button>
              <Button onClick={handleEditModalSave}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndContext>
  )
}